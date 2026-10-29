const CACHE = 'km-shell-v1.5.0';
const SHELL = ['./', './index.html', './styles.css', './app.js', './template-catalog.js', './assets/favicon.ico?v=1.2.0', './assets/icon-32.png?v=1.2.0', './assets/icon-48.png?v=1.2.0', './assets/icon.svg', './assets/diszkertek-logo.png', './assets/icon.svg?v=1.2.0', './assets/icon-192.png?v=1.2.0', './assets/icon-512.png?v=1.2.0', './assets/botanical.svg', './assets/icon-192.png', './assets/icon-512.png', './manifest.webmanifest'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('km-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('message', event => { if (event.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok && SHELL.some(path => new URL(path, self.registration.scope).href === event.request.url)) {
      const copy = response.clone(); event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy)));
    }
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || (event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
