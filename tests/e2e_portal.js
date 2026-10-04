// Portal: la interfaz publicada fuera de Apps Script (portal/index.html) habla con el backend real por doPost.
// La URL /exec se intercepta con Playwright y se responde ejecutando Codigo.gs en Node (tests/harness.js).
const { chromium } = require("playwright");
const path = require("path");
const { Hoja, crear } = require("./harness");

const cons = new Hoja("Consolidado_PQRS");
["CÓDIGO DE RADICACIÓN"].concat(Array.from({ length: 52 }, (_, i) => "COL" + (i + 2))).forEach((h, i) => cons.poner(4, i + 1, h));
cons.poner(4, 32, "TÉRMINO (días)"); cons.poner(4, 36, "DÍAS TRANSCURRIDOS");
const traza = new Hoja("Trazabilidad"); traza.poner(4, 1, "FECHA Y HORA");
const resp = new Hoja("Responsables"); resp.poner(4, 1, "ID"); [1, "Urgencias", "Ana", "", "urg@miredips.org", "", "SI"].forEach((v, j) => resp.poner(5, j + 1, v));
const cfg = new Hoja("Config");
[["SEDE", 15, "Hábiles"], ["SUPER SALUD", 1, "Calendario"], ["SECRETARIA DE SALUD", 3, "Calendario"]].forEach((f, i) => f.forEach((v, j) => cfg.poner(6 + i, j + 1, v)));
[3174, 3, "SIAU", "siau@miredips.org", "", "", "", ""].forEach((v, i) => cfg.poner(11 + i, 2, v));
const L = { "SEDE": ["C. LA PLAYA"], "SERVICIO": ["URGENCIAS"], "TIPO DE PQRS": ["QUEJA", "FELICITACION"], "ENTIDAD PRESENTADA": ["SEDE"], "ESTADO": ["Recibida"], "CANAL": ["Presencial"] };
Object.keys(L).forEach((k, j) => { cfg.poner(43, j + 1, k); L[k].forEach((v, i) => cfg.poner(44 + i, j + 1, v)); });
const G = crear({ "Consolidado_PQRS": cons, "Trazabilidad": traza, "Responsables": resp, "Config": cfg, "Mapeo_Formulario": new Hoja("Mapeo_Formulario") },
  { getUserLabelByName: () => null, createLabel: n => ({ getName: () => n }), getAliases: () => [], search: () => [] });
G.LOGO_BASE64 = G.LOGO_BASE64;

const API = "https://script.google.com/macros/s/PRUEBA/exec";
(async () => {
  const errores = [];
  const b = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  p.on("pageerror", e => errores.push("pageerror: " + e.message));
  let llamadas = 0;
  await p.route(API, async (route) => {
    llamadas++;
    const salida = G.doPost({ postData: { contents: route.request().postData() || "{}" } });
    await route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: salida.getContent() });
  });
  await p.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/, r => r.fulfill({ status: 200, body: "" }));
  await p.goto("file://" + path.resolve(__dirname, "..", "portal", "index.html") + "?api=" + encodeURIComponent(API));
  await p.waitForSelector("#a_nombre", { timeout: 15000 });   // sin usuarios: pide crear el administrador
  await p.fill("#a_nombre", "Admin Portal"); await p.fill("#a_usuario", "admin.portal"); await p.fill("#a_correo", "admin@correo.com");
  await p.fill("#a_clave", "Portal2026"); await p.fill("#a_clave2", "Portal2026"); await p.click("#btnAcceso");
  await p.waitForSelector("#v-inicio:not([hidden]) .hero", { timeout: 20000 }).catch(async (e) => { errores.push("no cargó el inicio: " + (await p.textContent("#accAviso"))); });
  const r = await p.evaluate(() => fetch("https://script.google.com/macros/s/PRUEBA/exec", { method: "POST", body: JSON.stringify({ fn: "_hash_", args: ["x", "y"] }) }).then(x => x.json()));
  if (!r.__error) errores.push("el portal permitió llamar una función interna");
  if (llamadas < 3) errores.push("pocas llamadas al backend: " + llamadas);
  // v8.6 · app instalable (PWA): manifiesto con íconos, service worker que no toca Apps Script y CSP que los permite
  const fs = require("fs"), raiz = path.join(__dirname, "..", "portal");
  const man = JSON.parse(fs.readFileSync(path.join(raiz, "manifest.webmanifest"), "utf8"));
  if (man.display !== "standalone" || !man.icons.some(i => i.purpose === "maskable") || man.icons.some(i => !fs.existsSync(path.join(raiz, i.src)))) errores.push("el manifiesto de la app está incompleto");
  const html = fs.readFileSync(path.join(raiz, "index.html"), "utf8"), sw = fs.readFileSync(path.join(raiz, "sw.js"), "utf8");
  if (!/rel="manifest"/.test(html) || !/manifest-src 'self'; worker-src 'self'/.test(html)) errores.push("el portal no declara el manifiesto o la CSP no lo permite");
  try { new Function(sw); } catch (e) { errores.push("sw.js no es JavaScript válido: " + e.message); }
  if (!/u\.origin !== self\.location\.origin\) return/.test(sw) || /script\.google\.com/.test(sw)) errores.push("el service worker podría interceptar las llamadas a Apps Script");
  if (await p.isVisible("#btnInstalarAcceso")) errores.push("el botón de instalar se muestra sin que el navegador lo permita");
  await p.screenshot({ path: path.join(__dirname, "salida", "capturas", "z_portal.png") });
  await b.close();
  console.log(errores.length ? errores.join("\n") : "PORTAL SIN ERRORES (" + llamadas + " llamadas por doPost)");
  if (errores.length) process.exitCode = 1;
})();
