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
  const [error, setError] = useState<string | null>(null)

  useEffectOnce(() => {
    if (!('serviceWorker' in navigator)) {
      setError('Your browser does not support Service Worker.')
      return
    }
    navigator.serviceWorker.register('/service-worker.js').then(
      registration => {
        console.debug(
          'Service Worker registration successful with scope: ',
          registration.scope
        )
        setRegistered(true)
      },
      err => {
        setError(`Service Worker registration failed: ${err}.`)
      }
    )
  })

  return { registered, error }
}

function MyApp({ Component, pageProps }: AppProps) {
  // const { registered, error } = useServiceWorker()
  // if (error != null) return error
  // if (!registered) return 'Service Worker registering...'
  return <Component {...pageProps} />
}

export default MyApp
