// Vista previa navegable SIN Google: incrusta el backend real (apps-script/Codigo.gs) en el navegador
// con servicios de Apps Script simulados (tests/mock_browser.js) y datos de prueba ficticios.
// Salida: tests/salida/Vista_Previa_Plataforma.html  ·  Usuarios demo: siau.admin / tecnico.playa / consulta · clave Demo2026
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const leer = (p) => fs.readFileSync(path.join(R, p), "utf8");
let h = leer("apps-script/Index.html");
const gs = leer("apps-script/Codigo.gs");
if (gs.includes("</script")) throw new Error("Codigo.gs no puede contener «</script» (rompería la vista previa).");
const chart = leer("node_modules/chart.js/dist/chart.umd.js");
let mock = leer("tests/mock_browser.js");
const nombres = [...new Set([...gs.matchAll(/^function (\w+)\(/gm)].map((m) => m[1]))].sort();
mock = mock.replace("__LISTA__", '"' + nombres.map((n) => n + ":" + n).join(",") + '"');

const tag = '<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>';
if (h.split(tag).length !== 2) throw new Error("No encontré (una sola vez) la etiqueta de Chart.js en Index.html");
h = h.replace(tag, () => "<script>" + chart + "</script>");
const ini = "<script>\n/* v8 · PORTAL";
if (h.split(ini).length !== 2) throw new Error("No encontré el inicio del script principal («/* v8 · PORTAL»)");
h = h.replace(ini, () => '<script type="text/plain" id="codigo-backend">' + gs + "</script>\n<script>" + mock + "</script>\n" + ini);
const demo = '<script>(function(){ var c=document.getElementById("formAcceso"); var n=document.createElement("div"); n.className="aviso info"; n.style.marginTop="16px"; n.innerHTML="<div><b>Vista previa.</b> Administrador: siau.admin · Técnico con 2 sedes: tecnico.playa · Consulta: consulta · Contraseña: Demo2026</div>"; c.appendChild(n); })();\nsetInterval(function(){ if(window.__simularEntrada && window.APP && APP.sesion && window.__sim!==APP.sesion.usuario){ window.__sim=APP.sesion.usuario; setTimeout(function(){ __simularEntrada(); APP.ticks=2; sondear(); }, 7000); } }, 1000);</script>\n</body>';
const fin = h.lastIndexOf("</body>");
h = h.slice(0, fin) + demo + h.slice(fin + "</body>".length);
fs.mkdirSync(path.join(R, "tests", "salida"), { recursive: true });
const out = path.join(R, "tests", "salida", "Vista_Previa_Plataforma.html");
fs.writeFileSync(out, h);
console.log("Vista previa: " + path.relative(R, out) + " (" + h.length + " caracteres)");
