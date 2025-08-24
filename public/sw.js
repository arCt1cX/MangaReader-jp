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
  // Skip caching for external manga images, API calls, and placeholder images
  if (event.request.url.includes('uploads.mangadex.org') || 
      event.request.url.includes('manga-reader-server') ||
      event.request.url.includes('api/') ||
      event.request.url.includes('via.placeholder.com')) {
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
