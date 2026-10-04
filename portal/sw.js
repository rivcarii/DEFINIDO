/* Generado por tools/construir_portal.mjs · no editar a mano */
var VERSION = "pqrs-cfd6383542";
var CASCARA = ["./", "index.html", "config.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
self.addEventListener("install", function (e) { e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CASCARA); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== self.location.origin) return;     // Apps Script y las fuentes van directo a la red
  e.respondWith(fetch(r).then(function (res) {
    if (res && res.ok) { var copia = res.clone(); caches.open(VERSION).then(function (c) { c.put(r, copia); }); }
    return res;
  }).catch(function () { return caches.match(r).then(function (x) { return x || caches.match("index.html"); }); }));
});
