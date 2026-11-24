// Growlift Comercial: service worker of the installed panel. It only shows phone alerts;
// it caches nothing (customer data stays on the server).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let aviso = { titulo: 'Growlift Comercial', corpo: 'Toque para abrir', link: '/painel' };
  try {
    if (event.data) aviso = { ...aviso, ...event.data.json() };
  } catch {}
  const link = typeof aviso.link === 'string' && aviso.link.startsWith('/painel') ? aviso.link : '/painel';
  event.waitUntil(
    self.registration.showNotification(aviso.titulo, {
      body: aviso.corpo,
      icon: '/icones/app-192.png',
      badge: '/icones/selo-96.png',
      data: { link },
      tag: link,
      renotify: true,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || '/painel';
  const destino = new URL(link, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) => {
      for (const j of janelas) {
        if (new URL(j.url).origin === self.location.origin && 'focus' in j) {
          return j.focus().then((f) => (f && 'navigate' in f ? f.navigate(destino) : f));
        }
      }
      return self.clients.openWindow(destino);
    }),
  );
});
