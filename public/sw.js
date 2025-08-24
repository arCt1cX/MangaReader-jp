const CACHE_NAME = 'manga-reader-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  // Skip caching for external manga images and API calls
  if (event.request.url.includes('uploads.mangadx.org') || 
      event.request.url.includes('manga-reader-server') ||
      event.request.url.includes('api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch(() => {
          // Return a fallback for failed requests
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
