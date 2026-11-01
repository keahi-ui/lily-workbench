const CACHE_NAME = 'lily-workbench-v39';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './css/style.css',
  './js/supabase.js',
  './js/store.js',
  './js/ui.js',
  './js/pages.js',
  './js/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Supabase SDK 始终从网络获取（不缓存 CDN 资源）
  if (event.request.url.includes('supabase') || event.request.url.includes('jsdelivr')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // HTML 页面：网络优先，确保总是拿到最新版本
  const isHTML = event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html');

  if (isHTML) {
    event.respondWith(
      fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // JS/CSS 等静态资源：缓存优先
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      }).catch(() => cached);
    })
  );
});
