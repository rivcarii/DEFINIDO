// Construye portal/index.html: la misma interfaz de apps-script/Index.html, lista para publicarse como
// página estática (GitHub Pages u otro hosting). Las llamadas viajan por fetch a la URL /exec (doPost)
// configurada en portal/config.js. Uso: node tools/construir_portal.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let h = fs.readFileSync(path.join(R, "apps-script", "Index.html"), "utf8");
const marca = "</head>";
if (!h.includes(marca)) throw new Error("Index.html sin </head>");
// Política de seguridad del contenido: la página solo habla con Apps Script y solo carga lo que usa (docs/SEGURIDAD.md)
const csp = "default-src 'none'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src https://script.google.com https://script.googleusercontent.com; " +
  "base-uri 'none'; form-action 'none'; object-src 'none'";
h = h.replace(marca, '<meta http-equiv="Content-Security-Policy" content="' + csp + '">\n<meta name="referrer" content="no-referrer">\n' +
  '<meta name="robots" content="noindex,nofollow">\n<meta name="theme-color" content="#006081">\n' +
  '<script src="config.js"></script>\n' + marca);
fs.mkdirSync(path.join(R, "portal"), { recursive: true });
fs.writeFileSync(path.join(R, "portal", "index.html"), h);
console.log("Portal: portal/index.html (" + h.length + " caracteres). Configura la URL /exec en portal/config.js.");
