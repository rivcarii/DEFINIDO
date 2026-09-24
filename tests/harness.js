// Banco de pruebas: ejecuta apps-script/Codigo.gs en Node con servicios de Apps Script simulados.
const fs = require("fs"), vm = require("vm");
const SHEET_TZ = process.env.SHEET_TZ || "America/Bogota";

function partes(date, tz) {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const o = {}; f.formatToParts(date).forEach(p => o[p.type] = p.value); return o;
}
const Utilities = {
  formatDate(d, tz, pat) {
    const p = partes(d, tz);
    return pat.replace(/yyyy|MM|dd|HH|mm|ss|M|d|H|m|s/g, t => ({ yyyy: p.year, MM: p.month, dd: p.day, HH: p.hour, mm: p.minute, ss: p.second,
      M: String(+p.month), d: String(+p.day), H: String(+p.hour), m: String(+p.minute), s: String(+p.second) })[t]);
  },
  parseDate(s, tz) {
    const [y, m, d] = s.split("-").map(Number);
    let guess = Date.UTC(y, m - 1, d);
    for (let i = 0; i < 3; i++) {
      const p = partes(new Date(guess), tz);
      const local = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
      guess += Date.UTC(y, m - 1, d) - local;
    }
    return new Date(guess);
  },
  newBlob(b, t, n) { return { getBytes: () => b || [], getName: () => n, tipo: t }; }, base64Decode(x) { return Buffer.from(x || "", "base64"); },
  base64Encode(b) { return Buffer.from(b).toString("base64"); },
  getUuid() { return require("crypto").randomUUID(); },
  computeDigest(alg, txt) { return Array.from(require("crypto").createHash("sha256").update(String(txt), "utf8").digest()).map(b => b > 127 ? b - 256 : b); },
  DigestAlgorithm: { SHA_256: "sha256" }, Charset: { UTF_8: "utf8" },
};

class Hoja {
  constructor(nombre, filas) { this.nombre = nombre; this.d = filas || []; this.formulas = {}; }
  getName() { return this.nombre; }
  getLastRow() { let n = this.d.length; while (n > 0 && (!this.d[n - 1] || this.d[n - 1].every(v => v === "" || v === null || v === undefined))) n--; return n; }
  celda(r, c) { const f = this.d[r - 1]; return f && f[c - 1] !== undefined ? f[c - 1] : ""; }
  poner(r, c, v) { while (this.d.length < r) this.d.push([]); const f = this.d[r - 1]; while (f.length < c) f.push(""); f[c - 1] = v; }
  getRange(r, c, nr, nc) {
    nr = nr || 1; nc = nc || 1; const h = this;
    return {
      getValues() { const o = []; for (let i = 0; i < nr; i++) { const f = []; for (let j = 0; j < nc; j++) f.push(h.celda(r + i, c + j)); o.push(f); } return o; },
      getValue() { return h.celda(r, c); },
      setValues(v) { v.forEach((f, i) => f.forEach((x, j) => h.poner(r + i, c + j, x))); return this; },
      setValue(v) { h.poner(r, c, v); return this; },
      setFormulas(v) { v.forEach((f, i) => f.forEach((x, j) => { h.formulas[(r + i) + ":" + (c + j)] = x; })); return this; },
      getFormula() { return h.formulas[r + ":" + c] || ""; },
      getDisplayValues() { const o = []; for (let i = 0; i < nr; i++) { const f = []; for (let j = 0; j < nc; j++) {
        const fx = h.formulas[(r + i) + ":" + (c + j)];
        if (fx) { let q = false, coma = false; for (const ch of fx) { if (ch === '"') q = !q; else if (!q && ch === ",") coma = true; }
          f.push(process.env.LOCALE_PC && coma ? "#ERROR!" : (!process.env.LOCALE_PC && fx.indexOf(";") !== -1 ? "#ERROR!" : "")); }
        else f.push(String(h.celda(r + i, c + j))); } o.push(f); } return o; },
      setNumberFormat() { return this; }, clearContent() { return this; }, copyTo() { return this; },
      setFontWeight() { return this; }, setBackground() { return this; }, setFontColor() { return this; },
    };
  }
  appendRow(v) { this.d.push(v.slice()); }
  getDataRange() { const n = this.getLastRow(); const m = Math.max(...this.d.slice(0, n).map(f => f.length), 1); return this.getRange(1, 1, n, m); }
  getFormUrl() { return this.formUrl || null; }
  setColumnWidth() {} setFrozenRows() {} hideSheet() {}
  getMaxRows() { return Math.max(this.maxRows || 1000, this.d.length); }
  insertRowsAfter(r, n) { this.maxRows = this.getMaxRows() + n; }
  getMaxColumns() { return 60; } insertColumnsAfter() {}
  getLastColumn() { return Math.max(0, ...this.d.map(f => { let n = f.length; while (n > 0 && (f[n - 1] === "" || f[n - 1] === null || f[n - 1] === undefined)) n--; return n; })); }
}

