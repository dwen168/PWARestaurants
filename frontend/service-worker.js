const CACHE_NAME = 'pwa-restaurants-v1';
const ASSETS = [
  "/", 
  "/index.html",
  '/styles.css',
  '/manifest.json'
  // note: intentionally NOT precaching add_rating.html, add_rating.js or app.js to avoid stale cached copies during development
];

self.addEventListener("install", event => {
  // Bypassing pre-caching.
  self.skipWaiting();
});

self.addEventListener("fetch", event => {
  // Cache is disabled, always fetch from the network.
  event.respondWith(fetch(event.request));
});