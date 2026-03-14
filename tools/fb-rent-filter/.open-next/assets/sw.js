// FB 租屋過濾器 Service Worker
// 最小化 SW：讓瀏覽器允許 PWA 安裝，不需要複雜的 cache 邏輯

const CACHE_NAME = 'fb-rent-v1';
const STATIC_ASSETS = ['/', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // 清除舊 cache
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first：讓 API 永遠走網路，靜態資源才考慮 cache
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) {
    // API 請求直接走網路
    event.respondWith(fetch(event.request));
    return;
  }
  // 其他走 network-first，fallback cache
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
