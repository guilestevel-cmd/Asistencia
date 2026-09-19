// Service worker de Aula: la app abre aunque no haya internet.
// Las llamadas a Google Apps Script NUNCA se cachean (los datos siempre vienen de la hoja).
const VERSION = 'aula-v1';
const BASE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const host = new URL(req.url).hostname;
  if (host.endsWith('script.google.com') || host.endsWith('googleusercontent.com')) return;

  // Se sirve lo guardado al instante y se actualiza en segundo plano.
  e.respondWith(
    caches.match(req).then(guardado => {
      const red = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copia = res.clone();
          caches.open(VERSION).then(c => c.put(req, copia));
        }
        return res;
      }).catch(() => guardado);
      return guardado || red;
    })
  );
});
