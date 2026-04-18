'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // Force-update any existing registrations (kills iOS stale-cache problem)
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(r => r.update())
    })

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(reg => {
        console.log('[SW] registered:', reg.scope)
        // Always check for a newer SW on page load
        reg.update()
      })
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
