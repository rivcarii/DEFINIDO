// Construye portal/index.html: la misma interfaz de apps-script/Index.html, lista para publicarse como
// página estática (GitHub Pages u otro hosting). Las llamadas viajan por fetch a la URL /exec (doPost)
// configurada en portal/config.js. Uso: node tools/construir_portal.mjs
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let h = fs.readFileSync(path.join(R, "apps-script", "Index.html"), "utf8");
const marca = "</head>";
if (!h.includes(marca)) throw new Error("Index.html sin </head>");
// Política de seguridad del contenido: la página solo habla con Apps Script y solo carga lo que usa (docs/SEGURIDAD.md)
const csp = "default-src 'none'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src https://script.google.com https://script.googleusercontent.com; " +
  "manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'";
h = h.replace(marca, '<meta http-equiv="Content-Security-Policy" content="' + csp + '">\n<meta name="referrer" content="no-referrer">\n' +
  '<meta name="robots" content="noindex,nofollow">\n<meta name="theme-color" content="#006081">\n' +
  // App instalable (PWA): manifiesto, íconos y modo pantalla completa en iPhone
  '<link rel="manifest" href="manifest.webmanifest">\n<link rel="apple-touch-icon" href="apple-touch-icon.png">\n' +
  '<meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes">' +
  '<meta name="apple-mobile-web-app-title" content="PQRS SIAU"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n' +
  '<script>if("serviceWorker" in navigator){addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){})})}\n' +
  'addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__instalarApp=e;dispatchEvent(new Event("pqrs-instalable"))});\n' +
  'addEventListener("appinstalled",function(){window.__instalarApp=null;dispatchEvent(new Event("pqrs-instalable"))});</script>\n' +
  '<script src="config.js"></script>\n' + marca);
fs.mkdirSync(path.join(R, "portal"), { recursive: true });
fs.writeFileSync(path.join(R, "portal", "index.html"), h);

// Manifiesto, íconos y service worker. El service worker guarda solo la «cáscara» de la app (nunca las llamadas a Apps Script,
// que van a otro dominio) y busca primero en la red, así las actualizaciones llegan solas.
const iconos = ["icon-192.png", "icon-512.png", "icon-maskable-512.png"];
iconos.forEach((f) => fs.copyFileSync(path.join(R, "assets", "pwa", f), path.join(R, "portal", f)));
fs.writeFileSync(path.join(R, "portal", "manifest.webmanifest"), JSON.stringify({
  name: "Sistema de PQRS · SIAU MiRed IPS", short_name: "PQRS SIAU", description: "Radicación y gestión de PQRS de MiRed Barranquilla IPS",
  lang: "es-CO", start_url: "./", scope: "./", display: "standalone", orientation: "any",
  background_color: "#00475F", theme_color: "#006081",
  icons: [
    { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
}, null, 2) + "\n");
const version = crypto.createHash("sha256").update(h).digest("hex").slice(0, 10);
fs.writeFileSync(path.join(R, "portal", "sw.js"), `/* Generado por tools/construir_portal.mjs · no editar a mano */
var VERSION = "pqrs-${version}";
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
`);
console.log("Portal: portal/index.html (" + h.length + " caracteres). Configura la URL /exec en portal/config.js.");
