
const CACHE_NAME = 'app-cache-v20250812023713';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/js/app.js',
  '/js/analytics.js',
  '/tools.json?v=20250812023713',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.pathname === '/' || url.pathname.endsWith('/index.html')) {
    return e.respondWith(fetch(e.request).catch(() => caches.match('/index.html')));
  }
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});
