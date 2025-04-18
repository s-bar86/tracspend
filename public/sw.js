const CACHE_NAME = 'tracspend-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
