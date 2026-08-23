// بدّل هذا الرقم (v1 -> v2 ...) كل ما تعدّل index.html تعديل مهم،
// هيك المتصفح بيمسح النسخة القديمة المخزّنة ويجيب الجديدة.
const CACHE = 'admin-v1';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // /admin-save و /admin-load مسارات خادم PowerShell المحلي فقط —
  // ما لازم نتدخّل فيهن هون؛ خلّيهم يفشلوا مباشرة ع GitHub Pages
  // (الكود بالصفحة نفسه بيتعامل مع الفشل بلطف).
  if (e.request.url.includes('/admin-save') || e.request.url.includes('/admin-load')) return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request)
        .then((res) => {
          if (res && res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
