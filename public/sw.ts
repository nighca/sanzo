const scope = self as unknown as ServiceWorkerGlobalScope

const targetHost = '.qiniu.io'

scope.addEventListener('fetch', async (event: FetchEvent) => {
  const { request } = event
  console.debug('fetch:', request.url)
  const { hostname } = new URL(request.url)

  if (!hostname.endsWith(targetHost)) {
    console.debug('bythrough:', request.url)
    event.respondWith(fetch(event.request))
    return
  }

  event.respondWith(retrieve(request))
})

async function resolve(domain: string): Promise<string[]> {
  const resp = await fetch('/api/resolve?domain=' + domain)
  const ips = await resp.json()
  return ips
}

function withIp(originalReq: Request, ip: string, protocol = 'http') {
  const url = new URL(originalReq.url)
  url.protocol = protocol
  url.hostname = ip
  return new Request(url.href, originalReq)
}

async function testIp(ip: string, originalReq: Request) {
  const req = withIp(originalReq, ip)
  await fetch(req)
  return ip
}

async function retrieve(request: Request) {
  const { hostname } = new URL(request.url)
  console.time('retrieve')
  const ips = await resolve(hostname)
  console.timeLog('retrieve', 'resolved:', ips)
  const ip = await Promise.any(ips.map(ip => testIp(ip, request)))
  console.timeLog('retrieve', 'respondWith:', ip)
  const newReq = withIp(request, ip)
  const resp = await fetch(newReq)
  console.timeEnd('retrieve')
  return resp
}
