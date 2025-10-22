/* Service Worker (merged, scoped to /ToolHub/) */
self.__BUILD_HASH__ = self.__BUILD_HASH__ || "dev";
const BUILD = self.__BUILD_HASH__;
const CACHE_VERSION = `v${BUILD}`;
const PRECACHE = `precache-${CACHE_VERSION}`;
const RUNTIME = `runtime-${CACHE_VERSION}`;
const ROOT = '/ToolHub';

const CORE_ASSETS = [
  `${ROOT}/`,
  `${ROOT}/index.html`,
  `${ROOT}/manifest.json`,
  `${ROOT}/assets/diversey-icon-512.png`,
  `${ROOT}/assets/favicon.ico`,
  `${ROOT}/assets/diversey-logo.png`,
  `${ROOT}/js/pwa-init.js`,
  `${ROOT}/js/in-app-navigation.js`
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(PRECACHE);
    await cache.addAll(CORE_ASSETS.map(url => new Request(url, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (!k.endsWith(CACHE_VERSION) ? caches.delete(k) : null)));
    await self.clients.claim();
    const clientsList = await self.clients.matchAll({ type: 'window' });
    for (const client of clientsList) client.postMessage({ type: 'SW_ACTIVATED', version: CACHE_VERSION });
  })());
});

const OFFLINE_FALLBACK = new Response(`<!doctype html><meta charset="utf-8"><title>Offline</title><body style="font:16px system-ui;padding:2rem;line-height:1.5"><h1>Offline</h1><p>You're offline. Try again when you have a connection.</p></body>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' }});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  if (req.headers.get('accept')?.includes('text/html')) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(new Request(req, { cache: 'no-store' }));
        const cache = await caches.open(RUNTIME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        const cache = await caches.open(RUNTIME);
        const cached = await cache.match(req);
        if (cached) return cached;
        if (url.pathname === `${ROOT}/`) return (await caches.open(PRECACHE)).match(`${ROOT}/index.html`);
        return OFFLINE_FALLBACK;
      }
    })());
    return;
  }

  if (url.pathname.endsWith('/tools.json')) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME);
      const cached = await cache.match(req);
      const fetchPromise = fetch(new Request(req, { cache: 'no-store' }))
        .then(async (res) => {
          if (res && res.ok) {
            const prev = cached ? await cached.clone().text() : null;
            const next = await res.clone().text();
            cache.put(req, res.clone());
            if (prev !== next) {
              const clientsList = await self.clients.matchAll({ type: 'window' });
              for (const client of clientsList) client.postMessage({ type: 'TOOLS_UPDATED' });
            }
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })());
    return;
  }

  if (/\.(?:png|svg|ico|jpg|jpeg|webp|gif|css|js|woff2?)$/i.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(PRECACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        return cached || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME);
    try {
      const fresh = await fetch(req);
      cache.put(req, fresh.clone());
      return fresh;
    } catch (e) {
      const cached = await cache.match(req);
      return cached || Response.error();
    }
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});