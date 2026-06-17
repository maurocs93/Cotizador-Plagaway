// Plagaway PWA Service Worker — v8.2 (network-first para HTML)
// Cambia este número en cada deploy para forzar actualización del caché
const V = 'pw-v8-2';
const ASSETS = ['/index.html','/docs.html','/clientes.html','/checklist.html','/inventario.html','/reportes.html','/manifest.json'];

// Instalar: cachear assets y activar de inmediato
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(ASSETS.map(a => new Request(a, {cache:'reload'})))));
  self.skipWaiting();
});

// Activar: borrar cachés viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Fetch:
// - HTML y JS → NETWORK-FIRST: siempre busca la versión nueva, cae al caché solo sin internet
// - Resto (imágenes, etc) → cache-first
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  const isHTML = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('.js');

  if (isHTML) {
    // Network-first
    e.respondWith(
      fetch(req).then(res => {
        // Guardar copia fresca en caché
        const copy = res.clone();
        caches.open(V).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('/index.html')))
    );
  } else {
    // Cache-first para assets estáticos
    e.respondWith(caches.match(req).then(r => r || fetch(req)));
  }
});
