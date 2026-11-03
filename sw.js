/* Service worker：離線快取網頁本體與 Leaflet（底圖圖磚不快取）
   更新網頁後請把 VERSION 改掉，手機重新開啟即會換新版 */
const VERSION = 'thsr-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const sameOrigin = url.origin === self.location.origin;
  const isLeaflet = url.hostname === 'cdnjs.cloudflare.com' && url.pathname.includes('/leaflet/');
  if (!sameOrigin && !isLeaflet) return;           // 圖磚等其他請求直接走網路
  // 網路優先、失敗時用快取（有網路時自動拿到新版）
  e.respondWith(fetch(e.request).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
});
