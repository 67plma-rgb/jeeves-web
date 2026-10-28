/* Jeeves Express: funciona sin internet una vez abierta. */
var V = 'jeeves-express-v1';
var FILES = ['./', 'index.html', 'juego.css', 'juego.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png', '../favicon.svg', '../assets/reel-musica.mp3?v=5'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(V).then(function (c) { return Promise.all(FILES.map(function (f) { return c.add(f).catch(function () {}); })); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET') return;
  var u = new URL(r.url);
  if (u.origin !== location.origin) { e.respondWith(fetch(r).catch(function () { return caches.match(r); })); return; }
  e.respondWith(caches.match(r, { ignoreSearch: r.mode === 'navigate' }).then(function (hit) {
    var net = fetch(r).then(function (res) { if (res && res.ok) { var cp = res.clone(); caches.open(V).then(function (c) { c.put(r, cp); }); } return res; }).catch(function () { return hit || caches.match('index.html'); });
    return hit || net;
  }));
});
