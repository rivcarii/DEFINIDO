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
h = h.replace(marca, '<meta name="robots" content="noindex,nofollow">\n<meta name="theme-color" content="#006081">\n' +
  '<script src="config.js"></script>\n' + marca);
fs.mkdirSync(path.join(R, "portal"), { recursive: true });
fs.writeFileSync(path.join(R, "portal", "index.html"), h);
console.log("Portal: portal/index.html (" + h.length + " caracteres). Configura la URL /exec en portal/config.js.");
