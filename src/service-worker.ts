const scope = self as unknown as ServiceWorkerGlobalScope

const targetHost = 'sanzo.io'

scope.addEventListener('fetch', async (event: FetchEvent) => {
  const { request } = event
  console.debug('fetch:', request.url)

  if (!shouldRetrieveFromNodes(request)) {
    console.debug('bythrough:', request.url)
    event.respondWith(fetch(event.request))
    return
  }

  event.respondWith(retrieveFromNodes(request))
})

/** Should retrieve resource from nodes */
function shouldRetrieveFromNodes(req: Request) {
  const { hostname } = new URL(req.url)
  const target = 'sanzo.io'
  return (
    hostname === target
    || hostname.endsWith('.' + target)
  )
}

/** Get nodes with given resource url */
async function resolveNodes(url: string): Promise<string[]> {
  const resp = await fetch('/api/resolve?url=' + encodeURIComponent(url))
  const ips = await resp.json()
  return ips
}

/** Construct new `Request` instance with given node & original request */
function withNode(
  originalReq: Request,
  node: string,
  init?: RequestInit
) {
  const {
    cache, credentials, headers, integrity, method,
    mode, redirect, referrer, referrerPolicy, body,
    url: originalUrl
  } = originalReq
  const urlObject = new URL(originalUrl)
  urlObject.hostname = node
  const req = new Request(urlObject.href, {
    mode: 'cors',
    credentials: 'omit',
    cache, integrity, method, redirect,
    referrer, referrerPolicy, headers, body,
    ...init
  })
  return req
}

/** Check if node available */
async function checkNode(node: string, req: Request) {
  const newReq = withNode(req, node, { method: 'HEAD' })
  await fetch(newReq)
  return node
}

/** Retrieve resource content from our nodes */
async function retrieveFromNodes(request: Request) {
  const nodes = await resolveNodes(request.url)
  const node = await Promise.any(nodes.map(
    // TODO: abort pending requests
    node => checkNode(node, request)
  ))
  const newReq = withNode(request, node)
  const resp = await fetch(newReq)
  return resp
}
