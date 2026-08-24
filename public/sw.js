// Minimal service worker whose only job is to satisfy the browser's PWA
// installability check (manifest + a registered service worker with a
// fetch handler). It doesn't cache anything -- this app is just a thin
// client over live Supabase data, so serving stale content offline would
// be more confusing than useful. Every request just passes straight
// through to the network as if there were no service worker at all.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // No respondWith() -- default network behavior.
})
