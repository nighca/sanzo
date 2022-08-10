import { FormEvent, useState } from 'react'

async function callConnectApi(offer: RTCSessionDescription) {
  const resp = await fetch('http://localhost:8000/connect', {
    method: 'POST',
    body: JSON.stringify(offer.toJSON())
  })
  if (!resp.ok) {
    throw new Error(`Connect failed, status ${resp.status}`)
  }
  const answer: RTCSessionDescription = await resp.json()
  return answer
}

async function waitUntilIceGatheringStateComplete(connection: RTCPeerConnection) {
  if (connection.iceGatheringState === 'complete') {
    return
  }

  return new Promise<void>((resolve, reject) => {

    function handleIceGatheringStateChange() {
      if (connection.iceGatheringState === 'complete') {
        connection.removeEventListener('icegatheringstatechange', handleIceGatheringStateChange)
        resolve()
      }
    }

    connection.addEventListener('icegatheringstatechange', handleIceGatheringStateChange)

  })
}

const commandLabel = 'command'
const dataLabelPrefix = 'data|'

type Disposer = () => void

interface CommandRequest {
  id: string
  url: string
}

interface CommandResponse {
  id: string
  size: number
}

class Fetcher {

  private connection = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  })

  private commandChannel = this.createChannel(commandLabel)

  private sendCommand(req: CommandRequest) {
    // TODO: event open
    this.commandChannel.send(JSON.stringify(req))
  }

  private onCommand(handler: (resp: CommandResponse) => void) {
    function handleMessage(e: MessageEvent) {
      handler(JSON.parse(e.data))
    }
    this.commandChannel.addEventListener('message', handleMessage)
    return () => this.commandChannel.removeEventListener('message', handleMessage)
  }

  private createChannel(label: string) {
    const channel = this.connection.createDataChannel(label)
    channel.addEventListener('open', () => {
      console.debug(`channel ${label} open`)
    })
    channel.addEventListener('message', e => {
      console.debug(`channel ${label} message`, e.data)
    })
    return channel
  }

  async initialize() {
    const { connection } = this

    const offer = await connection.createOffer()
    console.debug('setLocalDescription')
    await connection.setLocalDescription(offer)
    console.debug('waitUntilIceGatheringStateComplete')
    await waitUntilIceGatheringStateComplete(connection)
    console.debug('callConnectApi')
    const answer = await callConnectApi(connection.localDescription!)
    console.debug('setRemoteDescription')
    await connection.setRemoteDescription(answer)
  }

  dispose() {
    this.commandChannel.close()
    this.connection.close()
  }

  private fetchNonce = 0

  private getFetchId() {
    const nonce = this.fetchNonce++
    return nonce + ''
  }

  private makeStream() {
    return new Promise<[ReadableStream, ReadableStreamController<ArrayBuffer>]>(resolve => {
      let result: [any, any] = [null, null]
      function tryResolve() {
        if (result[0] != null && result[1] != null) {
          resolve(result)
        }
      }
      const readableStream = new ReadableStream<ArrayBuffer>({
        start(controller) {
          result[1] = controller
          tryResolve()
        }
      })
      result[0] = readableStream
      tryResolve()
    })
  }

  async fetch(url: string): Promise<Response> {
    const id = this.getFetchId()
    this.sendCommand({ id, url })

    const disposers: Disposer[] = []
    let commandResp: CommandResponse | null = null
    let received = 0

    let dataChannel: RTCDataChannel | null = null
    disposers.push(() => dataChannel?.close())

    const [stream, streamController] = await this.makeStream()
    console.debug('makeStream', stream, streamController)
    disposers.push(() => streamController.close())

    // 检查是否传输完成，若完成，则做收尾工作
    function checkEnd() {
      console.debug('checkEnd', received, '/', commandResp?.size)
      if (commandResp == null) return
      if (received < commandResp.size) return
      disposers.forEach(disposer => disposer())
    }

    function handleDatachannel(e: RTCDataChannelEvent) {
      const channel = e.channel
      const label = channel.label
      if (!label.startsWith(dataLabelPrefix)) return
      const fetchIdOfChannel = label.slice(dataLabelPrefix.length)
      if (fetchIdOfChannel !== id) return
      dataChannel = channel

      function onError(e: Event) {
        streamController.error(e)
      }
      dataChannel.addEventListener('error', onError)
      disposers.push(() => dataChannel?.removeEventListener('error', onError))

      // dataChannel.addEventListener('closing', e => {
      //   // TODO
      // })

      // dataChannel.addEventListener('close', e => {
      //   // TODO
      // })

      function onMessage(e: MessageEvent) {
        const data: ArrayBuffer = e.data
        streamController.enqueue(data)
        received += data.byteLength
        console.debug('dataChannel message', data.byteLength)
        checkEnd()
      }
      dataChannel.addEventListener('message', onMessage)
      disposers.push(() => dataChannel?.removeEventListener('message', onMessage))
    }

    this.connection.addEventListener('datachannel', handleDatachannel)
    disposers.push(() => this.connection.removeEventListener('datachannel', handleDatachannel))

    return new Promise((resolve, reject) => {

      // TODO: time out

      disposers.push(this.onCommand(resp => {
        const response = new Response(stream/** TODO: headers */)
        resolve(response)
        commandResp = resp
        checkEnd()
      }))
    })
  }

}

