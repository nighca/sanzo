/* eslint-disable @next/next/no-sync-scripts */
import type { NextPage } from 'next'
import Head from 'next/head'
import styles from './style.module.css'

const originalHost = 'sanzo.io'
const targetHost = 'opmna640q.qnssl.com'

const nertInitScriptContent = `
netr.initProxy('/sw-0.0.1-alpha.10.umd.js', {
  app: { appID: 'id', appSalt: 'salt' },
  domains: ['qiniucdn-sdk.qbox.net']
})
`

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Sanzo</title>
        <meta name="description" content="Sanzo is a demo for customized resource retrieval based on Service Worker API." />
        <link rel="icon" href="/favicon.ico" />
        <script src="/netr-0.0.1-alpha.10.umd.js" />
        <script dangerouslySetInnerHTML={{ __html: nertInitScriptContent }} />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Sanzo
        </h1>

        <p className={styles.description}>
          <a href="https://github.com/nighca/sanzo">Sanzo</a> is a demo for customized resource retrieval based on&nbsp;
          <a
            target="_blank"
            rel="noreferrer"
            href="https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API"
          >
            Service Worker API
          </a>.
        </p>

        <ul className={styles.grid}>

          <li className={styles.card}>
            <h2>Image</h2>
            <img alt="Fabric" src="https://qiniucdn-sdk.qbox.net/sample/fabric.jpeg" />
          </li>

          <li className={styles.card}>
            <h2>Video</h2>
            <video controls src="https://qiniucdn-sdk.qbox.net/sample/forest.mp4"></video>
          </li>

          <li className={styles.card}>
            <h2>Audio</h2>
            <audio controls src="https://qiniucdn-sdk.qbox.net/sample/ukulele.mp3"></audio>
          </li>

          {/* <li className={styles.card}>
            <h2>Long Video</h2>
            <video controls src="https://sanzo.io/sanzo/samples/the-internets-own-boy.ogv"></video>
            <UrlInfo path='/sanzo/samples/the-internets-own-boy.ogv' />
          </li> */}

        </ul>

      </main>
    </div>
  )
}

function UrlInfo({ path }: { path: string }) {
  const originalUrl = `https://${originalHost}/${path}`
  const newUrl = `https://${targetHost}/${path}`
  return (
    <p className={styles.url}>
      <a target="_blank" rel="noreferrer" href={originalUrl}><code>{originalHost}</code></a>&nbsp;
      &rarr;
      &nbsp;<a target="_blank" rel="noreferrer" href={newUrl}><code>{targetHost}</code></a>
    </p>
  )
}

export default Home
