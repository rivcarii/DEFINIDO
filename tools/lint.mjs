// Revisión estática: variables no definidas, claves duplicadas, código inalcanzable y redeclaraciones.
// Backend: apps-script/Codigo.gs (servicios de Apps Script como globales).
// Frontend: extrae el JavaScript de frontend/*.html (etiquetas <script> sin src).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const g = (lista) => Object.fromEntries(lista.map((n) => [n, "readonly"]));
const reglas = { "no-undef": "error", "no-dupe-keys": "error", "no-unreachable": "error", "no-redeclare": "error" };
const GAS = g(["SpreadsheetApp", "GmailApp", "DriveApp", "Utilities", "Session", "ScriptApp", "HtmlService", "CacheService",
  "PropertiesService", "LockService", "UrlFetchApp", "MailApp", "FormApp", "Logger", "ContentService", "Charts", "console"]);
const NAV = g(["window", "document", "google", "console", "setTimeout", "clearTimeout", "setInterval", "clearInterval", "Notification",
  "AudioContext", "webkitAudioContext", "localStorage", "sessionStorage", "navigator", "location", "Promise", "requestAnimationFrame",
  "getComputedStyle", "FileReader", "Blob", "URL", "atob", "btoa", "Intl", "matchMedia", "Option", "MutationObserver", "TextDecoder", "Chart", "encodeURIComponent", "fetch", "qrcode", "Image", "XMLSerializer", "decodeURIComponent"]);

const revisar = async (texto, nombre, globals) => {
  const e = new ESLint({ overrideConfigFile: true,
    overrideConfig: [{ languageOptions: { ecmaVersion: 2019, sourceType: "script", globals }, rules: reglas }] });
  const [r] = await e.lintText(texto, { filePath: path.join(R, nombre + ".js") });
  return r;
};

const back = fs.readFileSync(path.join(R, "apps-script", "Codigo.gs"), "utf8");
const front = fs.readdirSync(path.join(R, "frontend")).filter((f) => f.endsWith(".html")).sort()
  .map((f) => fs.readFileSync(path.join(R, "frontend", f), "utf8")).join("")
  .split(/<script(?![^>]*\bsrc=)[^>]*>/i).slice(1).map((t) => t.split(/<\/script>/i)[0]).join("\n;\n");

let errores = 0;
for (const [nombre, texto, globals] of [["Codigo.gs", back, GAS], ["frontend (scripts de Index.html)", front, NAV]]) {
  const r = await revisar(texto, nombre.replace(/\W+/g, "_"), globals);
  errores += r.errorCount;
  r.messages.forEach((m) => console.log(`${nombre}:${m.line}:${m.column}  ${m.message}  (${m.ruleId})`));
  console.log(`${nombre}: ${r.errorCount} error(es)`);
}
process.exit(errores ? 1 : 0);
