// Flappy Bare v4 — Service Worker
// HTML navigation: NETWORK-FIRST (always fresh JS bundle hashes)
// /_next/static/: cache-first (content-hashed, immutable)
// Media assets: cache-first

const CACHE_VERSION = 'flappy-bare-v4'
const STATIC_CACHE = `${CACHE_VERSION}-static`

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache =>
      cache.addAll(['/offline.html']).catch(() => {})
    )
  )
  self.skipWaiting()
})

// Activate — evict all old caches, take control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('flappy-bare-') && k !== STATIC_CACHE)
          .map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // API: network-only, never cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: 'Offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    )
    return
  }

  // Next.js hashed bundles: cache-first (immutable content-hash URLs)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached
        return fetch(event.request).then(response => {
          if (response.ok) {
            caches.open(STATIC_CACHE).then(c => c.put(event.request, response.clone()))
          }
          return response
        })
      })
    )
    return
  }

  // Static media (bear.png, icons, favicon): cache-first
  if (
    url.pathname === '/bear.png' ||
    url.pathname === '/favicon.svg' ||
    url.pathname.startsWith('/icons/')
  ) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached
        return fetch(event.request).then(response => {
          if (response.ok) {
            caches.open(STATIC_CACHE).then(c => c.put(event.request, response.clone()))
          }
          return response
        })
      })
    )
    return
  }

  // HTML navigation: NETWORK-FIRST so new JS bundle hashes always load
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Keep fresh copy for offline fallback
          caches.open(STATIC_CACHE).then(c => c.put(event.request, response.clone()))
          return response
        })
        .catch(() =>
          caches.match(event.request).then(c => c || caches.match('/offline.html'))
        )
    )
    return
  }

  // Everything else: network-first, cache fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})
