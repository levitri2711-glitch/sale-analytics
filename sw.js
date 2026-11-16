// Service worker: lưu giao diện để mở khi mất mạng; không lưu dữ liệu gọi máy chủ.
const VERSION = 'sa-shell-v2';
const SHELL = ['./', 'index.html', 'app.css', 'sale.css', 'config.js', 'icon.svg', 'manifest.webmanifest', 'js/core.js', 'js/data.js', 'js/views-a.js', 'js/views-b.js', 'js/views-c.js', 'js/docs.js', 'js/xlsx.js', 'js/actions.js', 'js/legal.js', 'js/app.js'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.includes('/api')) return;
  e.respondWith(fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); } return res; })
    .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('index.html'))));
});