function crear(hojas, gmail) {
  const ss = { getSheetByName: n => hojas[n] || null, getSheets: () => Object.values(hojas), getSpreadsheetTimeZone: () => SHEET_TZ,
               insertSheet: n => (hojas[n] = new Hoja(n)) };
  const props = {};
  const enviados = [];
  const ctx = {
    console, Math, Date, JSON, Object, Array, String, Number, RegExp, parseInt, isNaN, isFinite,
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, flush() {}, getUi() { throw new Error("sin UI"); } },
    Session: { getScriptTimeZone: () => process.env.SCRIPT_TZ || "America/New_York", getActiveUser: () => ({ getEmail: () => "siau@miredips.org" }),
               getEffectiveUser: () => ({ getEmail: () => "siau@miredips.org" }) },
    Utilities, Logger: { log() {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] || null, setProperty: (k, v) => { props[k] = String(v); } }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, waitLock() {}, releaseLock() {} }) },
    ScriptApp: { getProjectTriggers: () => [], getService: () => ({ getUrl: () => "" }) },
    GmailApp: gmail || {},
    HtmlService: {},
    ContentService: { MimeType: { JSON: "json" }, createTextOutput: t => ({ contenido: t, setMimeType() { return this; }, getContent() { return t; } }) },
    FormApp: {},
    CacheService: (() => { const m = {}; const c = { get: k => (k in m ? m[k] : null), put: (k, v) => { m[k] = String(v); }, remove: k => { delete m[k]; } }; return { getScriptCache: () => c }; })(),
    UrlFetchApp: { llamadas: [], fetch(url, op) { this.llamadas.push({ url, texto: JSON.parse(op.payload).text }); return {}; } },
    DriveApp: (() => { const carpetas = {}; const mk = n => ({ nombre: n, archivos: [], getUrl: () => "https://drive.google.com/drive/folders/" + encodeURIComponent(n),
        getFoldersByName: m => { const k = n + "/" + m; return { hasNext: () => !!carpetas[k], next: () => carpetas[k] }; },
        createFolder: m => (carpetas[n + "/" + m] = mk(n + "/" + m)),
        createFile(b) { const f = { setName() { return f; }, getUrl: () => "https://drive.google.com/file/d/x" }; this.archivos.push(b); return f; } });
      const raiz = mk(""); return { getFoldersByName: raiz.getFoldersByName, createFolder: raiz.createFolder, __carpetas: carpetas }; })(),
  };
  ctx.GmailApp.sendEmail = (para, asunto, texto, op) => { enviados.push({ para, asunto, html: op && op.htmlBody, cc: op && op.cc }); };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(require("path").join(__dirname, "..", "apps-script", "Codigo.gs"), "utf8").replace(/^const /gm, "var "), ctx);
  ctx.__enviados = enviados; ctx.__props = props; ctx.UrlFetchApp = ctx.UrlFetchApp;
  return ctx;
}
module.exports = { Hoja, crear, Utilities };
