/* Service worker : met la « coquille » de l'application en cache (ouverture instantanée).
   Les données et l'application Apps Script passent toujours par le réseau. */
var CACHE = 'sencsu-shell-v2';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png'];

self.addEventListener('install', function (e) {
  // Tolérant : un fichier manquant (ex. icône mal publiée) n'empêche pas l'installation du service worker
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;   // Apps Script : réseau uniquement
  // page, config.js et manifeste : réseau d'abord (les mises à jour sont prises en compte), cache en secours hors ligne
  if (/config\.js$|manifest\.webmanifest$/.test(req.url) || req.mode === 'navigate' || /\/(index\.html)?$/.test(new URL(req.url).pathname)) {
    e.respondWith(fetch(req).then(function (r) { var c = r.clone(); caches.open(CACHE).then(function (ch) { ch.put(req, c); }); return r; })
      .catch(function () { return caches.match(req); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) { return hit || fetch(req); }));
});
