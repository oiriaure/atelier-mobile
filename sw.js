// Atelier — service worker : l'app s'ouvre même sans réseau.
const CACHE = 'atelier-v32';
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
