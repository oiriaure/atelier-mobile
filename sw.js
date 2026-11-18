// Atelier — service worker : l'app s'ouvre même sans réseau.
const CACHE = 'atelier-v33';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png', './lib/qrcode.js', './formation.js', './favicon.png', './icones/atelier.png', './icones/revisions.png', './icones/boussole.png', './icones/trousseau.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
// Réseau d'abord (pour recevoir les mises à jour), cache si hors ligne. Les appels GitHub/Gemini ne passent pas par ici.
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r; })
      .catch(() => caches.match(e.request).then(m => m || caches.match('./index.html')))
  );
});

// Notifications (4.5) : envoyées par le workflow GitHub « Notifications » (branche notifs) en Web Push.
self.addEventListener('push', e => {
  let d = {};
  try{ d = e.data ? e.data.json() : {}; }catch{ d = {corps:e.data ? e.data.text() : ''}; }
  e.waitUntil(self.registration.showNotification(d.titre || 'Atelier', {body:d.corps || '', icon:'icon-192.png', badge:'icon-192.png', tag:d.id || undefined, data:{vue:d.vue || 'today'}}));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const vue = (e.notification.data && e.notification.data.vue) || 'today';
  e.waitUntil(self.clients.matchAll({type:'window', includeUncontrolled:true}).then(cs => {
    for(const c of cs){ c.postMessage({type:'vue', vue}); if('focus' in c) return c.focus(); }
    return self.clients.openWindow('./?vue=' + encodeURIComponent(vue));
  }));
});
