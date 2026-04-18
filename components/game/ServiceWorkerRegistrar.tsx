'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(reg => console.log('[SW] registered:', reg.scope))
      .catch(err => console.warn('[SW] registration failed:', err))

    // When a new SW takes control (version bump), reload so fresh JS loads
    let reloading = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return
      reloading = true
      window.location.reload()
    })
  }, [])

  return null
}
