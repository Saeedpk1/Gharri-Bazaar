const CACHE_NAME = 'malakand-motors-v3';
const ALWAYS_FRESH = ['./index.html', './manifest.json', './admin.html'];
const CACHE_FIRST = ['./icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_FIRST))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isAlwaysFresh = ALWAYS_FRESH.some((p) => req.url.endsWith(p.replace('./', '/'))) || req.mode === 'navigate';
  const isCacheFirst = CACHE_FIRST.some((p) => req.url.endsWith(p.replace('./', '/')));

  if (isAlwaysFresh) {
    // Always try the network first so updates to the page show up immediately.
    // Only fall back to the cached copy if there's truly no connection.
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req))
    );
  } else if (isCacheFirst) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
  } else if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req))
    );
  }
  // Cross-origin requests (Supabase, fonts, CDN) go straight to the network as normal.
});

  
