// MindCTRL Service Worker - Pure JavaScript

// Handle app updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle installation
self.addEventListener('install', (event) => {
  console.log('MindCTRL Service Worker installing...');
  self.skipWaiting();
});

// Handle activation
self.addEventListener('activate', (event) => {
  console.log('MindCTRL Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Basic fetch handler
self.addEventListener('fetch', (event) => {
  // Let the browser handle all requests normally for now
  return;
});

console.log('MindCTRL Service Worker loaded');