async function readTextFromStream(stream: ReadableStream) {
  const reader = stream.getReader()
  let data = new Uint8Array()
  while (true) {
    const { done, value } = await reader.read()
    console.debug('readTextFromStream', done, value)
    if (done) break
    const arrayBuffer: ArrayBuffer = value
    data = new Uint8Array([...data, ...new Uint8Array(arrayBuffer)])
  }
  const text = new TextDecoder().decode(data)
  return text
}

async function makeBlobFromStream(stream: ReadableStream) {
  const reader = stream.getReader()
  const data: ArrayBuffer[] = []
  while (true) {
    const { done, value } = await reader.read()
    console.debug('makeBlobFromStream', done, value)
    if (done) break
    const arrayBuffer: ArrayBuffer = value
    data.push(arrayBuffer)
  }
  const blob = new Blob(data)
  return blob
}

function getFilename(url: string) {
  const pattern = /\/([^\/]+)$/
  const u = new URL(url)
  const matched = pattern.exec(u.pathname)
  if (matched == null) return 'unknown'
  return matched[1]
}

function FetchFile({ fetcher }: { fetcher: Fetcher }) {
  // const [url, setUrl] = useState('https://ipfs-gw.dspool.io/ipfs/bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygqic223w5sk3m')
  const [url, setUrl] = useState('https://www.baidu.com/img/PCtm_d9c8750bed0b3c7d089fa7d55720d6cf.png')
  const [fetching, setFetching] = useState(false)
  const [resp, setResp] = useState<Response>()
  const [objectUrl, setObjectUrl] = useState<string>()

  async function handleSubmit() {
    if (!url) {
      alert('Invalid url')
      return
    }

    setFetching(true)
    try {
      const fetchResp = await fetcher.fetch(url)
      console.debug('fetch response:', fetchResp)
      setResp(fetchResp)
      const blob = await makeBlobFromStream(fetchResp.body!)
      const objectUrl = URL.createObjectURL(blob)
      setObjectUrl(objectUrl)
    } catch (e) {
      console.warn('fetch failed:', e)
    } finally {
      setFetching(false)
    }
  }

  return (
    <>
      <p>
        <input type="text" style={{ width: '240px' }} value={url} onChange={e => setUrl(e.target.value)} />
        &nbsp;{objectUrl != null && (
          <a download={getFilename(url)} href={objectUrl}>Download</a>
        )}
      </p>
      <p>
        <button type="button" disabled={fetching} onClick={handleSubmit}>Fetch</button>
      </p>
    </>
  )
}

export default function WebRTC() {
  const [fetcher, setFetcher] = useState<Fetcher | null>(null)
  const [initializing, setInitializing] = useState(false)

  async function handleInitialize() {
    const fetcher = new Fetcher()
    setFetcher(fetcher)

    try {
      setInitializing(true)
      await fetcher.initialize()
    } catch (e) {
      setFetcher(null)
    } finally {
      setInitializing(false)
    }
  }

  function handleDispose() {
    if (fetcher == null) return
    fetcher.dispose()
    setFetcher(null)
  }

  const fetcherReady = fetcher != null && !initializing

  const statusView = (() => {
    if (fetcher == null) return 'No fetcher'
    if (initializing) return 'Fetcher initializing'
    return 'Fetcher ready'
  })()

  return (
    <section style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <p>{statusView}</p>
      <p>
        <button type='button' disabled={fetcher != null} onClick={handleInitialize}>Initialize</button>&nbsp;
        <button type='button' disabled={!fetcherReady} onClick={handleDispose}>Dispose</button>
      </p>
      {fetcherReady && <FetchFile fetcher={fetcher} />}
    </section>
  )
}
