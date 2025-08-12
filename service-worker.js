
// Auto-refresh SW with broadcast on activate; network-first for HTML & tools.json
const CACHE_VERSION = "v4-202508120249";
const CACHE_NAME = 'app-cache-' + CACHE_VERSION;

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/diversey-icon-512.png',
  './assets/favicon.ico',
  './assets/diversey-logo.png',
  './js/app.js',
  './js/analytics.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME) ? caches.delete(k) : null));
    await self.clients.claim();
    // tell all clients to reload once after we activate
    const clientsList = await self.clients.matchAll({ type: 'window' });
    for (const client of clientsList) {
      client.postMessage({ type: 'SW_ACTIVATED_RELOAD', version: CACHE_VERSION });
    }
  })());
});

// Network-first for navigations (HTML) & tools.json; cache-first for others
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET') return;

  const isHTML = req.mode === 'navigate' || url.pathname.endsWith('/index.html');
  const isTools = url.pathname.endsWith('/tools.json') || url.pathname.endsWith('tools.json');

  if (isHTML || isTools) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (err) {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);
        if (cached) return cached;
        if (isHTML) return await cache.match('./index.html');
        throw err;
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      cache.put(req, fresh.clone());
      return fresh;
    } catch (err) {
      return cached || Response.error();
    }
  })());
});
