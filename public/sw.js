const CACHE = 'daily-news-agent-v1';
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(['/', '/manifest.json', '/icon.svg'])));
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/news')) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
