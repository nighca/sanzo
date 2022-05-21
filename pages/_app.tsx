import { EffectCallback, useEffect, useRef, useState } from 'react'
import type { AppProps } from 'next/app'

import './global.css'

function useEffectOnce(fn: EffectCallback) {
  const didRun = useRef(false)
  useEffect(() => {
    if (!didRun.current) {
      didRun.current = true
      fn()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}

function useServiceWorker() {

  const [registered, setRegistered] = useState(false)

  useEffectOnce(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').then(
          function (registration) {
            console.log(
              'Service Worker registration successful with scope: ',
              registration.scope
            )
            setRegistered(true)
          },
          function (err) {
            console.log('Service Worker registration failed: ', err)
          }
        )
      })
    }
  })

  return registered
}

function MyApp({ Component, pageProps }: AppProps) {
  const registered = useServiceWorker()
  if (!registered) return null
  return <Component {...pageProps} />
}

export default MyApp
