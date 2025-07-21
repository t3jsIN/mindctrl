import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST);

// Clean up outdated caches
cleanupOutdatedCaches();

// Basic caching strategy
self.addEventListener('fetch', (event) => {
  // Let the browser handle non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Cache-first strategy for static assets
  if (event.request.url.includes('/static/') || 
      event.request.url.includes('/_app/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});