// بدّل هذا الرقم (v1 -> v2 ...) كل ما تعدّل index.html تعديل مهم،
// هيك المتصفح بيمسح النسخة القديمة المخزّنة ويجيب الجديدة.
const CACHE = 'supermarket-v6';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

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
  // طلبات خارج نطاق التطبيق (رابط المزامنة على Google Apps Script، صور Drive...)
  // ما لازم نخزّنها ولا نعيد القديم منها — لازم تجي مباشرة من الشبكة كل مرة،
  // وإلا البيانات بتضل عايضة حتى بعد "تحديث" (مشكلة فعلية شفناها بلوحة الأدمن).
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request)
        .then((res) => {
          if (res && res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => cached || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined));
      return cached || network;
    })
  );
});
