/**
 * =====================================================================================
 *  SISTEMA PQRS · MiRed Barranquilla IPS S.A.S. — Backend v8
 *  Libro: consolidado del SIAU (Google Sheets)   ·   Interfaz: Index.html (aplicación web y portal)
 * =====================================================================================
 *  Todo se opera desde la plataforma: radicar, analizar, direccionar al área,
 *  redireccionar si se envió mal, registrar la respuesta del área, responder al
 *  usuario y consultar el tablero. Cada acción queda en la hoja Trazabilidad.
 * =====================================================================================
 */

const CFG = {
  HOJA_DATOS: "Consolidado_PQRS",
  HOJA_TRAZA: "Trazabilidad",
  HOJA_RESP: "Responsables",
  HOJA_MAPEO: "Mapeo_Formulario",
  HOJA_CONFIG: "Config",

  FILA_DATOS: 5,
  // FILA_FIN ya no es fija (v8): se calcula con la última fila con datos (ver _finDatos_).
  NCOL: 57,
  COLCHON_FORMULAS: 200,   // filas vacías con fórmulas listas después del último registro

  CFG_TERMINOS: "A6:D8",
  CFG_FEST_INI: 6, CFG_FEST_FIN: 39,
  CFG_PARAM_INI: 11,          // B11 base consecutivo … B18 hoja de respuestas
  CFG_LISTAS_FILA: 43,        // fila de ENCABEZADOS de las listas (los datos empiezan en la siguiente)

  RESP_FILA: 5,
  TRAZA_FILA: 5,
  MAPEO_FILA: 5,

  REMITENTE: "SIAU · MiRed Barranquilla IPS",
  GMAIL_LABEL: "PQRS-Entrantes",
  GMAIL_PROCESADO: "PQRS-Radicado",
  GMAIL_DESCARTADO: "PQRS-No aplica",
  GMAIL_BUSQUEDA: "in:inbox newer_than:30d -label:PQRS-Radicado -label:PQRS-No-aplica",
  DIAS_ACUSE: 5,   // solo se acusa recibo de respuestas del formulario de los últimos N días
};

// Columnas del Consolidado_PQRS (1 = A)
const C = {
  CODIGO:1, CANAL:2, FECHA_PQRS:3, FECHA_RECEPCION:4, FECHA_RADICACION:5, MARCA:6,
  TIPO_SOLICITANTE:7, TIPO_DOC_SOL:8, NUM_DOC_SOL:9, NOMBRE_SOL:10, TELEFONO:11, CORREO:12, DIRECCION:13,
  TIPO_DOC_AFI:14, NUM_DOC_AFI:15, NOMBRE_AFI:16, EDAD:17, SEXO:18, POBLACION:19, EPS:20, REGIMEN:21,
  SEDE:22, SERVICIO:23, SERVICIO_ESP:24, MODALIDAD:25, DEPARTAMENTO:26,
  TIPO_PQRS:27, CLASIF_INTERNA:28, TIPOLOGIA:29, DESCRIPCION:30,
  ENTIDAD:31, TERMINO:32, TIPO_DIA:33, FECHA_MAX:34, SEMAFORO:35, DIAS:36,
  ESTADO:37, RESPONSABLE:38, CORREO_RESP:39, FECHA_ENVIO_AREA:40, REDIRECCIONES:41,
  RTA_AREA:42, FECHA_RTA_AREA:43, RTA_USUARIO:44, FECHA_RTA_USUARIO:45, OPORTUNIDAD:46,
  NOTIF_RECEPCION:47, NOTIF_AREA:48, NOTIF_GESTION:49, NOTIF_CIERRE:50,
  OBSERVACIONES:51, ID_CORREO:52, REGISTRADO_POR:53,
  // v8 · columnas nuevas al final (no desplazan las anteriores ni sus fórmulas)
  NIVEL_RIESGO:54, POBLACION_PRIORIZADA:55, AUTORIZACION_DATOS:56, AREA_SUGERIDA:57,
};
var ENCABEZADOS_V8 = { 54: "NIVEL DE RIESGO (CIRCULARES SUPERSALUD)", 55: "POBLACIÓN PRIORIZADA", 56: "AUTORIZACIÓN TRATAMIENTO DE DATOS", 57: "ÁREA SUGERIDA" };

// Campo de la plataforma -> columna
const CAMPOS = {
  canal:C.CANAL, fechaPqrs:C.FECHA_PQRS, fechaRecepcion:C.FECHA_RECEPCION, fechaRadicacion:C.FECHA_RADICACION,
  tipoSolicitante:C.TIPO_SOLICITANTE, tipoDocSolicitante:C.TIPO_DOC_SOL, numDocSolicitante:C.NUM_DOC_SOL,
  nombreSolicitante:C.NOMBRE_SOL, telefono:C.TELEFONO, correo:C.CORREO, direccion:C.DIRECCION,
  tipoDocAfiliado:C.TIPO_DOC_AFI, numDocAfiliado:C.NUM_DOC_AFI, nombreAfiliado:C.NOMBRE_AFI,
  edad:C.EDAD, sexo:C.SEXO, poblacion:C.POBLACION, eps:C.EPS, regimen:C.REGIMEN,
  sede:C.SEDE, servicio:C.SERVICIO, servicioEspecifico:C.SERVICIO_ESP, modalidad:C.MODALIDAD,
  departamento:C.DEPARTAMENTO, tipoPqrs:C.TIPO_PQRS, clasificacion:C.CLASIF_INTERNA, tipologia:C.TIPOLOGIA,
  descripcion:C.DESCRIPCION, entidad:C.ENTIDAD, observaciones:C.OBSERVACIONES,
  autorizacionDatos:C.AUTORIZACION_DATOS,
};

const LOGO_BASE64 = "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";

// Mascota del SIAU (acuse de las felicitaciones). Se genera con tools/imagenes.mjs a partir de assets/.
var MASCOTA_BASE64 = "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";

// ---------------------------------------------------------------------------
// APLICACIÓN WEB
// ---------------------------------------------------------------------------
function doGet(e) {
  return HtmlService.createTemplateFromFile("Index").evaluate()
    .setTitle("Sistema PQRS · MiRed IPS")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/*
 * v8 · PORTAL: segunda puerta de entrada para la misma plataforma.
 * La interfaz (Index.html) también puede publicarse como página estática (por ejemplo en GitHub
 * Pages, con una dirección corta y sin el marco de Google). Esa página llama aquí con fetch
 * (POST de texto plano, sin datos en la URL). Se exponen exactamente las mismas funciones públicas
 * que ve google.script.run: todo pasa por el ingreso con usuario y contraseña y por api().
 */
var PUERTA_PORTAL = { estadoAcceso: true, iniciarSesion: true, cerrarSesion: true, crearPrimerAdministrador: true, api: true };
function doPost(e) {
  var r;
  try {
    var cuerpo = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var fn = String(cuerpo.fn || ""), args = Array.isArray(cuerpo.args) ? cuerpo.args : [];
    if (!PUERTA_PORTAL[fn]) r = { __error: "Acción no disponible." };
    else {
      var f = { estadoAcceso: estadoAcceso, iniciarSesion: iniciarSesion, cerrarSesion: cerrarSesion,
                crearPrimerAdministrador: crearPrimerAdministrador, api: api }[fn];
      r = { r: f.apply(null, args) };
    }
  } catch (err) { r = { __error: _explicarError_(err) }; }
  return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu("PQRS")
    .addItem("Abrir plataforma", "mostrarUrl")
    .addItem("Importar respuestas del formulario", "importarFormulario")
    .addItem("Procesar correo ahora", "procesarCorreoEntrante")
    .addItem("Revisar vencimientos y alertar", "rutinaDiaria")
    .addItem("⚡ Identificar PQRS prioritarias (circulares Supersalud)", "identificarPrioritarias")
    .addSeparator()
    .addItem("Instalar disparadores", "instalarDisparadores")
    .addItem("Crear formulario QR nuevo (con autorización de datos)", "crearFormularioPQRS")
    .addItem("Diagnóstico de la puesta en marcha", "diagnosticoPlataforma")
    .addItem("Reparar fechas y fórmulas de días", "repararFechasYFormulas")
    .addToUi();
}

function mostrarUrl() {
  var u = _urlBase_();
  var ui = SpreadsheetApp.getUi();
  if (!u) { ui.alert("Publica primero: Implementar ▸ Nueva implementación ▸ Aplicación web."); return; }
  ui.alert(/\/dev(\?|$)/.test(u)
    ? "Este es el enlace de PRUEBA (/dev): solo lo abren los editores del proyecto.\n\nPara los técnicos usa el de Implementar ▸ Administrar implementaciones ▸ «URL de la aplicación web» (termina en /exec)."
    : "Enlace para los técnicos (no necesitan cuenta de Google, entran con su usuario):\n\n" + u +
      "\n\nLa implementación debe estar en «Ejecutar como: Yo» y «Quién tiene acceso: Cualquier persona».");
}

function instalarDisparadores() {
  SpreadsheetApp.getUi();   // no se puede ejecutar desde la aplicación web
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  var ss = _ss_();
  ScriptApp.newTrigger("alEnviarFormulario").forSpreadsheet(ss).onFormSubmit().create();
  ScriptApp.newTrigger("rutinaDiaria").timeBased().atHour(7).everyDays(1).create();
  ScriptApp.newTrigger("procesarCorreoEntrante").timeBased().everyMinutes(5).create();
  ScriptApp.newTrigger("revisarAlertas").timeBased().everyMinutes(30).create();
  SpreadsheetApp.getUi().alert("Listo:\n• Formulario QR → radica al enviarse\n• Correo → se revisa cada 5 minutos (EPS, entes de control y usuarios)\n" +
    "• Cada 30 minutos → alertas de riesgo vital (8 y 24 h), priorizadas, tutelas y derechos de petición\n• 7:00 a.m. → control diario de vencidas y resumen de felicitaciones por área");
}

// ---------------------------------------------------------------------------
// UTILIDADES
// ---------------------------------------------------------------------------
function _h(n) { return _ss_().getSheetByName(n); }

/*
 * v8.1 · Acceso al consolidado. El código debe estar VINCULADO a la hoja (Extensiones ▸ Apps Script
 * desde el consolidado) y ejecutarse con una cuenta que tenga acceso a ella (la del SIAU). Si Google
 * responde «No cuentas con el permiso necesario…», el mensaje dice qué cuenta se está usando.
 * El ID del consolidado se guarda para abrirlo aunque se ejecute desde un proyecto independiente.
 */
var _SS_ = null;
function _ss_() {
  if (_SS_) return _SS_;
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty("CONSOLIDADO_ID"), error = null;
  try { _SS_ = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) { error = e; }
  if (!_SS_ && id) { try { _SS_ = SpreadsheetApp.openById(id); } catch (e) { error = error || e; } }
  if (!_SS_) throw new Error(error ? _explicarError_(error)
    : "El código no está vinculado al consolidado. Ábrelo desde la hoja: Extensiones ▸ Apps Script, pega allí el código y vuelve a implementar.");
  if (!id) { try { props.setProperty("CONSOLIDADO_ID", _SS_.getId()); } catch (e) {} }
  return _SS_;
}
function _norm(s) { return (s || "").toString().trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
function _esFeli(t) { return _norm(t).indexOf("felicita") === 0; }
function _correoOk(c) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((c || "").toString().trim()); }
function _usuario() {
  if (SESION) return SESION.nombre + " <" + SESION.usuario + ">";
  return "Sistema PQRS (automático)";   // v7.1: nunca el correo de la cuenta de Google
}
function _fmt(f) {
  if (!f) return "";
  var d = (f instanceof Date) ? f : new Date(f);
  if (isNaN(d.getTime())) return "";
  return Utilities.formatDate(d, _tz_(), "dd/MM/yyyy");
}
function _fechaDeTexto(s) { return _soloFecha_(s); }

function _param(i) {   // i = 0 -> B11
  return _h(CFG.HOJA_CONFIG).getRange(CFG.CFG_PARAM_INI + i, 2).getValue();
}
function _setParam(i, v) {
  _h(CFG.HOJA_CONFIG).getRange(CFG.CFG_PARAM_INI + i, 2).setValue(v);
}

// ---------------------------------------------------------------------------
// v8 · RANGO DINÁMICO DEL CONSOLIDADO (sin tope de filas)
// ---------------------------------------------------------------------------
/*
 * Hasta v7.3 los datos iban de la fila 5 a la 404 y lo que pasaba de ahí «no existía».
 * Desde v8 el final se calcula con la última fila que tiene CÓDIGO o FECHA DE RADICACIÓN.
 * Se recuerda mientras no cambie la última fila de la hoja (getLastRow), y _proximaFila lo
 * actualiza al agregar un registro. CFG.FILA_FIN sigue existiendo como propiedad calculada.
 */
var _FIN_ = { fin: 0, ultima: -1 };
function _finDatos_() {
  var h = _h(CFG.HOJA_DATOS);
  var ultima = h.getLastRow();
  if (_FIN_.fin && _FIN_.ultima === ultima) return _FIN_.fin;
  // v8.2: se busca desde el final por bloques (el colchón de fórmulas deja filas vacías al final).
  // Antes se leían las 13.000+ filas en cada llamada; ahora basta el último bloque.
  var fin = CFG.FILA_DATOS, hasta = ultima, BLOQUE = 400;
  while (hasta >= CFG.FILA_DATOS) {
    var desde = Math.max(CFG.FILA_DATOS, hasta - BLOQUE + 1);
    var v = h.getRange(desde, 1, hasta - desde + 1, C.FECHA_RADICACION).getValues(), hallado = false;
    for (var i = v.length - 1; i >= 0; i--) {
      if (_lleno_(v[i][C.CODIGO - 1]) || _lleno_(v[i][C.FECHA_RADICACION - 1])) { fin = desde + i; hallado = true; break; }
    }
    if (hallado) break;
    hasta = desde - 1;
  }
  _FIN_ = { fin: fin, ultima: ultima };
  return fin;
}
function _lleno_(x) { return x !== "" && x !== null && x !== undefined; }
Object.defineProperty(CFG, "FILA_FIN", { get: function () { return _finDatos_(); }, enumerable: true, configurable: true });

/** Todas las filas de datos del consolidado (lectura fresca: los valores cambian con cada gestión). */
function _datos_() {
  var fin = _finDatos_();
  return _h(CFG.HOJA_DATOS).getRange(CFG.FILA_DATOS, 1, fin - CFG.FILA_DATOS + 1, CFG.NCOL).getValues();
}
/** Columna de radicados en memoria (los códigos no cambian: se usa para buscar filas rápido). */
var _CODS_ = null;
function _codigos_() {
  var fin = _finDatos_();
  if (_CODS_ && _CODS_.fin === fin && _CODS_.ultima === _FIN_.ultima) return _CODS_.lista;
  var lista = _h(CFG.HOJA_DATOS).getRange(CFG.FILA_DATOS, C.CODIGO, fin - CFG.FILA_DATOS + 1, 1).getValues()
    .map(function (r) { return (r[0] || "").toString().trim().toUpperCase(); });
  _CODS_ = { fin: fin, ultima: _FIN_.ultima, lista: lista };
  return lista;
}
function _invalidarDatos_() { _CODS_ = null; }

/** Fila donde se escribe el siguiente registro: siempre al final (conserva el orden cronológico). */
function _proximaFila() {
  var h = _h(CFG.HOJA_DATOS);
  var fin = _finDatos_();
  var primera = h.getRange(CFG.FILA_DATOS, C.CODIGO, 1, C.FECHA_RADICACION).getValues()[0];
  var nueva = (fin === CFG.FILA_DATOS && !_lleno_(primera[0]) && !_lleno_(primera[C.FECHA_RADICACION - 1])) ? CFG.FILA_DATOS : fin + 1;
  _asegurarFilas_(h, nueva);
  _FIN_ = { fin: nueva, ultima: Math.max(_FIN_.ultima, nueva) };
  _invalidarDatos_();
  return nueva;
}

/** Garantiza que la hoja tenga la fila y que las fórmulas de términos lleguen hasta ella (con colchón). */
function _asegurarFilas_(h, fila) {
  var colchon = CFG.COLCHON_FORMULAS;
  try {
    var max = h.getMaxRows();
    if (max < fila + colchon) h.insertRowsAfter(max, fila + colchon - max);
  } catch (e) { Logger.log("Filas: " + e); }
  if (h.getRange(fila, C.DIAS).getFormula()) return;
  var sep = PropertiesService.getScriptProperties().getProperty("SEPARADOR_FORMULAS");
  if (!sep) { var ef = _escribirFormulas_(h, fila + colchon); if (!ef.ok) Logger.log(ef.mensaje); return; }
  _formulasBloque_(h, fila, fila + colchon, sep);
}

/** Escribe las fórmulas de un bloque de filas con el separador ya detectado. */
function _formulasBloque_(h, ini, fin, sep) {
  var f1 = [], f2 = [];
  for (var r = ini; r <= fin; r++) {
    var fr = _formulasFila_(r);
    f1.push(sep === ";" ? fr.bloque.map(_conPuntoYComa_) : fr.bloque);
    f2.push([sep === ";" ? _conPuntoYComa_(fr.oportunidad) : fr.oportunidad]);
  }
  var n = fin - ini + 1;
  h.getRange(ini, C.TERMINO, n, 5).setFormulas(f1);
  h.getRange(ini, C.OPORTUNIDAD, n, 1).setFormulas(f2);
  h.getRange(ini, C.DIAS, n, 1).setNumberFormat("0");
  h.getRange(ini, C.TERMINO, n, 1).setNumberFormat("0");
}

/** Escribe varios campos de una fila en pocos bloques, sin tocar las columnas con fórmula. */
function _escribir(fila, vals) {
  var h = _h(CFG.HOJA_DATOS);
  var cols = Object.keys(vals).map(function (k) { return parseInt(k, 10); }).filter(function (c) { return vals[c] !== undefined && c >= 1 && c <= CFG.NCOL; });
  if (!cols.length) return;
  var formula = {}; [C.TERMINO, C.TIPO_DIA, C.FECHA_MAX, C.SEMAFORO, C.DIAS, C.OPORTUNIDAD].forEach(function (c) { formula[c] = true; });
  var actual = h.getRange(fila, 1, 1, CFG.NCOL).getValues()[0];
  cols.forEach(function (c) { if (!formula[c]) actual[c - 1] = vals[c]; });
  // tramos contiguos sin fórmulas que contienen alguna columna modificada
  var tramos = [[1, C.TERMINO - 1], [C.DIAS + 1, C.OPORTUNIDAD - 1], [C.OPORTUNIDAD + 1, CFG.NCOL]];
  tramos.forEach(function (t) {
    var toca = cols.some(function (c) { return c >= t[0] && c <= t[1]; });
    if (toca) h.getRange(fila, t[0], 1, t[1] - t[0] + 1).setValues([actual.slice(t[0] - 1, t[1])]);
  });
  if (vals[C.CODIGO] !== undefined) _invalidarDatos_();
}

function _filaDe(codigo) {
  var buscado = (codigo || "").toString().trim().toUpperCase();
  if (!buscado) return -1;
  var cods = _codigos_();
  for (var i = cods.length - 1; i >= 0; i--) if (cods[i] === buscado) return CFG.FILA_DATOS + i;
  return -1;
}

function _traza(codigo, accion, detalle) {
  var h = _h(CFG.HOJA_TRAZA);
  h.appendRow([new Date(), codigo, accion, (detalle || "").toString().substring(0, 900), _usuario()]);
}

// ---------------------------------------------------------------------------
// RADICADO
// ---------------------------------------------------------------------------
var RE_RAD = /^([A-Z]+)-(\d{4})-(\d{2})-(\d{4,})$/;

/*
 * v8.1 · UNA SOLA ESTRUCTURA DE RADICADO: SIAU-AAAA-MM-NNNN para todo (peticiones, quejas, reclamos,
 * sugerencias, felicitaciones, denuncias y tutelas), de cualquier canal. El consecutivo es único y
 * continúa el histórico. AAAA-MM es el mes de radicación. Si el número pasa de 9999 sigue con 5 cifras.
 */
function _prefijo_() { return (_param(2) || "SIAU").toString().trim().toUpperCase() || "SIAU"; }
function _siguienteConsecutivo() {
  var prefijo = _prefijo_();
  var base = parseInt(_param(0), 10); if (isNaN(base)) base = 3174;
  var props = PropertiesService.getScriptProperties();
  var guardado = parseInt(props.getProperty("ULTIMO_CONSECUTIVO"), 10);
  var max = base;
  var ver = function (c) {
    var m = RE_RAD.exec((c || "").toString().trim().toUpperCase());
    if (m && m[1] === prefijo) { var v = parseInt(m[4], 10); if (v > max) max = v; }
  };
  var ht = _h(CFG.HOJA_TRAZA), ut = ht.getLastRow();
  if (isNaN(guardado)) {   // primera vez: recorrido completo (consolidado y trazabilidad)
    _codigos_().forEach(ver);
    if (ut >= CFG.TRAZA_FILA) ht.getRange(CFG.TRAZA_FILA, 2, ut - CFG.TRAZA_FILA + 1, 1).getValues().forEach(function (c) { ver(c[0]); });
  } else {                 // v8.2: último consecutivo guardado + cola de ambas hojas (evita leer miles de filas)
    if (guardado > max) max = guardado;
    var fin = _finDatos_(), ini = Math.max(CFG.FILA_DATOS, fin - 299);
    if (fin >= ini) _h(CFG.HOJA_DATOS).getRange(ini, C.CODIGO, fin - ini + 1, 1).getValues().forEach(function (c) { ver(c[0]); });
    if (ut >= CFG.TRAZA_FILA) {
      var it = Math.max(CFG.TRAZA_FILA, ut - 299);
      ht.getRange(it, 2, ut - it + 1, 1).getValues().forEach(function (c) { ver(c[0]); });
    }
  }
  return max + 1;
}

/**
 * v8.2 · Reserva el radicado y escribe la fila bajo un candado, para que dos técnicos (o el correo
 * automático) que radican al mismo tiempo nunca reciban el mismo consecutivo.
 * Usa el candado del documento (no el del script, que mantiene tomado el proceso del correo).
 */
function _reservarRadicado_(fecha, vals) {
  var lock = null, tomado = false;
  try { lock = (LockService.getDocumentLock && LockService.getDocumentLock()) || LockService.getScriptLock(); } catch (e) {}
  try { if (lock) { lock.waitLock(20000); tomado = true; } } catch (e) { Logger.log("Candado: " + e); }
  try {
    var fila = _proximaFila();
    var codigo = _nuevoCodigo(fecha);
    vals[C.CODIGO] = codigo;
    _escribir(fila, vals);
    try { PropertiesService.getScriptProperties().setProperty("ULTIMO_CONSECUTIVO", String(parseInt(RE_RAD.exec(codigo)[4], 10))); } catch (e) {}
    return { fila: fila, codigo: codigo };
  } finally { if (tomado) { try { lock.releaseLock(); } catch (e) {} } }
}

function _nuevoCodigo(fecha) {
  var d = (fecha instanceof Date && !isNaN(fecha)) ? fecha : new Date();
  var n = _siguienteConsecutivo();
  return _prefijo_() + "-" + Utilities.formatDate(d, _tz_(), "yyyy-MM") + "-" + ("0000" + n).slice(-Math.max(4, String(n).length));
}

/**
 * v8.1 · Unifica los radicados de otras series (FEL, QR, HIS de la primera migración) en SIAU-AAAA-MM-NNNN:
 * nuevos consecutivos después del mayor existente, en orden de radicación. Deja el código anterior en
 * OBSERVACIONES y actualiza la trazabilidad. Idempotente: si ya todo es SIAU no hace nada.
 */
function _unificarRadicados_() {
  var h = _h(CFG.HOJA_DATOS), fin = _finDatos_(), n = fin - CFG.FILA_DATOS + 1;
  if (n < 1) return 0;
  var pref = _prefijo_();
  var cods = h.getRange(CFG.FILA_DATOS, C.CODIGO, n, 1).getValues();
  var fechas = h.getRange(CFG.FILA_DATOS, C.FECHA_RADICACION, n, 1).getValues();
  var otros = [];
  cods.forEach(function (c, i) {
    var m = RE_RAD.exec(String(c[0] || "").trim().toUpperCase());
    if (m && m[1] !== pref) otros.push({ i: i, antes: String(c[0]).trim(), f: fechas[i][0] instanceof Date ? fechas[i][0] : null });
  });
  if (!otros.length) return 0;
  otros.sort(function (a, b) { return ((a.f ? a.f.getTime() : 0) - (b.f ? b.f.getTime() : 0)) || (a.i - b.i); });
  var sig = _siguienteConsecutivo(), mapa = {};
  var obsRg = h.getRange(CFG.FILA_DATOS, C.OBSERVACIONES, n, 1), obs = obsRg.getValues();
  otros.forEach(function (x) {
    var d = x.f || new Date();
    var nuevo = pref + "-" + Utilities.formatDate(d, _tz_(), "yyyy-MM") + "-" + ("0000" + sig).slice(-Math.max(4, String(sig).length));
    sig++;
    mapa[x.antes] = nuevo;
    cods[x.i][0] = nuevo;
    obs[x.i][0] = (obs[x.i][0] ? obs[x.i][0] + " · " : "") + "[Radicado anterior: " + x.antes + "]";
  });
  h.getRange(CFG.FILA_DATOS, C.CODIGO, n, 1).setValues(cods);
  obsRg.setValues(obs);
  var ht = _h(CFG.HOJA_TRAZA), ut = ht.getLastRow();
  if (ut >= CFG.TRAZA_FILA) {
    var rg = ht.getRange(CFG.TRAZA_FILA, 2, ut - CFG.TRAZA_FILA + 1, 1), v = rg.getValues(), cambio = false;
    v.forEach(function (r) { var k = String(r[0] || "").trim(); if (mapa[k]) { r[0] = mapa[k]; cambio = true; } });
    if (cambio) rg.setValues(v);
  }
  _invalidarDatos_();
  try { PropertiesService.getScriptProperties().setProperty("ULTIMO_CONSECUTIVO", String(sig - 1)); } catch (e) {}
  _traza("—", "Radicados unificados", otros.length + " radicado(s) de otras series pasaron a " + pref + "-AAAA-MM-NNNN (el anterior queda en OBSERVACIONES)");
  return otros.length;
}

// ---------------------------------------------------------------------------
// CORREOS
// ---------------------------------------------------------------------------
var ETAPAS = ["Recibida", "En gestión", "Respondida - Cerrada"];

function _idxEtapa(estado) {
  var e = _norm(estado);
  if (e.indexOf("gestion") !== -1) return 1;
  if (e.indexOf("cerrada") !== -1) return 2;
  return 0;
}

// Tipografía de los correos: Volkswagen Serial si el equipo del lector la tiene instalada;
// si no, cae a Barlow / Segoe UI / Arial (los clientes de correo no descargan fuentes con licencia).
var FF = "'Volkswagen Serial','VW Serial',Barlow,'Segoe UI',Helvetica,Arial,sans-serif";
var FT = "'Volkswagen Serial Black','VW Serial Black','Volkswagen Serial','VW Serial','Barlow Semi Condensed','Arial Black',Arial,sans-serif";

function _progreso(estado) {
  var idx = _idxEtapa(estado), out = [];
  ETAPAS.forEach(function (et, i) {
    var on = i <= idx, col = on ? "#006081" : "#DCE5E9", tx = on ? "#00475F" : "#94A3AB";
    out.push('<td align="center" style="width:' + (i === 1 ? "38%" : "31%") + ';">' +
      '<div style="width:24px;height:24px;line-height:24px;border-radius:50%;background:' + col +
      ';color:#fff;font-family:' + FF + ';font-weight:700;font-size:11px;margin:0 auto;">' + (on && i < idx ? "&#10003;" : (i + 1)) + '</div>' +
      '<div style="font-family:' + FF + ';font-weight:' + (i === idx ? "700" : "400") + ';font-size:11px;color:' + tx +
      ';margin-top:6px;">' + et + '</div></td>');
    if (i < 2) out.push('<td style="padding:0 4px;"><div style="height:2px;background:' +
      (i < idx ? "#006081" : "#DCE5E9") + ';margin-top:12px;"></div></td>');
  });
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 6px;"><tr>' + out.join("") + '</tr></table>';
}

function _enviar(para, asunto, texto, html, extra) {
  try {
    var op = { name: CFG.REMITENTE, replyTo: (_param(3) || "siau@miredips.org") };
    if (extra && extra.cc) op.cc = extra.cc;
    if (extra && extra.imagenes) Object.keys(extra.imagenes).forEach(function (k) { op.inlineImages = op.inlineImages || {}; op.inlineImages[k] = extra.imagenes[k]; });
    if (_remitenteAlias_()) op.from = _remitenteAlias_();
    if (html) {
      op.htmlBody = html;
      op.inlineImages = op.inlineImages || {};
      op.inlineImages.logoNiRed = Utilities.newBlob(Utilities.base64Decode(LOGO_BASE64), "image/png", "logo.png");
    }
    GmailApp.sendEmail(para, asunto, texto, op);
    return { ok: true };
  } catch (err) {
    Logger.log("Error correo %s: %s", para, err);
    return { ok: false, error: err.message || String(err) };
  }
}

/** v8 · Presentación en los correos: «C. LA PLAYA» → «Camino La Playa», «FELICITACION» → «Felicitación». */
function _sedeBonita_(v) {
  var s = String(v || "").trim();
  if (!s) return "";
  s = s.replace(/^C\.\s*/i, "Camino ").replace(/^P\.\s*/i, "Paso ");
  if (s === s.toUpperCase()) s = s.toLowerCase().replace(/(^|\s)([a-záéíóúñ0-9])/g, function (m, a, b) { return a + b.toUpperCase(); })
    .replace(/\s(De|Del|La|Las|Los|El|Y)\s/g, function (w) { return w.toLowerCase(); });
  return s;
}
var TIPOS_BONITOS = { queja: "Queja", reclamo: "Reclamo", peticion: "Petición", sugerencia: "Sugerencia", felicitacion: "Felicitación",
                      denuncia: "Denuncia", tutela: "Tutela", solicitud: "Solicitud" };
function _tipoBonito_(t) { var k = _claveTipo_(t) || _norm(t).replace(/[^a-z]/g, ""); return TIPOS_BONITOS[k] || String(t || ""); }
function _servicioBonito_(v) { var s = String(v || ""); return s === s.toUpperCase() ? s.charAt(0) + s.slice(1).toLowerCase() : s; }

function _datosCorreo(f) {   // f = arreglo de la fila
  return {
    codigo: f[C.CODIGO - 1], tipo: _tipoBonito_(f[C.TIPO_PQRS - 1]), estado: f[C.ESTADO - 1] || "Recibida",
    sede: _sedeBonita_(f[C.SEDE - 1]), servicio: _servicioBonito_(f[C.SERVICIO - 1]),
    fechaRadicacion: _fmt(f[C.FECHA_RADICACION - 1]),
    fechaMax: _esFeli(f[C.TIPO_PQRS - 1]) ? "" : _fmt(f[C.FECHA_MAX - 1]),
    responsable: f[C.RESPONSABLE - 1],
    dias: _dias_(f[C.DIAS - 1]),
  };
}

// ---------------------------------------------------------------------------
// API · ARRANQUE
// ---------------------------------------------------------------------------
function appBootstrap_() {
  var migracion = { hecho: false, mensaje: "" };
  try { migracion = _migrar_(false); } catch (e) { migracion = { hecho: false, mensaje: "No se pudo actualizar el consolidado: " + (e.message || e) }; }
  if (!migracion.hecho) {
    try { var salud = _saludFormulas_(); if (salud.reparado || !salud.ok) migracion = { hecho: !!salud.reparado, mensaje: salud.mensaje || "" }; }
    catch (e) { migracion = { hecho: false, mensaje: "No se pudieron revisar las fórmulas: " + (e.message || e) }; }
  }
  _cacheListas = null;
  var base = _listasConfig_(), listas = {};
  Object.keys(base).forEach(function (k) { listas[k] = base[k].slice(); });
  if (SESION && !SESION.todas && listas["SEDE"]) listas["SEDE"] = listas["SEDE"].filter(_sedeVisible_);
  return {
    listas: listas,
    responsables: apiResponsables_(),
    usuario: _usuario(),
    logo: LOGO_BASE64,
    siau: { correo: _param(3), tel: _param(4), wa: _param(5) },
    formVinculado: { id: _param(6), hoja: _param(7) },
    migracion: migracion,
    sesion: SESION ? { usuario: SESION.usuario, nombre: SESION.nombre, rol: SESION.rol, sedes: SESION.todas ? ["TODAS"] : SESION.sedes,
      todas: SESION.todas, gestionaCorreo: SESION.gestionaCorreo, debeCambiar: SESION.debeCambiar,
      puede: { radicar: _permitido_(SESION, P_RADICAR), gestion: _permitido_(SESION, P_GESTION), correo: _permitido_(SESION, P_CORREO), admin: _permitido_(SESION, P_ADMIN) } } : null,
    categorias: _categorias_().map(function (c) { return { nombre: c.nombre, prioridad: c.prioridad, tipo: c.tipo }; }),
    zonaHoraria: _tz_(),
    ahora: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// API · RESPONSABLES
// ---------------------------------------------------------------------------
/** Busca la fila donde están los encabezados de las listas (por si Config se desplaza). */
function _filaEncabezadoListas_(cfg) {
  var desde = Math.max(1, CFG.CFG_LISTAS_FILA - 6);
  var col = cfg.getRange(desde, 1, 20, 1).getValues();
  for (var i = 0; i < col.length; i++) {
    if (String(col[i][0] || "").trim().toUpperCase() === "SEDE") return desde + i;
  }
  return CFG.CFG_LISTAS_FILA;
}

function apiResponsables_() {
  var h = _h(CFG.HOJA_RESP);
  var ultima = h.getLastRow();
  if (ultima < CFG.RESP_FILA) return [];
  var datos = h.getRange(CFG.RESP_FILA, 1, ultima - CFG.RESP_FILA + 1, 11).getValues();
  var lista = function (x) { return String(x || "").split(/\s*;\s*/).map(function (v) { return v.trim(); }).filter(String); };
  var out = [];
  datos.forEach(function (r, i) {
    if (!r[1]) return;
    out.push({ id: r[0] || (i + 1), area: r[1], nombre: r[2], cargo: r[3], correo: r[4], telefono: r[5],
               activo: _norm(r[6]) !== "no", fila: CFG.RESP_FILA + i,
               servicios: lista(r[7]), sedes: lista(r[8]).filter(function (x) { return !/^todas$/i.test(x); }),
               palabras: lista(r[9]), copia: lista(r[10]).filter(_correoOk) });
  });
  return out;
}

function apiGuardarResponsable_(r) {
  var h = _h(CFG.HOJA_RESP);
  if (!r.area) return { ok: false, mensaje: "El área o servicio es obligatorio." };
  if (r.correo && !_correoOk(r.correo)) return { ok: false, mensaje: "El correo no es válido." };
  var txt = function (x) { return Array.isArray(x) ? x.join("; ") : String(x || ""); };
  var copia = txt(r.copia);
  if (copia && copia.split(/\s*;\s*/).filter(String).some(function (c) { return !_correoOk(c); })) return { ok: false, mensaje: "Revisa los correos en copia (sepáralos con «;»)." };
  var fila = [r.area, r.nombre || "", r.cargo || "", r.correo || "", r.telefono || "", r.activo === false ? "NO" : "SI",
              txt(r.servicios), txt(r.sedes), txt(r.palabras), copia];

  if (r.fila) {
    h.getRange(r.fila, 2, 1, 10).setValues([fila]);
    _traza("—", "Responsable actualizado", r.area + " · " + (r.nombre || "") + " · " + (r.correo || "sin correo"));
  } else {
    var ultima = h.getLastRow();
    var ids = h.getRange(CFG.RESP_FILA, 1, Math.max(1, ultima - CFG.RESP_FILA + 1), 1).getValues()
               .map(function (x) { return parseInt(x[0], 10) || 0; });
    var nuevoId = Math.max.apply(null, ids.concat([0])) + 1;
    h.appendRow([nuevoId].concat(fila));
    _traza("—", "Responsable creado", r.area + " · " + (r.nombre || "") + " · " + (r.correo || "sin correo"));
  }
  return { ok: true, responsables: apiResponsables_() };
}

function apiEliminarResponsable_(fila) {
  var h = _h(CFG.HOJA_RESP);
  var area = h.getRange(fila, 2).getValue();
  h.getRange(fila, 7).setValue("NO");
  _traza("—", "Responsable desactivado", area);
  return { ok: true, responsables: apiResponsables_() };
}

// ---------------------------------------------------------------------------
// ACUSE DE RECEPCIÓN AL USUARIO (se usa en los tres canales)
// ---------------------------------------------------------------------------
/**
 * Envía al usuario el acuse de radicación y marca la fila. Devuelve el resultado
 * en texto para mostrarlo en pantalla. No contiene información interna de gestión.
 */
function _acuseRecepcion_(fila) {
  var h = _h(CFG.HOJA_DATOS);
  var f = h.getRange(fila, 1, 1, CFG.NCOL).getValues()[0];
  var codigo = f[C.CODIGO - 1];
  var correo = (f[C.CORREO - 1] || "").toString().trim();
  if (!_correoOk(correo)) return "el usuario no dejó correo";
  if (f[C.NOTIF_RECEPCION - 1]) return "ya se había enviado";

  var base = _datosCorreo(f);
  var feli = _esFeli(f[C.TIPO_PQRS - 1]);
  // v8: el acuse dice qué se radicó y cómo se clasificó (tipo, nivel de riesgo y término que aplica)
  var nivel = _nivelDeCategoria_(f[C.CLASIF_INTERNA - 1]);
  var termino = feli ? "" : (HORAS_NIVEL[nivel] && _rango_(nivel) >= 2 ? HORAS_NIVEL[nivel] + " horas" :
    (typeof f[C.TERMINO - 1] === "number" ? _terminoTexto_(f[C.TERMINO - 1], f[C.TIPO_DIA - 1], "") : ""));
  var clasif = feli ? "" : (_rango_(nivel) >= 2 ? "Prioritaria · " + (nivel === "Vital NNA" ? "riesgo vital en menor de edad" : nivel === "Vital" ? "riesgo vital" : "riesgo priorizado") : "");
  var html = _plantilla({
    extraDetalles: [["Tipo de solicitud", _tipoBonito_(f[C.TIPO_PQRS - 1])], ["Clasificación", clasif], ["Término de respuesta", termino]],
    codigo: codigo, tipo: _tipoBonito_(f[C.TIPO_PQRS - 1]), estado: "Recibida", sinProgreso: feli,
    sede: base.sede, servicio: base.servicio, fechaRadicacion: base.fechaRadicacion, fechaMax: base.fechaMax,
    titulo: feli ? "¡Gracias por su felicitación!" : "Recibimos su solicitud",
    mensaje: feli
      ? "Gracias por tomarse el tiempo de escribirnos. Su mensaje quedó registrado y lo compartiremos con el equipo" +
        (base.servicio ? " de <b>" + _html_(base.servicio) + "</b>" : "") + (base.sede ? " en <b>" + _html_(base.sede) + "</b>" : "") +
        ".<br><br>El reconocimiento de nuestros usuarios motiva a quienes le atienden cada día y nos ayuda a mantener una atención humanizada."
      : "Confirmamos la radicación de su <b>" + _html_(String(f[C.TIPO_PQRS - 1] || "solicitud").toLowerCase()) + "</b> con el número que aparece arriba. " +
        "La Oficina de Atención al Usuario la está revisando y le informaremos cada avance: cuando pase al área encargada y cuando tengamos la respuesta." +
        (clasif ? "<br><br>Por lo que nos cuenta, su caso fue marcado como <b>prioritario</b> y se gestionará dentro de las <b>" + termino + "</b> siguientes a su recepción." :
         (base.fechaMax ? " Le daremos respuesta a más tardar el <b>" + base.fechaMax + "</b>." : "")),
    descripcion: f[C.DESCRIPCION - 1],
  });
  var r = _enviar(correo,
    (feli ? "Gracias por su felicitación – " : "Radicación de su " + String(f[C.TIPO_PQRS - 1] || "PQRS").toLowerCase() + " – ") + codigo,
    "Radicado " + codigo, html, feli && MASCOTA_BASE64 ? { imagenes: { mascotaSiau: Utilities.newBlob(Utilities.base64Decode(MASCOTA_BASE64), "image/png", "siau.png") } } : null);
  if (!r.ok) return "error: " + r.error;

  h.getRange(fila, C.NOTIF_RECEPCION).setValue(new Date());
  _traza(codigo, "Notificación de recepción", "Acuse enviado a " + correo);
  return "enviado a " + correo;
}

// ---------------------------------------------------------------------------
// API · RADICAR
// ---------------------------------------------------------------------------
function apiRadicar_(d) {
  var faltan = [];
  if (!d.descripcion) faltan.push("Descripción");
  if (!d.fechaRecepcion) faltan.push("Fecha de recepción");
  if (!d.tipoPqrs) faltan.push("Tipo de PQRS");
  if (faltan.length) return { ok: false, mensaje: "Faltan: " + faltan.join(", ") };

  var fRecepcion = _soloFecha_(d.fechaRecepcion);
  var fPqrs = _soloFecha_(d.fechaPqrs) || fRecepcion;
  var fRadicacion = _soloFecha_(d.fechaRadicacion) || _soloFecha_(new Date());
  if (!fRecepcion) return { ok: false, mensaje: "La fecha de recepción no es válida." };

  var vals = {};
  vals[C.MARCA] = new Date();
  vals[C.FECHA_PQRS] = fPqrs;
  vals[C.FECHA_RECEPCION] = fRecepcion;
  vals[C.FECHA_RADICACION] = fRadicacion;
  vals[C.ESTADO] = "Recibida";
  vals[C.REDIRECCIONES] = 0;
  vals[C.REGISTRADO_POR] = _usuario();
  vals[C.DEPARTAMENTO] = d.departamento || "ATLÁNTICO";
  vals[C.CANAL] = d.canal || "Presencial";
  vals[C.ENTIDAD] = _esFeli(d.tipoPqrs) ? "" : (d.entidad || "SEDE");

  Object.keys(CAMPOS).forEach(function (k) {
    if (["canal","fechaPqrs","fechaRecepcion","fechaRadicacion","entidad","departamento"].indexOf(k) !== -1) return;
    if (d[k] !== undefined && d[k] !== "") vals[CAMPOS[k]] = d[k];
  });

  var res = _reservarRadicado_(fRadicacion, vals), fila = res.fila, codigo = res.codigo;
  SpreadsheetApp.flush();
  _traza(codigo, "Radicación", "Canal " + vals[C.CANAL] + " · PQRS del " + _fmt(fPqrs) +
    " · recibida el " + _fmt(fRecepcion));

  var post = _postRadicacion_(fila, "sugerir");
  var clas = post.tipo;
  SpreadsheetApp.flush();
  var f = _h(CFG.HOJA_DATOS).getRange(fila, 1, 1, CFG.NCOL).getValues()[0];
  var base = _datosCorreo(f);
  // v8.2: con «diferir» (lo usa la interfaz) el acuse, los avisos y el direccionamiento automático salen en un segundo
  // paso (apiNotificarRadicacion) o, si el navegador se cierra, en la revisión de cada 5 minutos. El técnico ve el radicado al instante.
  var acuse = "", auto = "";
  if (d.diferir) { _encolarAvisos_(codigo); acuse = "se envía en segundo plano"; }
  else { var av = _enviarAvisosRadicacion_(fila); acuse = av.acuse; auto = av.direccionada; }
  return { ok: true, codigo: codigo, fila: fila, fechaMax: base.fechaMax || "No aplica", acuse: acuse, pendienteAvisos: !!d.diferir,
           sugerido: clas && clas.tipo && _norm(clas.tipo) !== _norm(d.tipoPqrs) && clas.confianza !== "baja" ? clas.tipo : "",
           riesgo: post.riesgo && post.riesgo.nivel ? post.riesgo : null, areas: post.areas || [], direccionada: auto || "" };
}

// ---------------------------------------------------------------------------
// v8.2 · AVISOS DE UNA RADICACIÓN EN SEGUNDO PLANO
// ---------------------------------------------------------------------------
/** Acuse al usuario, aviso interno (correo y Chat) y direccionamiento automático de un radicado ya escrito. */
function _enviarAvisosRadicacion_(fila) {
  var acuse = _acuseRecepcion_(fila);
  try { _avisoNuevoCaso_(fila, {}); } catch (e) { Logger.log(e); }
  return { acuse: acuse, direccionada: _direccionAutomatica_(fila) || "" };
}
function _cola_() { try { return JSON.parse(PropertiesService.getScriptProperties().getProperty("COLA_AVISOS") || "[]"); } catch (e) { return []; } }
function _guardarCola_(l) { PropertiesService.getScriptProperties().setProperty("COLA_AVISOS", JSON.stringify(l.slice(-300))); }
function _conCandadoDoc_(fn) {
  var lock = null, tomado = false;
  try { lock = (LockService.getDocumentLock && LockService.getDocumentLock()) || LockService.getScriptLock(); } catch (e) {}
  try { if (lock) { lock.waitLock(15000); tomado = true; } } catch (e) {}
  try { return fn(); } finally { if (tomado) { try { lock.releaseLock(); } catch (e) {} } }
}
function _encolarAvisos_(codigo) {
  _conCandadoDoc_(function () { var l = _cola_(); l.push({ c: codigo, t: Date.now() }); _guardarCola_(l); });
}
/** Saca un radicado de la cola; devuelve true solo a quien lo saca (así nadie envía los avisos dos veces). */
function _sacarDeCola_(codigo) {
  return _conCandadoDoc_(function () {
    var l = _cola_(), n = l.length;
    l = l.filter(function (x) { return x.c !== codigo; });
    if (l.length === n) return false;
    _guardarCola_(l); return true;
  });
}
/** Segundo paso de la radicación: lo llama la interfaz apenas muestra el radicado. */
function apiNotificarRadicacion_(codigo) {
  var fila = _filaDe(codigo);
  if (fila < 0) return { ok: false, mensaje: "Radicado no encontrado." };
  if (!_sacarDeCola_(codigo)) return { ok: true, yaEnviado: true, acuse: "ya se había enviado", direccionada: "" };
  var r = _enviarAvisosRadicacion_(fila);
  return { ok: true, acuse: r.acuse, direccionada: r.direccionada };
}
/** Red de seguridad (cada 5 minutos): avisos de radicados cuyo navegador se cerró antes de enviarlos. */
function _procesarColaAvisos_() {
  var l = _cola_(), n = 0, t0 = Date.now();
  l.forEach(function (x) {
    if (Date.now() - t0 > 200000 || Date.now() - x.t < 60000) return;   // a la última no se la gana a la interfaz
    var fila = _filaDe(x.c);
    if (fila < 0) { _sacarDeCola_(x.c); return; }
    if (!_sacarDeCola_(x.c)) return;
    try { _enviarAvisosRadicacion_(fila); n++; } catch (e) { Logger.log("Cola de avisos: " + e); }
  });
  return n;
}

// ---------------------------------------------------------------------------
// API · BANDEJA Y DETALLE
// ---------------------------------------------------------------------------
function apiBandeja_(filtros) {
  filtros = filtros || {};
  CATS_CACHE = _categorias_();
  var h = _h(CFG.HOJA_DATOS);
  var n = CFG.FILA_FIN - CFG.FILA_DATOS + 1;
  var datos = _datos_();
  var texto = _norm(filtros.texto);
  var out = [];

  datos.forEach(function (f, i) {
    if (!f[C.CODIGO - 1] || !_filaVisible_(f)) return;
    var item = {
      fila: CFG.FILA_DATOS + i,
      codigo: f[C.CODIGO - 1],
      canal: f[C.CANAL - 1],
      tipo: f[C.TIPO_PQRS - 1],
      estado: f[C.ESTADO - 1] || "Recibida",
      semaforo: f[C.SEMAFORO - 1],
      sede: f[C.SEDE - 1],
      servicio: f[C.SERVICIO - 1],
      solicitante: f[C.NOMBRE_SOL - 1],
      correo: f[C.CORREO - 1],
      responsable: f[C.RESPONSABLE - 1],
      fechaPqrs: _fmt(f[C.FECHA_PQRS - 1]),
      fechaRecepcion: _fmt(f[C.FECHA_RECEPCION - 1]),
      fechaRadicacion: _fmt(f[C.FECHA_RADICACION - 1]),
      fechaMax: _fmt(f[C.FECHA_MAX - 1]),
      dias: _dias_(f[C.DIAS - 1]),
      clasificacion: f[C.CLASIF_INTERNA - 1],
      prioridad: _prioridadDe_(f[C.CLASIF_INTERNA - 1], f[C.ENTIDAD - 1], CATS_CACHE || (CATS_CACHE = _categorias_())),
      etiquetas: _etiquetasObs_(f[C.OBSERVACIONES - 1]),
      remitente: (/Remitente institucional: ([^(·]+)/.exec(String(f[C.OBSERVACIONES - 1] || "")) || [])[1] || "",
      nivel: _nivelDeCategoria_(f[C.CLASIF_INTERNA - 1], CATS_CACHE) || String(f[C.NIVEL_RIESGO - 1] || "").split(" · ")[0],
      poblacion: String(f[C.POBLACION_PRIORIZADA - 1] || ""),
    };
    // Etapa del flujo: es como trabaja el SIAU (una pestaña por paso)
    if (filtros.etapa && filtros.etapa !== "todas") {
      var est = _norm(item.estado);
      var cerrada = est.indexOf("cerrada") !== -1;
      var conArea = !!f[C.CORREO_RESP - 1];
      var conRta = !!(f[C.RTA_AREA - 1] || "").toString().trim();
      var sem = (item.semaforo || "").toString();
      var pasa = true;
      if (filtros.etapa === "sin_direccionar") pasa = !cerrada && !conArea;
      else if (filtros.etapa === "en_gestion") pasa = !cerrada && conArea && !conRta;
      else if (filtros.etapa === "por_responder") pasa = !cerrada && conRta;
      else if (filtros.etapa === "criticas") pasa = !cerrada && (sem.indexOf("🔴") === 0 || sem.indexOf("🟡") === 0 || sem.indexOf("⚠") === 0);
      else if (filtros.etapa === "cerradas") pasa = cerrada;
      else if (filtros.etapa === "prioritarias") pasa = !cerrada && (_rango_(item.nivel) >= 2 || item.prioridad === "Crítica" || item.prioridad === "Alta");
      else if (filtros.etapa === "felicitaciones") pasa = _esFeli(item.tipo);
      if (!pasa) return;
    }
    if (filtros.estado && _norm(filtros.estado) !== _norm(item.estado)) return;
    if (filtros.semaforo && (item.semaforo || "").indexOf(filtros.semaforo) !== 0) return;
    if (filtros.canal && _norm(filtros.canal) !== _norm(item.canal)) return;
    if (filtros.tipo && _norm(filtros.tipo) !== _norm(item.tipo)) return;
    if (filtros.sede && _norm(filtros.sede) !== _norm(item.sede)) return;
    if (filtros.anio) { var fr0 = f[C.FECHA_RADICACION - 1]; if (!(fr0 instanceof Date) || Utilities.formatDate(fr0, _tz_(), "yyyy") !== String(filtros.anio)) return; }
    if (texto) {
      var blob = _norm([item.codigo, item.solicitante, item.sede, item.servicio, item.tipo,
                        f[C.DESCRIPCION - 1], f[C.NUM_DOC_SOL - 1]].join(" "));
      if (blob.indexOf(texto) === -1) return;
    }
    out.push(item);
  });
  out.reverse();
  var total = out.length;
  if (filtros.etapa !== "cerradas" && filtros.etapa !== "felicitaciones") {
    var rango = { "Crítica": 0, "Alta": 1, "Media": 2, "Normal": 3 };
    out = out.map(function (x, i) { x._i = i; return x; }).sort(function (a, b) {
      return (rango[a.prioridad] - rango[b.prioridad]) || (a._i - b._i); });
  }
  // v8: con miles de registros se envían los primeros 600 (el buscador y los filtros afinan el resto)
  var limite = parseInt(filtros.limite, 10) || 600;
  if (out.length > limite) { out = out.slice(0, limite); out.__recortado = total; }
  return out;
}

function apiDetalle_(codigo) {
  var fila = _filaDe(codigo);
  if (fila < 0) return { ok: false, mensaje: "No encontré el radicado " + codigo };
  var f = _h(CFG.HOJA_DATOS).getRange(fila, 1, 1, CFG.NCOL).getValues()[0];

  var d = { ok: true, fila: fila };
  Object.keys(CAMPOS).forEach(function (k) { d[k] = f[CAMPOS[k] - 1]; });
  ["fechaPqrs","fechaRecepcion","fechaRadicacion"].forEach(function (k) { d[k] = _fmt(f[CAMPOS[k] - 1]); });
  d.codigo = f[C.CODIGO - 1];
  d.estado = f[C.ESTADO - 1] || "Recibida";
  d.semaforo = f[C.SEMAFORO - 1];
  d.termino = f[C.TERMINO - 1];
  d.tipoDia = f[C.TIPO_DIA - 1];
  d.fechaMax = _fmt(f[C.FECHA_MAX - 1]);
  d.dias = _dias_(f[C.DIAS - 1]);
  d.terminoTexto = _terminoTexto_(d.termino, d.tipoDia, f[C.ENTIDAD - 1]);
  if (typeof d.termino !== "number" && f[C.CLASIF_INTERNA - 1]) {   // v7: la categoría del correo manda sobre la entidad
    var catD = (CATS_CACHE || (CATS_CACHE = _categorias_())).filter(function (c) { return _norm(c.nombre) === _norm(f[C.CLASIF_INTERNA - 1]); })[0];
    if (catD && catD.dias) d.terminoTexto = catD.dias + (catD.dias == 1 ? " día " : " días ") + String(catD.tipoDia || "calendario").toLowerCase() + " · " + catD.nombre;
  }
  d.semaforoTexto = _limpiarSimbolo_(d.semaforo);
  d.oportunidad = f[C.OPORTUNIDAD - 1];
  d.responsable = f[C.RESPONSABLE - 1];
  d.correoResponsable = f[C.CORREO_RESP - 1];
  d.fechaEnvioArea = _fmt(f[C.FECHA_ENVIO_AREA - 1]);
  d.redirecciones = f[C.REDIRECCIONES - 1] || 0;
  d.respuestaArea = f[C.RTA_AREA - 1];
  d.fechaRespuestaArea = _fmt(f[C.FECHA_RTA_AREA - 1]);
  d.respuestaUsuario = f[C.RTA_USUARIO - 1];
  d.fechaRespuestaUsuario = _fmt(f[C.FECHA_RTA_USUARIO - 1]);
  d.registradoPor = f[C.REGISTRADO_POR - 1];
  d.notificaciones = {
    recepcion: _fmt(f[C.NOTIF_RECEPCION - 1]),
    area: _fmt(f[C.NOTIF_AREA - 1]),
    gestion: _fmt(f[C.NOTIF_GESTION - 1]),
    cierre: _fmt(f[C.NOTIF_CIERRE - 1]),
  };
  d.traza = _trazaDe(d.codigo);
  d.clasificacionInterna = f[C.CLASIF_INTERNA - 1];
  d.prioridad = _prioridadDe_(f[C.CLASIF_INTERNA - 1], f[C.ENTIDAD - 1]);
  d.etiquetas = _etiquetasObs_(f[C.OBSERVACIONES - 1]);
  d.recepcionHora = f[C.MARCA - 1] instanceof Date ? Utilities.formatDate(f[C.MARCA - 1], _tz_(), "dd/MM/yyyy HH:mm") : "";
  d.hiloId = "";
  if (f[C.ID_CORREO - 1]) { try { d.hiloId = GmailApp.getMessageById(f[C.ID_CORREO - 1]).getThread().getId(); } catch (e) {} }
  // v8 · riesgo, población priorizada, autorización de datos y áreas sugeridas
  var cats8 = CATS_CACHE || (CATS_CACHE = _categorias_());
  d.nivelRiesgo = _nivelDeCategoria_(f[C.CLASIF_INTERNA - 1], cats8) || String(f[C.NIVEL_RIESGO - 1] || "").split(" · ")[0];
  d.riesgoTexto = String(f[C.NIVEL_RIESGO - 1] || "");
  d.poblacionPriorizada = String(f[C.POBLACION_PRIORIZADA - 1] || "").split(/\s*;\s*/).filter(String);
  d.riesgoManual = /\[Riesgo manual:/.test(String(f[C.OBSERVACIONES - 1] || ""));
  d.riesgoRazones = ((/\[Riesgo: [^·\]]*·\s*([^\]]*)\]/.exec(String(f[C.OBSERVACIONES - 1] || "")) || [])[1] || "");
  if (HORAS_NIVEL[d.nivelRiesgo] && _rango_(d.nivelRiesgo) >= 2) {
    d.limiteHoras = _fmtHora_(_limiteHoras_(f, d.nivelRiesgo));
    d.terminoTexto = HORAS_NIVEL[d.nivelRiesgo] + " horas · " + _nivelNorma_(d.nivelRiesgo);
  } else if (catD0(f, cats8)) d.normaTermino = catD0(f, cats8);
  d.autorizacionDatos = f[C.AUTORIZACION_DATOS - 1] || "";
  d.areaSugerida = f[C.AREA_SUGERIDA - 1] || "";
  try { d.areasSugeridas = f[C.CORREO_RESP - 1] ? [] : _sugerirArea_(f); } catch (e) { d.areasSugeridas = []; }
  d.esFelicitacion = _esFeli(f[C.TIPO_PQRS - 1]);
  return d;
}
function catD0(f, cats) {
  var c = cats.filter(function (x) { return _norm(x.nombre) === _norm(f[C.CLASIF_INTERNA - 1]); })[0];
  return c && c.norma ? c.norma : "";
}

function _trazaDe(codigo) {
  var h = _h(CFG.HOJA_TRAZA);
  var ultima = h.getLastRow();
  if (ultima < CFG.TRAZA_FILA) return [];
  var datos = h.getRange(CFG.TRAZA_FILA, 1, ultima - CFG.TRAZA_FILA + 1, 5).getValues();
  return datos.filter(function (r) { return (r[1] || "").toString().trim() === codigo; })
    .map(function (r) {
      return { fecha: Utilities.formatDate(new Date(r[0]), _tz_(), "dd/MM/yyyy HH:mm"),
               accion: r[2], detalle: r[3], usuario: r[4] };
    }).reverse();
}

function apiActualizarDatos_(codigo, campos) {
  var fila = _filaDe(codigo);
  if (fila < 0) return { ok: false, mensaje: "Radicado no encontrado." };
  var vals = {}, cambios = [];
  Object.keys(campos).forEach(function (k) {
    if (CAMPOS[k] === undefined) return;
    var v = campos[k];
    if (["fechaPqrs","fechaRecepcion","fechaRadicacion"].indexOf(k) !== -1) v = _fechaDeTexto(v);
    vals[CAMPOS[k]] = v;
    cambios.push(k);
  });
  _escribir(fila, vals);
  SpreadsheetApp.flush();
  _traza(codigo, "Clasificación / edición", "Campos: " + cambios.join(", "));
  return apiDetalle_(codigo);
}

// ---------------------------------------------------------------------------
// API · GESTIÓN (enviar al área, redireccionar, responder, cerrar)
// ---------------------------------------------------------------------------
function _responsablePorId(id) {
  var lista = apiResponsables_();
  for (var i = 0; i < lista.length; i++) if (String(lista[i].id) === String(id)) return lista[i];
  return null;
}

/** Envía la PQRS al área responsable y avisa al usuario que pasó a gestión. */
function apiEnviarAlArea_(codigo, idResponsable, nota) {
  var fila = _filaDe(codigo);
  if (fila < 0) return { ok: false, mensaje: "Radicado no encontrado." };
  var resp = _responsablePorId(idResponsable);
  if (!resp) return { ok: false, mensaje: "Selecciona un área responsable." };
  if (!_correoOk(resp.correo)) {
    return { ok: false, mensaje: "«" + resp.area + "» no tiene un correo válido. Edítalo en el módulo Responsables antes de enviar." };
  }

  var h = _h(CFG.HOJA_DATOS);
  var f = h.getRange(fila, 1, 1, CFG.NCOL).getValues()[0];
  var base = _datosCorreo(f);
  base.responsable = resp.area + (resp.nombre ? " · " + resp.nombre : "");

  var htmlArea = _plantilla({
    interno: true,
    codigo: codigo, tipo: f[C.TIPO_PQRS - 1], estado: "En gestión", sinProgreso: true,
    sede: base.sede, servicio: base.servicio, fechaRadicacion: base.fechaRadicacion,
    fechaMax: base.fechaMax, responsable: base.responsable, dias: base.dias,
    solicitante: f[C.NOMBRE_SOL - 1], documento: f[C.NUM_DOC_SOL - 1],
    contacto: [(f[C.TELEFONO - 1] || ""), (f[C.CORREO - 1] || "")].filter(String).join(" · "),
    titulo: "Solicitud de gestión de PQRS",
    mensaje: "La Oficina de Atención al Usuario le remite esta PQRS para gestión de su área." +
      (base.fechaMax ? " El término legal vence el <b>" + base.fechaMax + "</b>, por lo que agradecemos su respuesta antes de esa fecha." : "") +
      "<br><br><b>Qué se requiere:</b> responder <b>a este mismo correo</b> describiendo la causa identificada, las acciones realizadas o previstas " +
      "y la información que deba entregarse al usuario. El SIAU redactará con eso la respuesta oficial.",
    descripcion: f[C.DESCRIPCION - 1],
    gestion: nota || "",
  });
  var feliArea = _esFeli(f[C.TIPO_PQRS - 1]);
  if (feliArea) htmlArea = _plantilla({ interno: true, reconocimiento: true, codigo: codigo, tipo: f[C.TIPO_PQRS - 1], sinProgreso: true,
    sede: base.sede, servicio: base.servicio, fechaRadicacion: base.fechaRadicacion, responsable: base.responsable,
    titulo: "Un usuario reconoce la labor de su equipo",
    mensaje: "La Oficina de Atención al Usuario comparte con ustedes esta felicitación. Gracias por su compromiso con una atención humanizada, segura y cercana." +
      "<br><br>No requiere gestión ni respuesta. Si desean enviar unas palabras al usuario, respondan a este correo y el SIAU se las hará llegar." +
      (nota ? "<br><br><b>Nota del SIAU:</b> " + _html_(nota) : ""),
    descripcion: f[C.DESCRIPCION - 1] });
  var nivelA = _nivelDeCategoria_(f[C.CLASIF_INTERNA - 1]);
  var prefijoRiesgo = _rango_(nivelA) >= 2 ? "[" + nivelA.toUpperCase() + " · " + HORAS_NIVEL[nivelA] + " H] " : "";
  var r1 = _enviar(resp.correo, feliArea
      ? "[RECONOCIMIENTO · " + codigo + "] Felicitación para " + (base.servicio || resp.area)
      : prefijoRiesgo + "[SOLICITUD INTERNA · PQRS " + codigo + "] " + (f[C.TIPO_PQRS - 1] || "") + " – " + (base.servicio || "") + (base.fechaMax ? " · vence " + base.fechaMax : ""),
    (feliArea ? "Reconocimiento de un usuario — " : "Solicitud interna de gestión — PQRS ") + codigo + ".", htmlArea, { cc: (resp.copia || []).join(",") });
  if (!r1.ok) return { ok: false, mensaje: "No se pudo enviar al área: " + r1.error };

  h.getRange(fila, C.RESPONSABLE).setValue(base.responsable);
  h.getRange(fila, C.CORREO_RESP).setValue(resp.correo);
  h.getRange(fila, C.FECHA_ENVIO_AREA).setValue(new Date());
  h.getRange(fila, C.NOTIF_AREA).setValue(new Date());
  // v8: la felicitación no requiere gestión ni respuesta: al entregarse al área queda cerrada.
  h.getRange(fila, C.ESTADO).setValue(feliArea ? "Respondida - Cerrada" : "En gestión");
  SpreadsheetApp.flush();
  _traza(codigo, feliArea ? "Felicitación entregada al área" : "Enviada al área", resp.area + " (" + resp.correo + ")" + (nota ? " · Nota: " + nota : ""));

  // Aviso al usuario de que su PQRS está en gestión (las felicitaciones solo reciben el acuse)
  var avisoUsuario = feliArea ? "no aplica (felicitación: el usuario ya recibió el agradecimiento)" : "el usuario no dejó correo";
  var correoUsr = f[C.CORREO - 1];
  if (!feliArea && _correoOk(correoUsr)) {
    var htmlUsr = _plantilla({
      codigo: codigo, tipo: f[C.TIPO_PQRS - 1], estado: "En gestión",
      sede: base.sede, servicio: base.servicio, fechaRadicacion: base.fechaRadicacion,
      fechaMax: base.fechaMax,
      titulo: _esFeli(f[C.TIPO_PQRS - 1]) ? "Entregamos su felicitación al equipo" : "Su solicitud está en trámite",
      mensaje: _esFeli(f[C.TIPO_PQRS - 1])
        ? "Su mensaje de reconocimiento ya llegó a <b>" + _html_(resp.area) + "</b>. Gracias por destacar el trabajo de nuestro equipo: palabras como las suyas nos impulsan a seguir mejorando."
        : "Le informamos que su <b>" + (f[C.TIPO_PQRS - 1] || "solicitud") + "</b> fue revisada por la Oficina de " +
        "Atención al Usuario y se encuentra en trámite con el área encargada." +
        (base.fechaMax ? " Recibirá nuestra respuesta a más tardar el <b>" + base.fechaMax + "</b>." : "") +
        "<br><br>No requiere hacer nada: le escribiremos apenas tengamos la respuesta.",
    });
    var r2 = _enviar(correoUsr, _esFeli(f[C.TIPO_PQRS - 1]) ? "Entregamos su felicitación – " + codigo : "Su PQRS " + codigo + " está en trámite",
      "Su PQRS " + codigo + " está en trámite.", htmlUsr);
    if (r2.ok) {
      h.getRange(fila, C.NOTIF_GESTION).setValue(new Date());
      avisoUsuario = "enviado a " + correoUsr;
      _traza(codigo, "Notificación al usuario", "Aviso de «en gestión» enviado a " + correoUsr);
    } else { avisoUsuario = "error: " + r2.error; }
  }

  var det = apiDetalle_(codigo);
  det.aviso = { area: "enviado a " + resp.correo, usuario: avisoUsuario };
  return det;
}

/** Corrige un direccionamiento equivocado: notifica al área correcta y deja el registro. */
function apiRedireccionar_(codigo, idResponsable, motivo) {
  var fila = _filaDe(codigo);
  if (fila < 0) return { ok: false, mensaje: "Radicado no encontrado." };
  var nuevo = _responsablePorId(idResponsable);
  if (!nuevo) return { ok: false, mensaje: "Selecciona el área a la que se redirecciona." };
  if (!_correoOk(nuevo.correo)) return { ok: false, mensaje: "«" + nuevo.area + "» no tiene correo válido." };

  var h = _h(CFG.HOJA_DATOS);
  var f = h.getRange(fila, 1, 1, CFG.NCOL).getValues()[0];
  var anterior = f[C.RESPONSABLE - 1], correoAnterior = f[C.CORREO_RESP - 1];
  var base = _datosCorreo(f);

  var html = _plantilla({
    interno: true, sinProgreso: true,
    codigo: codigo, tipo: f[C.TIPO_PQRS - 1], estado: "En gestión",
    sede: base.sede, servicio: base.servicio, fechaRadicacion: base.fechaRadicacion,
    fechaMax: base.fechaMax, responsable: nuevo.area, dias: base.dias,
    solicitante: f[C.NOMBRE_SOL - 1], documento: f[C.NUM_DOC_SOL - 1],
    titulo: "Solicitud de gestión de PQRS (redireccionada)",
    mensaje: "Esta PQRS estaba asignada a <b>" + (anterior || "otra área") +
      "</b> y fue redireccionada a su área porque le corresponde su gestión." +
      (base.fechaMax ? " El término vence el <b>" + base.fechaMax + "</b>." : "") +
      "<br><br>Responda a este correo con la gestión realizada.",
    descripcion: f[C.DESCRIPCION - 1],
    gestion: motivo || "",
  });
  var r1 = _enviar(nuevo.correo, "[SOLICITUD INTERNA · PQRS " + codigo + "] Redireccionada a su área",
    "PQRS " + codigo + " redireccionada a su área.", html);
  if (!r1.ok) return { ok: false, mensaje: "No se pudo notificar: " + r1.error };

  if (_correoOk(correoAnterior) && correoAnterior !== nuevo.correo) {
    _enviar(correoAnterior, "[INTERNO · PQRS " + codigo + "] Ya no está a su cargo",
      "La PQRS " + codigo + " fue redireccionada a " + nuevo.area + ".",
      _plantilla({ interno: true, codigo: codigo, tipo: f[C.TIPO_PQRS - 1], estado: "En gestión", sinProgreso: true,
        titulo: "Esta PQRS pasó a otra área",
        mensaje: "La PQRS <b>" + codigo + "</b> fue redireccionada a <b>" + nuevo.area +
          "</b>, por lo que ya no requiere su gestión." + (motivo ? "<br><br>Motivo: " + motivo : ""),
        responsable: nuevo.area }));
  }

  h.getRange(fila, C.RESPONSABLE).setValue(nuevo.area + (nuevo.nombre ? " · " + nuevo.nombre : ""));
  h.getRange(fila, C.CORREO_RESP).setValue(nuevo.correo);
  h.getRange(fila, C.FECHA_ENVIO_AREA).setValue(new Date());
  h.getRange(fila, C.NOTIF_AREA).setValue(new Date());
  h.getRange(fila, C.ESTADO).setValue("En gestión");
  h.getRange(fila, C.REDIRECCIONES).setValue((parseInt(f[C.REDIRECCIONES - 1], 10) || 0) + 1);
  SpreadsheetApp.flush();
  _traza(codigo, "Redireccionada", "De «" + (anterior || "sin área") + "» a «" + nuevo.area + "»" +
    (motivo ? " · Motivo: " + motivo : ""));
  return apiDetalle_(codigo);
}

/** Guarda la respuesta que el área envió por correo interno. */
function apiRegistrarRespuestaArea_(codigo, texto, fecha) {
  var fila = _filaDe(codigo);
  if (fila < 0) return { ok: false, mensaje: "Radicado no encontrado." };
  if (!texto) return { ok: false, mensaje: "Pega la respuesta que envió el área." };
  var h = _h(CFG.HOJA_DATOS);
  h.getRange(fila, C.RTA_AREA).setValue(texto);
  h.getRange(fila, C.FECHA_RTA_AREA).setValue(_soloFecha_(fecha) || _soloFecha_(new Date()));
  SpreadsheetApp.flush();
  _traza(codigo, "Respuesta del área registrada", texto.substring(0, 300));
  return apiDetalle_(codigo);
}

/** Envía al usuario la respuesta final ajustada por el SIAU y cierra la PQRS. */
function apiResponderUsuario_(codigo, textoFinal, cerrar) {
  var fila = _filaDe(codigo);
  if (fila < 0) return { ok: false, mensaje: "Radicado no encontrado." };
  if (!textoFinal) return { ok: false, mensaje: "Escribe la respuesta para el usuario." };

  var h = _h(CFG.HOJA_DATOS);
  var f = h.getRange(fila, 1, 1, CFG.NCOL).getValues()[0];
  var correoUsr = f[C.CORREO - 1];
  if (!_correoOk(correoUsr)) {
    h.getRange(fila, C.RTA_USUARIO).setValue(textoFinal);
    h.getRange(fila, C.FECHA_RTA_USUARIO).setValue(_soloFecha_(new Date()));
    if (cerrar !== false) h.getRange(fila, C.ESTADO).setValue("Respondida - Cerrada");
    SpreadsheetApp.flush();
    _traza(codigo, "Respuesta al usuario", "Registrada sin envío: el usuario no tiene correo. Entregar por otro medio.");
    var det0 = apiDetalle_(codigo);
    det0.aviso = { usuario: "sin correo: entrega la respuesta por teléfono o físicamente" };
    return det0;
  }

  var base = _datosCorreo(f);
  var html = _plantilla({
    codigo: codigo, tipo: f[C.TIPO_PQRS - 1], estado: "Respondida - Cerrada",
    sede: base.sede, servicio: base.servicio, fechaRadicacion: base.fechaRadicacion,
    fechaMax: base.fechaMax, responsable: f[C.RESPONSABLE - 1],
    titulo: _esFeli(f[C.TIPO_PQRS - 1]) ? "Gracias por su felicitación" : "Respuesta a su solicitud",
    mensaje: _esFeli(f[C.TIPO_PQRS - 1])
      ? "Queremos contarle que su mensaje, radicado el " + base.fechaRadicacion + ", fue compartido con nuestro equipo."
      : "Damos respuesta a su <b>" + (f[C.TIPO_PQRS - 1] || "solicitud") + "</b> radicada el " + base.fechaRadicacion + ".",
    respuesta: textoFinal,
  });
  var r = _enviar(correoUsr, (_esFeli(f[C.TIPO_PQRS - 1]) ? "Gracias por su felicitación – " : "Respuesta a su PQRS ") + codigo, textoFinal, html);
  if (!r.ok) return { ok: false, mensaje: "No se pudo enviar: " + r.error };

  h.getRange(fila, C.RTA_USUARIO).setValue(textoFinal);
  h.getRange(fila, C.FECHA_RTA_USUARIO).setValue(_soloFecha_(new Date()));
  h.getRange(fila, C.NOTIF_CIERRE).setValue(new Date());
  if (cerrar !== false) h.getRange(fila, C.ESTADO).setValue("Respondida - Cerrada");
  SpreadsheetApp.flush();
  _traza(codigo, "Respuesta enviada al usuario", "A " + correoUsr + " · " + textoFinal.substring(0, 250));
  var avisoArea = _avisoCierreArea_(codigo, f, textoFinal);

  var det = apiDetalle_(codigo);
  det.aviso = { usuario: "enviado a " + correoUsr, area: avisoArea };
  return det;
}

/** v8 · Cuarto paso: el área sabe que su gestión se convirtió en la respuesta final y que el caso quedó cerrado. */
function _avisoCierreArea_(codigo, f, textoFinal) {
  if (_esFeli(f[C.TIPO_PQRS - 1]) || !_ajustes_().avisoCierreArea) return "";
  var correoArea = String(f[C.CORREO_RESP - 1] || "").trim();
  if (!_correoOk(correoArea)) return "";
  var html = _correoHilo_({ interno: "AVISO INTERNO · PQRS CERRADA", kicker: f[C.TIPO_PQRS - 1], codigo: codigo,
    titulo: "Se respondió al usuario y el caso quedó cerrado",
    mensaje: "Gracias por su gestión. Con la información que envió su área, la Oficina de Atención al Usuario redactó y envió la respuesta oficial al usuario." +
      "\n\nAbajo encuentra el texto enviado para su conocimiento. No requiere ninguna acción adicional, salvo las acciones de mejora que su área haya definido.",
    fechas: { recepcion: _fmt(f[C.FECHA_RECEPCION - 1]), radicacion: _fmt(f[C.FECHA_RADICACION - 1]) },
    detalles: [["Sede", f[C.SEDE - 1]], ["Servicio", f[C.SERVICIO - 1]], ["Respuesta enviada el", _fmt(new Date())]],
    cita: textoFinal, citaTitulo: "Respuesta enviada al usuario" });
  var r = _enviar(correoArea, "[CERRADA · PQRS " + codigo + "] Respuesta enviada al usuario", "PQRS " + codigo + " cerrada.", html);
  if (r.ok) _traza(codigo, "Aviso de cierre al área", correoArea);
  return r.ok ? "cierre notificado a " + correoArea : "";
}

/** Reenvía una notificación que falló o que el área dice no haber recibido. */
function apiReenviar_(codigo, tipo) {
  var fila = _filaDe(codigo);
  if (fila < 0) return { ok: false, mensaje: "Radicado no encontrado." };
  var f = _h(CFG.HOJA_DATOS).getRange(fila, 1, 1, CFG.NCOL).getValues()[0];
  var base = _datosCorreo(f);

  if (tipo === "area") {
    if (!_correoOk(f[C.CORREO_RESP - 1])) return { ok: false, mensaje: "Esta PQRS aún no tiene área asignada." };
    var html = _plantilla({ interno: true, sinProgreso: true,
      codigo: codigo, tipo: f[C.TIPO_PQRS - 1], estado: f[C.ESTADO - 1],
      sede: base.sede, servicio: base.servicio, fechaRadicacion: base.fechaRadicacion, fechaMax: base.fechaMax,
      responsable: f[C.RESPONSABLE - 1], dias: base.dias,
      solicitante: f[C.NOMBRE_SOL - 1],
      titulo: "Recordatorio · PQRS pendiente de su gestión",
      mensaje: "Le reenviamos esta PQRS asignada a su área." +
        (base.fechaMax ? " El término vence el <b>" + base.fechaMax + "</b>." : ""),
      descripcion: f[C.DESCRIPCION - 1] });
    var r = _enviar(f[C.CORREO_RESP - 1], "[SOLICITUD INTERNA · PQRS " + codigo + "] Recordatorio",
      "Recordatorio PQRS " + codigo, html);
    if (!r.ok) return { ok: false, mensaje: r.error };
    _traza(codigo, "Reenvío al área", f[C.CORREO_RESP - 1]);
    return { ok: true, mensaje: "Reenviado a " + f[C.CORREO_RESP - 1] };
  }

  if (!_correoOk(f[C.CORREO - 1])) return { ok: false, mensaje: "El usuario no tiene correo registrado." };
  var html2 = _plantilla({ codigo: codigo, tipo: f[C.TIPO_PQRS - 1], estado: f[C.ESTADO - 1],
    sede: base.sede, servicio: base.servicio, fechaRadicacion: base.fechaRadicacion, fechaMax: base.fechaMax,
    responsable: f[C.RESPONSABLE - 1], titulo: "Estado de su solicitud",
    mensaje: "Le reenviamos el estado actual de su PQRS.",
    respuesta: f[C.RTA_USUARIO - 1] || "" });
  var r2 = _enviar(f[C.CORREO - 1], "Estado de su PQRS " + codigo, "Estado de su PQRS " + codigo, html2);
  if (!r2.ok) return { ok: false, mensaje: r2.error };
  _traza(codigo, "Reenvío al usuario", f[C.CORREO - 1]);
  return { ok: true, mensaje: "Reenviado a " + f[C.CORREO - 1] };
}

// ---------------------------------------------------------------------------
// API · TABLERO
// ---------------------------------------------------------------------------
function apiDashboard_(filtros) {
  filtros = filtros || {};
  var h = _h(CFG.HOJA_DATOS);
  var n = CFG.FILA_FIN - CFG.FILA_DATOS + 1;
  var datos = _datos_();
  var tz = _tz_();
  var hoy = _soloFecha_(new Date());
  var anioActual = parseInt(Utilities.formatDate(hoy, tz, "yyyy"), 10);

  // Filtro por año y mes (mes 0 = todo el año). «anio» vacío = histórico completo.
  var anio = filtros.anio === "" || filtros.anio === undefined ? null : parseInt(filtros.anio, 10);
  var mes = parseInt(filtros.mes, 10) || 0;
  if (filtros.periodo) {            // compatibilidad con la versión anterior
    anio = anioActual;
    if (filtros.periodo === "mes") mes = parseInt(Utilities.formatDate(hoy, tz, "M"), 10);
  }
  var anioTendencia = anio || anioActual;

  var res = {
    anio: anio, mes: mes, anioTendencia: anioTendencia,
    total: 0, enTermino: 0, porVencer: 0, vencidas: 0, cerradas: 0, abiertas: 0,
    felicitaciones: 0, porRevisar: 0, sinArea: 0, aTiempo: 0, fueraTermino: 0,
    sumDias: 0, nDias: 0, sumRespArea: 0, nRespArea: 0,
    porEstado: {}, porTipo: {}, porCanal: {}, porSede: {}, porServicio: {},
    porMes: {}, porMesCerradas: {}, porMesTipo: {}, porResponsable: {}, porSemaforo: {},
    criticas: [], sedes: [], servicios: [], anios: [],
  };
  var mas = function (o, k) { if (!k) return; o[k] = (o[k] || 0) + 1; };
  var sedesSet = {}, serviciosSet = {}, aniosSet = {};
  aniosSet[anioActual] = true;

  datos.forEach(function (f) {
    if (!f[C.CODIGO - 1] || !_filaVisible_(f)) return;
    var sede = f[C.SEDE - 1], servicio = f[C.SERVICIO - 1];
    if (sede) sedesSet[sede] = true;
    if (servicio) serviciosSet[servicio] = true;

    var fr = f[C.FECHA_RADICACION - 1];
    var valida = fr instanceof Date && !isNaN(fr.getTime());
    var y = valida ? parseInt(Utilities.formatDate(fr, tz, "yyyy"), 10) : null;
    var m = valida ? parseInt(Utilities.formatDate(fr, tz, "M"), 10) : null;
    if (y) aniosSet[y] = true;
    if (filtros.sede && sede !== filtros.sede) return;
    if (filtros.servicio && servicio !== filtros.servicio) return;

    var estado = f[C.ESTADO - 1] || "Recibida";
    var cerrada = _norm(estado).indexOf("cerrada") !== -1;

    // Tendencia: los 12 meses del año elegido, sin importar el mes seleccionado.
    if (valida && y === anioTendencia) {
      var k = y + "-" + ("0" + m).slice(-2);
      mas(res.porMes, k);
      if (cerrada) mas(res.porMesCerradas, k);
      var pm = res.porMesTipo[k] || (res.porMesTipo[k] = {});
      mas(pm, f[C.TIPO_PQRS - 1] || "Sin clasificar");
    }

    if (anio && (!valida || y !== anio)) return;
    if (mes && (!valida || m !== mes)) return;

    res.total++;
    var sem = (f[C.SEMAFORO - 1] || "").toString();
    var etiquetaSem = _limpiarSimbolo_(sem) || "Sin dato";
    mas(res.porSemaforo, etiquetaSem);
    if (sem.indexOf("🟢") === 0) res.enTermino++;
    else if (sem.indexOf("🟡") === 0) res.porVencer++;
    else if (sem.indexOf("🔴") === 0) res.vencidas++;
    else if (sem.indexOf("✅") === 0) res.cerradas++;
    else if (sem.indexOf("⭐") === 0) res.felicitaciones++;
    else if (sem.indexOf("⚠") === 0) res.porRevisar++;

    if (!cerrada) res.abiertas++;
    mas(res.porEstado, estado);
    mas(res.porTipo, f[C.TIPO_PQRS - 1] || "Sin clasificar");
    mas(res.porCanal, f[C.CANAL - 1]);
    mas(res.porSede, sede);
    mas(res.porServicio, servicio);
    if (f[C.RESPONSABLE - 1]) mas(res.porResponsable, f[C.RESPONSABLE - 1].toString().split(" · ")[0]);
    if (!f[C.CORREO_RESP - 1] && !cerrada && !_esFeli(f[C.TIPO_PQRS - 1])) res.sinArea++;

    var op = (f[C.OPORTUNIDAD - 1] || "").toString();
    if (op === "A tiempo") res.aTiempo++;
    else if (op === "Fuera de término") res.fueraTermino++;
    if (op && typeof f[C.DIAS - 1] === "number") { res.sumDias += Math.round(f[C.DIAS - 1]); res.nDias++; }

    var fEnvio = f[C.FECHA_ENVIO_AREA - 1], fRta = f[C.FECHA_RTA_AREA - 1];
    if (fEnvio instanceof Date && fRta instanceof Date) {
      res.sumRespArea += Math.max(0, Math.round((fRta - fEnvio) / 86400000));
      res.nRespArea++;
    }

    if (sem.indexOf("🔴") === 0 || sem.indexOf("🟡") === 0 || sem.indexOf("⚠") === 0) {
      res.criticas.push({
        codigo: f[C.CODIGO - 1], semaforo: etiquetaSem,
        nivel: sem.indexOf("🔴") === 0 ? "alto" : (sem.indexOf("🟡") === 0 ? "medio" : "dato"),
        tipo: f[C.TIPO_PQRS - 1], sede: sede, servicio: servicio,
        responsable: f[C.RESPONSABLE - 1] || "Sin asignar",
        fechaMax: _fmt(f[C.FECHA_MAX - 1]), orden: f[C.FECHA_MAX - 1] instanceof Date ? f[C.FECHA_MAX - 1].getTime() : 9e15,
        dias: _dias_(f[C.DIAS - 1]),
      });
    }
  });

  res.promedioDias = res.nDias ? Math.round(res.sumDias / res.nDias * 10) / 10 : 0;
  res.promedioArea = res.nRespArea ? Math.round(res.sumRespArea / res.nRespArea * 10) / 10 : 0;
  res.cumplimiento = (res.aTiempo + res.fueraTermino)
    ? Math.round(res.aTiempo / (res.aTiempo + res.fueraTermino) * 100) : null;
  res.tasaCierre = res.total ? Math.round((res.total - res.abiertas) / res.total * 100) : 0;
  res.criticas.sort(function (a, b) { return a.orden - b.orden; });
  res.criticas = res.criticas.slice(0, 30);
  res.sedes = Object.keys(sedesSet).sort();
  res.servicios = Object.keys(serviciosSet).sort();
  res.anios = Object.keys(aniosSet).map(Number).sort(function (a, b) { return b - a; });
  return res;
}

// ---------------------------------------------------------------------------
// v8.2 · EXPORTAR A EXCEL Y RESPALDO EN DRIVE
// ---------------------------------------------------------------------------
/*
 * El Excel se arma SOLO con los valores del consolidado (nunca se exporta el libro completo, porque
 * incluye la hoja Usuarios con las claves). Se genera en un libro temporal, se convierte a .xlsx con la
 * exportación de Google y se guarda en la carpeta «PQRS · Respaldos (Excel)» del Drive de la cuenta que
 * ejecuta la plataforma. Si el archivo pesa ≤ 6 MB también se entrega al navegador para descargarlo.
 * El respaldo diario (rutinaDiaria, 7:00 a.m.) guarda un archivo por día y conserva los últimos 14.
 */
var CARPETA_RESPALDOS = "PQRS · Respaldos (Excel)";
var DIAS_RESPALDOS = 14;
var MAX_ENTREGA_XLSX = 6 * 1024 * 1024;
var COLS_FECHA_XLSX = [C.FECHA_PQRS, C.FECHA_RECEPCION, C.FECHA_RADICACION, C.FECHA_MAX, C.FECHA_ENVIO_AREA, C.FECHA_RTA_AREA,
                       C.FECHA_RTA_USUARIO, C.NOTIF_RECEPCION, C.NOTIF_AREA, C.NOTIF_GESTION, C.NOTIF_CIERRE];

function _carpetaRespaldos_() {
  var it = DriveApp.getFoldersByName(CARPETA_RESPALDOS);
  return it.hasNext() ? it.next() : DriveApp.createFolder(CARPETA_RESPALDOS);
}

/** Filas del consolidado que ve el usuario actual, filtradas por año, mes, sede y servicio. */
function _filasExcel_(filtros) {
  filtros = filtros || {};
  var tz = _tz_(), anio = parseInt(filtros.anio, 10) || 0, mes = parseInt(filtros.mes, 10) || 0, out = [];
  _datos_().forEach(function (f) {
    if (!f[C.CODIGO - 1] || !_filaVisible_(f)) return;
    if (filtros.sede && f[C.SEDE - 1] !== filtros.sede) return;
    if (filtros.servicio && f[C.SERVICIO - 1] !== filtros.servicio) return;
    if (anio || mes) {
      var fr = f[C.FECHA_RADICACION - 1];
      if (!(fr instanceof Date) || isNaN(fr.getTime())) return;
      if (anio && parseInt(Utilities.formatDate(fr, tz, "yyyy"), 10) !== anio) return;
      if (mes && parseInt(Utilities.formatDate(fr, tz, "M"), 10) !== mes) return;
    }
    out.push(f);
  });
  return out;
}

function _conteo_(filas, col) {
  var m = {};
  filas.forEach(function (f) { var k = String(f[col - 1] || "Sin dato").trim() || "Sin dato"; m[k] = (m[k] || 0) + 1; });
  return Object.keys(m).sort(function (a, b) { return m[b] - m[a]; }).map(function (k) { return [k, m[k]]; });
}

/** Arma el .xlsx (hojas «Consolidado» y «Resumen») y devuelve el blob. */
function _construirXlsx_(nombre, filas, descripcionFiltro) {
  var encabezados = _h(CFG.HOJA_DATOS).getRange(CFG.FILA_DATOS - 1, 1, 1, CFG.NCOL).getValues()[0].map(function (x) { return String(x || ""); });
  var tmp = SpreadsheetApp.create(nombre), id = tmp.getId();
  try {
    var h = tmp.getSheets()[0]; h.setName("Consolidado");
    var nc = CFG.NCOL, n = filas.length;
    h.getRange(1, 1, 1, nc).setValues([encabezados]).setFontWeight("bold").setBackground("#006081").setFontColor("#FFFFFF");
    for (var i = 0; i < n; i += 2000) {
      var bloque = filas.slice(i, i + 2000);
      h.getRange(2 + i, 1, bloque.length, nc).setValues(bloque);
    }
    h.setFrozenRows(1);
    if (n) {
      COLS_FECHA_XLSX.forEach(function (c) { h.getRange(2, c, n, 1).setNumberFormat("dd/mm/yyyy"); });
      h.getRange(2, C.MARCA, n, 1).setNumberFormat("dd/mm/yyyy hh:mm");
    }
    var r = tmp.insertSheet("Resumen"), rows = [["RESUMEN DE LA EXPORTACIÓN", ""], ["Generado", _fmtHora_(Date.now())],
      ["Filtro", descripcionFiltro || "Todo el consolidado"], ["Total de PQRS", n], ["", ""]];
    [["POR TIPO", C.TIPO_PQRS], ["POR SEDE", C.SEDE], ["POR ESTADO", C.ESTADO], ["POR SEMÁFORO", C.SEMAFORO],
     ["POR CANAL", C.CANAL], ["OPORTUNIDAD", C.OPORTUNIDAD]].forEach(function (b) {
      rows.push([b[0], "CANTIDAD"]);
      _conteo_(filas, b[1]).forEach(function (x) { rows.push([_limpiarSimbolo_(x[0]) || x[0], x[1]]); });
      rows.push(["", ""]);
    });
    r.getRange(1, 1, rows.length, 2).setValues(rows);
    r.getRange(1, 1).setFontWeight("bold");
    r.setColumnWidth(1, 320);
    SpreadsheetApp.flush();
    var resp = UrlFetchApp.fetch("https://docs.google.com/spreadsheets/d/" + id + "/export?format=xlsx",
      { headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
    if (resp.getResponseCode() !== 200) throw new Error("Google no pudo generar el Excel (código " + resp.getResponseCode() + ").");
    return resp.getBlob().setName(nombre + ".xlsx");
  } finally {
    try { DriveApp.getFileById(id).setTrashed(true); } catch (e) { Logger.log("Temporal: " + e); }
  }
}

function _descripcionFiltro_(f) {
  f = f || {};
  var meses = ["", "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  var p = [];
  if (f.anio) p.push((parseInt(f.mes, 10) ? meses[parseInt(f.mes, 10)] + " de " : "año ") + f.anio);
  else if (parseInt(f.mes, 10)) p.push(meses[parseInt(f.mes, 10)] + " (todos los años)");
  if (f.sede) p.push("sede " + f.sede);
  if (f.servicio) p.push("servicio " + f.servicio);
  return p.join(" · ") || "Todo el consolidado";
}

/** Botón «Exportar a Excel»: guarda el archivo en Drive y, si no es muy grande, lo entrega para descargarlo. */
function apiExportarExcel_(filtros) {
  filtros = filtros || {};
  var tz = _tz_(), filas = _filasExcel_(filtros);
  var etiqueta = (filtros.anio ? filtros.anio + (parseInt(filtros.mes, 10) ? "-" + ("0" + parseInt(filtros.mes, 10)).slice(-2) : "") : "historico");
  var nombre = "Consolidado_PQRS_" + etiqueta + (filtros.sede ? "_" + String(filtros.sede).replace(/[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ]+/g, "-") : "") +
    "_" + Utilities.formatDate(new Date(), tz, "yyyyMMdd_HHmm");
  var blob = _construirXlsx_(nombre, filas, _descripcionFiltro_(filtros));
  var carpeta = _carpetaRespaldos_(), archivo = carpeta.createFile(blob), bytes = blob.getBytes();
  _traza("—", "Exportación a Excel", filas.length + " PQRS · " + _descripcionFiltro_(filtros) + " · guardado en Drive");
  var out = { ok: true, nombre: nombre + ".xlsx", filas: filas.length, tam: bytes.length, url: archivo.getUrl(), carpeta: carpeta.getUrl() };
  if (bytes.length <= MAX_ENTREGA_XLSX) out.base64 = Utilities.base64Encode(bytes);
  else out.mensaje = "El archivo pesa " + Math.round(bytes.length / 1048576) + " MB: descárgalo desde Drive o exporta por año o por mes.";
  return out;
}

/** Un archivo por día en la carpeta de respaldos (reemplaza el del mismo día) y conserva los últimos 14. */
function _respaldoExcel_() {
  var tz = _tz_(), hoy = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd"), nombre = "Respaldo_diario_" + hoy;
  var filas = _filasExcel_({}), carpeta = _carpetaRespaldos_();
  var blob = _construirXlsx_(nombre, filas, "Respaldo diario · todo el consolidado");
  var previos = carpeta.getFilesByName(nombre + ".xlsx");
  while (previos.hasNext()) previos.next().setTrashed(true);
  var archivo = carpeta.createFile(blob);
  // retención
  var limite = Date.now() - DIAS_RESPALDOS * 86400000, it = carpeta.getFiles();
  while (it.hasNext()) {
    var f = it.next();
    if (/^Respaldo_diario_/.test(f.getName()) && f.getDateCreated().getTime() < limite) f.setTrashed(true);
  }
  // copia a otra cuenta (p. ej. el Drive personal del administrador): se comparte la carpeta en solo lectura
  var aj = _ajustes_(), props = PropertiesService.getScriptProperties(), compartido = "";
  if (aj.respaldoCorreo && _correoOk(aj.respaldoCorreo)) {
    if (String(props.getProperty("RESPALDO_COMPARTIDO") || "").toLowerCase() !== aj.respaldoCorreo.toLowerCase()) {
      try { carpeta.addViewer(aj.respaldoCorreo); props.setProperty("RESPALDO_COMPARTIDO", aj.respaldoCorreo.toLowerCase()); } catch (e) { Logger.log("Compartir respaldo: " + e); }
    }
    compartido = aj.respaldoCorreo;
  }
  _traza("—", "Respaldo en Drive", filas.length + " PQRS · " + nombre + ".xlsx" + (compartido ? " · carpeta compartida con " + compartido : ""));
  return { ok: true, nombre: nombre + ".xlsx", filas: filas.length, url: archivo.getUrl(), carpeta: carpeta.getUrl(), compartido: compartido,
           mensaje: "Respaldo guardado en Drive: " + nombre + ".xlsx (" + filas.length + " PQRS)." + (compartido ? " Carpeta compartida con " + compartido + "." : "") };
}
function apiRespaldarAhora_() { return _respaldoExcel_(); }

// ---------------------------------------------------------------------------
// API · GOOGLE FORM EXISTENTE
// ---------------------------------------------------------------------------
/** Lee las preguntas de un Form ya creado (por URL o ID) o de su hoja de respuestas. */
function apiLeerFormulario_(urlOId) {
  var preguntas = [], origen = "", idForm = "", hojaResp = "";
  var txt = (urlOId || "").toString().trim();

  if (txt && txt.indexOf("/forms/d/e/") !== -1) {
    return { ok: false, tipo: "url_publica", mensaje:
      "Esa es la URL pública del formulario (la que responde el usuario) y con ella Google no permite leer las preguntas. " +
      "Tienes dos caminos: abre el formulario en modo edición y pega la URL que aparece en la barra de direcciones " +
      "(termina en /edit), o —más simple— vincula el formulario a este libro desde el propio Form: " +
      "Respuestas ▸ Vincular a Hojas de cálculo ▸ elegir esta hoja. Hecho eso, vuelve a pulsar «Leer preguntas» dejando el campo vacío." };
  }

  if (txt) {
    try {
      var form = (txt.indexOf("http") === 0) ? FormApp.openByUrl(txt) : FormApp.openById(txt);
      preguntas = form.getItems().map(function (it) { return it.getTitle(); }).filter(String);
      idForm = form.getId();
      origen = "formulario";
    } catch (err) {
      return { ok: false, mensaje: "No pude abrir ese formulario: " + (err.message || err) +
        ". Verifica que la URL sea la de edición y que tu cuenta tenga acceso." };
    }
  }

  // Hoja de respuestas vinculada a este libro
  var ss = _ss_();
  var urlFormVinculado = "";
  ss.getSheets().forEach(function (s) {
    try {
      if (s.getFormUrl && s.getFormUrl() && s.getName() !== CFG.HOJA_DATOS) {
        hojaResp = s.getName();
        urlFormVinculado = s.getFormUrl();
      }
    } catch (e) {}
  });

  // Si el formulario está vinculado, se abre por su URL de edición real: así se leen
  // TODAS sus preguntas, incluso las que todavía no tienen respuestas.
  if (!preguntas.length && urlFormVinculado) {
    try {
      var formV = FormApp.openByUrl(urlFormVinculado);
      preguntas = formV.getItems().map(function (it) { return it.getTitle(); }).filter(String);
      idForm = formV.getId();
      origen = "formulario vinculado";
    } catch (e) {}
  }

  if (!preguntas.length && hojaResp) {
    var hr = ss.getSheetByName(hojaResp);
    preguntas = hr.getRange(1, 1, 1, hr.getLastColumn()).getValues()[0]
      .map(function (x) { return (x || "").toString().trim(); }).filter(String);
    origen = "hoja de respuestas";
  }
  if (!preguntas.length) {
    return { ok: false, mensaje: "No encontré preguntas. Pega la URL de edición del formulario, o vincúlalo a este libro desde el Form (Respuestas ▸ Vincular a Hojas de cálculo)." };
  }

  return { ok: true, origen: origen, preguntas: preguntas, idForm: idForm, hojaRespuestas: hojaResp,
           campos: Object.keys(CAMPOS), mapeo: _leerMapeo(), sugerido: _sugerirMapeo(preguntas) };
}

function _sugerirMapeo(preguntas) {
  // El ORDEN importa: lo más específico primero, para que "Tipo de documento" no
  // caiga en "número de documento" ni "Tipo de solicitud" en "descripción".
  var pistas = [
    ["tipoPqrs", ["tipo de solicitud","tipo de pqrs","tipo de opinion","su opinion corresponde",
                  "clase de solicitud","tipo de manifestacion"]],
    ["tipoSolicitante", ["usted es","tipo de solicitante","quien presenta","calidad en que actua"]],
    ["tipoDocSolicitante", ["tipo de documento","tipo de identificacion"]],
    ["numDocSolicitante", ["numero de identificacion","numero de documento","no. de documento",
                           "n° de documento","cedula","identificacion."]],
    ["nombreSolicitante", ["nombre completo","nombre y apellidos","nombre del paciente","nombre"]],
    ["telefono", ["telefono","celular","numero de contacto","whatsapp"]],
    ["correo", ["correo","email","e-mail"]],
    ["direccion", ["direccion","domicilio"]],
    ["edad", ["edad"]],
    ["sexo", ["sexo","genero"]],
    ["poblacion", ["poblacion diferencial","poblacion"]],
    ["eps", ["eps","asegurador","entidad promotora"]],
    ["regimen", ["regimen"]],
    ["sede", ["sede","punto de atencion","centro de atencion","camino o paso"]],
    ["servicio", ["servicio","area a la que","especialidad"]],
    ["modalidad", ["modalidad"]],
    ["entidad", ["entidad presentada","ante quien"]],
    ["autorizacionDatos", ["autorizacion de tratamiento","tratamiento de datos","autorizo"]],
    ["fechaPqrs", ["fecha de la pqrs","fecha del hecho","fecha de ocurrencia","fecha de los hechos"]],
    ["descripcion", ["describa","descripcion","relate","narre","cuentenos","detalle su",
                     "opinion","manifestacion","comentario","mensaje","observacion"]],
  ];
  var out = {}, usados = {};
  preguntas.forEach(function (p) {
    var np = _norm(p);
    for (var i = 0; i < pistas.length; i++) {
      var campo = pistas[i][0], claves = pistas[i][1];
      if (usados[campo]) continue;               // un campo no se asigna dos veces
      for (var j = 0; j < claves.length; j++) {
        if (np.indexOf(claves[j]) !== -1) { out[p] = campo; usados[campo] = true; break; }
      }
      if (out[p]) break;
    }
  });
  return out;
}

function _leerMapeo() {
  var h = _h(CFG.HOJA_MAPEO);
  var ultima = h.getLastRow();
  if (ultima < CFG.MAPEO_FILA) return {};
  var datos = h.getRange(CFG.MAPEO_FILA, 1, ultima - CFG.MAPEO_FILA + 1, 2).getValues();
  var m = {};
  datos.forEach(function (r) { if (r[0] && r[1]) m[r[0].toString().trim()] = r[1].toString().trim(); });
  return m;
}

function apiGuardarMapeo_(mapa, idForm, hojaRespuestas) {
  var h = _h(CFG.HOJA_MAPEO);
  var ultima = h.getLastRow();
  if (ultima >= CFG.MAPEO_FILA) h.getRange(CFG.MAPEO_FILA, 1, ultima - CFG.MAPEO_FILA + 1, 2).clearContent();
  var filas = [];
  Object.keys(mapa).forEach(function (p) {
    if (mapa[p] && mapa[p] !== "(no importar)") filas.push([p, mapa[p]]);
  });
  if (filas.length) h.getRange(CFG.MAPEO_FILA, 1, filas.length, 2).setValues(filas);
  if (idForm !== undefined) _setParam(6, idForm || "");
  if (hojaRespuestas !== undefined) _setParam(7, hojaRespuestas || "");
  _traza("—", "Mapeo del formulario guardado", filas.length + " preguntas vinculadas");
  return { ok: true, mapeo: _leerMapeo() };
}

/** Importa del formulario lo que aún no esté radicado (sin duplicar). */
function apiImportarRespuestasForm_(opciones) {
  opciones = opciones || {};
  var notificar = (opciones.notificar === false) ? false : true;
  var ss = _ss_();
  var mapeo = _leerMapeo();
  var mapeoAuto = false;
  var nombreHoja = _param(7);
  var hr = nombreHoja ? ss.getSheetByName(nombreHoja) : null;
  if (!hr) {
    ss.getSheets().forEach(function (s) {
      try { if (!hr && s.getFormUrl && s.getFormUrl() && s.getName() !== CFG.HOJA_DATOS) hr = s; } catch (e) {}
    });
  }
  if (!hr) return { ok: false, mensaje: "No encontré la hoja de respuestas del formulario." };

  var filas = hr.getDataRange().getValues();
  if (filas.length < 2) return { ok: true, importadas: 0, mensaje: "El formulario no tiene respuestas nuevas." };
  var enc = filas[0].map(function (x) { return (x || "").toString().trim(); });

  // Si nunca se guardaron las equivalencias, se deducen solas de los títulos y se guardan.
  if (!Object.keys(mapeo).length) {
    mapeo = _sugerirMapeo(enc);
    if (!Object.keys(mapeo).length) {
      return { ok: false, mensaje: "No pude deducir a qué campo corresponde cada pregunta. Usa «Leer preguntas» y revísalas a mano." };
    }
    apiGuardarMapeo_(mapeo, _param(6) || "", nombreHoja || hr.getName());
    mapeoAuto = true;
  }
  if (!mapeo["__descripcion_ok__"]) {
    var tieneDesc = false;
    Object.keys(mapeo).forEach(function (k) { if (mapeo[k] === "descripcion") tieneDesc = true; });
    if (!tieneDesc) {
      return { ok: false, mensaje: "Ninguna pregunta quedó asociada al campo «descripcion»; sin ese dato no se puede radicar. Revisa las equivalencias." };
    }
  }

  var hd = _h(CFG.HOJA_DATOS);
  var n = CFG.FILA_FIN - CFG.FILA_DATOS + 1;
  var existentes = _datos_();
  var vistos = {};
  existentes.forEach(function (f) {
    if (f[C.CODIGO - 1]) vistos[_clave(f[C.MARCA - 1], f[C.DESCRIPCION - 1])] = true;
  });

  var importadas = 0, acusados = 0, sinCorreo = 0, anteriores = 0;
  var noReconocidos = [];
  var limite = new Date(); limite.setDate(limite.getDate() - CFG.DIAS_ACUSE);
  var desde = _importarDesde_();
  var t0 = Date.now();
  for (var i = 1; i < filas.length; i++) {
    var fr = filas[i];
    if (!fr[0]) continue;
    var marca0 = fr[0] instanceof Date ? fr[0] : new Date(fr[0]);
    if (desde && !isNaN(marca0.getTime()) && marca0.getTime() <= desde) { anteriores++; continue; }   // v8: histórico ya migrado
    if (Date.now() - t0 > 240000) break;   // margen ante el límite de 6 minutos de Apps Script
    var d = {};
    enc.forEach(function (titulo, j) {
      var campo = mapeo[titulo];
      if (!campo || fr[j] === "" || fr[j] === null) return;
      if (CAMPO_LISTA[campo]) {
        var norm = _normalizarValorLista_(fr[j], CAMPO_LISTA[campo]);
        d[campo] = norm.valor;
        if (!norm.reconocido) {
          var clave = CAMPO_LISTA[campo] + ": " + norm.valor;
          if (noReconocidos.indexOf(clave) === -1) noReconocidos.push(clave);
        }
      } else {
        d[campo] = fr[j];
      }
    });
    if (!d.descripcion) continue;
    var marca = fr[0] instanceof Date ? fr[0] : new Date(fr[0]);
    if (vistos[_clave(marca, d.descripcion)]) continue;

    if (isNaN(marca.getTime())) continue;
    var soloFecha = _soloFecha_(marca);
    var vals = {};
    vals[C.CANAL] = "QR - Formulario";
    vals[C.MARCA] = marca;
    vals[C.FECHA_PQRS] = _soloFecha_(d.fechaPqrs) || soloFecha;
    vals[C.FECHA_RECEPCION] = soloFecha;
    vals[C.FECHA_RADICACION] = soloFecha;
    vals[C.ESTADO] = "Recibida";
    vals[C.REDIRECCIONES] = 0;
    vals[C.DEPARTAMENTO] = "ATLÁNTICO";
    vals[C.REGISTRADO_POR] = "Formulario QR";
    if (!d.entidad && !_esFeli(d.tipoPqrs)) vals[C.ENTIDAD] = "SEDE";
    Object.keys(d).forEach(function (k) {
      if (CAMPOS[k] && ["fechaPqrs","fechaRecepcion","fechaRadicacion"].indexOf(k) === -1) vals[CAMPOS[k]] = d[k];
    });
    var resF = _reservarRadicado_(soloFecha, vals), fila = resF.fila, codigo = resF.codigo;
    vistos[_clave(marca, d.descripcion)] = true;
    importadas++;
    _traza(codigo, "Radicación", "Importada del formulario QR (" + _fmt(marca) + ")");
    SpreadsheetApp.flush();
    try { var clF = _postRadicacion_(fila, "auto"); if (clF.codigo) codigo = clF.codigo; } catch (e) { Logger.log(e); }
    if (marca >= limite) { try { SpreadsheetApp.flush(); _avisoNuevoCaso_(fila, {}); } catch (e) { Logger.log(e); } }

    // Acuse automático al usuario. Solo para respuestas recientes, para no
    // escribirle a quien respondió hace meses cuando se importa el histórico.
    if (notificar && marca >= limite) {
      SpreadsheetApp.flush();
      var res = _acuseRecepcion_(fila);
      if (res.indexOf("enviado") === 0) acusados++;
      else if (res.indexOf("no dejó correo") !== -1) sinCorreo++;
    }
  }
  SpreadsheetApp.flush();
  _cacheListas = null;
  var msg = "Respuestas importadas: " + importadas;
  if (anteriores) msg += " · " + anteriores + " anteriores a la fecha de corte (" + _fmtHora_(desde) + ") no se tocaron";
  if (importadas) {
    msg += " · acuses enviados: " + acusados;
    if (sinCorreo) msg += " · sin correo: " + sinCorreo;
  }
  if (mapeoAuto) msg += " · las equivalencias se dedujeron y quedaron guardadas";
  return { ok: true, importadas: importadas, acusados: acusados, sinCorreo: sinCorreo,
           mapeoAuto: mapeoAuto, noReconocidos: noReconocidos, mensaje: msg };
}

// ---------------------------------------------------------------------------
// NORMALIZACIÓN DE LO QUE LLEGA DEL FORMULARIO
// ---------------------------------------------------------------------------
var _cacheListas = null;

function _listasConfig_() {
  if (_cacheListas) return _cacheListas;
  var cfg = _h(CFG.HOJA_CONFIG);
  var L = _filaEncabezadoListas_(cfg);
  var ncol = Math.max(14, Math.min(26, cfg.getLastColumn ? cfg.getLastColumn() : 14));
  var cab = cfg.getRange(L, 1, 1, ncol).getValues()[0];
  var cuerpo = cfg.getRange(L + 1, 1, 150, ncol).getValues();
  _cacheListas = {};
  cab.forEach(function (n, i) {
    if (!n) return;
    _cacheListas[String(n).trim()] = cuerpo.map(function (r) { return r[i]; }).filter(String);
  });
  return _cacheListas;
}

/**
 * Convierte lo que responde el usuario en el formulario al valor exacto de la lista:
 * "QUEJA" -> "Queja"; "C. BOSQUE DE MARIA" -> "Camino Bosque de María".
 * Si no reconoce el valor lo devuelve tal cual, para no perder el dato.
 */
function _normalizarValorLista_(valor, nombreLista) {
  if (!valor) return { valor: "", reconocido: true };
  var bruto = valor.toString().trim();
  if (nombreLista === "TIPO SOLICITANTE" && bruto.indexOf(",") !== -1) bruto = bruto.split(",")[0].trim();

  var lista = _listasConfig_()[nombreLista] || [];
  var n = _norm(bruto);
  var i, ln;

  for (i = 0; i < lista.length; i++) if (_norm(lista[i]) === n) return { valor: lista[i], reconocido: true };
  var compacto = n.replace(/[^a-z0-9ñ]/g, "");   // v7: «SUPERSALUD» = «SUPER SALUD»
  for (i = 0; i < lista.length; i++) if (compacto && _norm(lista[i]).replace(/[^a-z0-9ñ]/g, "") === compacto) return { valor: lista[i], reconocido: true };

  if (nombreLista === "SEDE") {   // v8: «Camino La Playa» = «C. LA PLAYA», «Camino Sur Occidente» = «C. SUROCCIDENTE»…
    var ns = _nucleoSede_(bruto);
    for (i = 0; i < lista.length; i++) if (ns && _nucleoSede_(lista[i]) === ns) return { valor: lista[i], reconocido: true };
  }
  var expandido = n.replace(/^c\.\s*/, "camino ").replace(/^p\.\s*/, "paso ");
  for (i = 0; i < lista.length; i++) if (_norm(lista[i]) === expandido) return { valor: lista[i], reconocido: true };

  var nucleo = expandido.replace(/^(camino|paso)\s+/, "");
  if (nucleo.length >= 5) {
    for (i = 0; i < lista.length; i++) {
      ln = _norm(lista[i]).replace(/^(camino|paso)\s+/, "");
      if (ln === nucleo || ln.indexOf(nucleo) === 0 || nucleo.indexOf(ln) === 0) {
        return { valor: lista[i], reconocido: true };
      }
    }
  }

  for (i = 0; i < lista.length; i++) {
    ln = _norm(lista[i]);
    if (n.length >= 5 && (ln.indexOf(n) !== -1 || n.indexOf(ln) !== -1)) {
      return { valor: lista[i], reconocido: true };
    }
  }
  return { valor: bruto, reconocido: false };
}

/** Núcleo comparable del nombre de una sede (sin «Camino/Paso», artículos, tildes ni espacios) + alias conocidos. */
var ALIAS_SEDES = { "metropolitano": "saludmetropolitano", "saludmetropolitana": "saludmetropolitano", "universitariodistritaladelitadechar": "adelitadechar",
  "manga": "lamanga", "bosquesdemaria": "bosquedemaria", "ciudadela": "ciudadela20dejulio", "elferry1demayo": "elferry", "ferry": "elferry",
  "carlosmeiselii": "carlosmeissel", "carlosmeisel": "carlosmeissel", "villasdesanpablo": "villasanpablo", "villasanpablo": "villasanpablo",
  "centroderecuperacionnutricionalrosour": "rosour", "sierrita": "lasierrita", "esmeraldalipaya": "esmeraldalipaya", "hospitalgeneraldebarranquilla": "hospitalgeneral",
  "hospitalbq": "hospitalgeneral", "hospitalgeneral": "hospitalgeneral" };
function _nucleoSede_(v) {
  var n = _norm(v).replace(/^(c|p)\.\s*/, "").replace(/^(camino|paso)\s+/, "").replace(/1º|1°/g, "1").replace(/[^a-z0-9ñ]/g, "");
  return ALIAS_SEDES[n] || n;
}

var CAMPO_LISTA = {
  tipoPqrs: "TIPO DE PQRS", tipoSolicitante: "TIPO SOLICITANTE",
  tipoDocSolicitante: "TIPO DOCUMENTO", tipoDocAfiliado: "TIPO DOCUMENTO",
  sede: "SEDE", servicio: "SERVICIO", eps: "EPS / PRESTADOR",
  regimen: "RÉGIMEN", sexo: "SEXO", poblacion: "POBLACIÓN DIFERENCIAL",
  entidad: "ENTIDAD PRESENTADA", canal: "CANAL",
};

/**
 * Verifica el canal del formulario: si está vinculado, cuántas respuestas hay,
 * si el mapeo está guardado, cuántas faltan por importar y si el disparador existe.
 */
function apiEstadoFormulario_() { return _estadoFormulario_(null); }
function _estadoFormulario_(datosPrevios) {
  var ss = _ss_();
  var est = { vinculado: false, hoja: "", urlForm: "", respuestas: 0, mapeadas: 0,
              importadas: 0, pendientes: 0, disparador: false, problemas: [] };

  ss.getSheets().forEach(function (sh) {
    try {
      if (!est.hoja && sh.getFormUrl && sh.getFormUrl() && sh.getName() !== CFG.HOJA_DATOS) {
        est.hoja = sh.getName(); est.urlForm = sh.getFormUrl(); est.vinculado = true;
      }
    } catch (e) {}
  });
  if (!est.vinculado) {
    est.problemas.push("El formulario todavía no está vinculado a este libro. En el Google Form: Respuestas ▸ Vincular a Hojas de cálculo ▸ elegir esta hoja.");
    return est;
  }

  var hr = ss.getSheetByName(est.hoja);
  var filas = hr.getDataRange().getValues();
  est.respuestas = Math.max(0, filas.length - 1);

  var mapeo = _leerMapeo();
  est.mapeoAutomatico = false;
  if (!Object.keys(mapeo).length) {
    var encTmp = ss.getSheetByName(est.hoja).getDataRange().getValues()[0]
      .map(function (x) { return (x || "").toString().trim(); });
    mapeo = _sugerirMapeo(encTmp);
    est.mapeoAutomatico = true;
  }
  est.mapeadas = Object.keys(mapeo).length;
  if (!est.mapeadas) est.problemas.push("No se pudo asociar ninguna pregunta del formulario con los campos del sistema. Usa «Leer preguntas» y hazlo a mano.");

  if (est.respuestas && est.mapeadas) {
    var enc = filas[0].map(function (x) { return (x || "").toString().trim(); });
    var colDesc = -1;
    enc.forEach(function (t, j) { if (mapeo[t] === "descripcion") colDesc = j; });
    if (colDesc < 0) {
      est.problemas.push("Ninguna pregunta está mapeada como «descripcion»; sin ese campo no se puede radicar.");
    } else {
      var existentes = datosPrevios || _datos_();
      var vistos = {};
      existentes.forEach(function (f) {
        if (f[C.CODIGO - 1]) vistos[_clave(f[C.MARCA - 1], f[C.DESCRIPCION - 1])] = true;
      });
      var desdeE = _importarDesde_();
      est.desde = desdeE ? _fmtHora_(desdeE) : "";
      for (var i = 1; i < filas.length; i++) {
        if (!filas[i][0]) continue;
        var m = filas[i][0] instanceof Date ? filas[i][0] : new Date(filas[i][0]);
        if (desdeE && m.getTime() <= desdeE) { est.anteriores = (est.anteriores || 0) + 1; continue; }
        if (vistos[_clave(m, filas[i][colDesc])]) est.importadas++; else est.pendientes++;
      }
    }
  }

  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "onFormSubmit_") est.disparador = true;
  });
  if (!est.disparador) est.problemas.push("Falta el disparador automático: en la hoja, menú PQRS ▸ ⚙ Instalar disparadores.");

  return est;
}

/**
 * v8 · Fecha de corte de la importación del formulario (Config B20). Todo lo respondido hasta esa
 * marca temporal ya está en el consolidado (histórico migrado). Si está vacía, la primera
 * importación la fija en «ahora» para no radicar de golpe años de respuestas antiguas.
 */
function _importarDesde_() {
  var v = _param(9);
  if (v instanceof Date && !isNaN(v.getTime())) return v.getTime();
  if (v && !isNaN(new Date(v).getTime())) return new Date(v).getTime();
  var ahora = new Date();
  try { _setParam(9, ahora); _traza("—", "Importación del formulario activada", "Se importan las respuestas posteriores a " + _fmtHora_(ahora.getTime()) +
    ". Para traer respuestas anteriores cambia la fecha en Config (celda B20)."); } catch (e) {}
  return ahora.getTime();
}
function _fmtHora_(ms) { return ms ? Utilities.formatDate(new Date(ms), _tz_(), "dd/MM/yyyy HH:mm") : ""; }

function _clave(marca, desc) {
  var m = (marca instanceof Date) ? marca.getTime() : String(marca);
  return m + "|" + (desc || "").toString().substring(0, 60);
}

function onFormSubmit_(e) { alEnviarFormulario(e); }
function alEnviarFormulario(e) {
  try { apiImportarRespuestasForm_(); } catch (err) { Logger.log(err); }
}
function importarFormulario() {
  SpreadsheetApp.getUi();   // solo desde el menú de la hoja
  var r = apiImportarRespuestasForm_();
  SpreadsheetApp.getUi().alert(r.mensaje || "Listo");
}

// ---------------------------------------------------------------------------
// ALERTA DIARIA
// ---------------------------------------------------------------------------
function rutinaDiaria() {
  try { if (_ajustes_().respaldoDiario) _respaldoExcel_(); } catch (e) { Logger.log("Respaldo: " + e); try { _traza("—", "Respaldo en Drive falló", String(e.message || e)); } catch (x) {} }
  try { if (_ajustes_().direccionFelicitaciones === "resumen") apiDireccionarFelicitaciones_(); } catch (e) { Logger.log("Felicitaciones: " + e); }
  try { _hojaFestivos_(); } catch (e) {}
  var d = apiDashboard_();
  if (!d.vencidas && !d.porVencer && !d.porRevisar) return;
  var resp = apiResponsables_();
  var destino = "";
  resp.forEach(function (r) {
    if (!destino && _norm(r.area).indexOf("calidad") !== -1 && _correoOk(r.correo)) destino = r.correo;
  });
  if (!destino) resp.forEach(function (r) { if (!destino && _correoOk(r.correo)) destino = r.correo; });
  if (!destino) { Logger.log("Sin correo de escalamiento en Responsables."); return; }

  var td = 'style="padding:8px 10px;border-bottom:1px solid #EEF2F4;font-family:' + FF + ';font-size:12px;color:#2B3A42;"';
  var filas = d.criticas.map(function (v) {
    var col = v.nivel === "alto" ? "#AB1130" : (v.nivel === "medio" ? "#8E5B00" : "#6B7F89");
    return '<tr><td style="padding:8px 10px;border-bottom:1px solid #EEF2F4;font-family:Consolas,monospace;font-weight:700;font-size:12px;color:#00475F;">' + v.codigo +
      '</td><td ' + td + '>' + (v.sede || "") + " / " + (v.servicio || "") +
      '</td><td ' + td + '>' + v.responsable +
      '</td><td ' + td + '><span style="color:' + col + ';">&#9679;</span> ' + v.semaforo +
      '</td><td ' + td + '>' + (v.fechaMax || "") + '</td><td ' + td + '>' + v.dias + '</td></tr>';
  }).join("");
  var th = 'align="left" style="padding:8px 10px;font-family:' + FF + ';font-weight:700;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:#6B7F89;"';
  var kpi = function (n, t, c) {
    return '<td style="padding:12px 14px;background:#F6F9FA;border-radius:10px;"><div style="font-family:' + FT + ';font-weight:900;font-size:24px;color:' + c + ';">' + n +
      '</div><div style="font-family:' + FF + ';font-size:11px;color:#6B7F89;">' + t + '</div></td><td style="width:8px;"></td>';
  };

  var html = '<div style="background:#EDF2F4;padding:28px 12px;font-family:' + FF + ';">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">' +
    '<table role="presentation" width="680" cellpadding="0" cellspacing="0" style="max-width:680px;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #DDE6EA;">' +
    '<tr><td style="padding:22px 28px 16px;"><img src="cid:logoNiRed" width="124" alt="MiRed IPS" style="display:block;border:0;"/></td></tr>' +
    '<tr><td style="height:4px;background:#006081;font-size:0;line-height:0;">&nbsp;</td></tr>' +
    '<tr><td style="padding:24px 28px;">' +
    '<div style="font-family:' + FT + ';font-weight:900;font-size:20px;color:#00475F;">Control diario de PQRS</div>' +
    '<div style="font-family:' + FF + ';font-size:12px;color:#6B7F89;margin:4px 0 18px;">Corte al ' + _fmt(new Date()) + '</div>' +
    '<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:18px;"><tr>' +
      kpi(d.vencidas, "Vencidas", "#AB1130") + kpi(d.porVencer, "Por vencer", "#8E5B00") +
      kpi(d.porRevisar, "Datos por corregir", "#4C626D") + kpi(d.sinArea, "Sin área asignada", "#006081") +
    '</tr></table>' +
    '<table width="100%" style="border-collapse:collapse;"><tr style="background:#F6F9FA;">' +
    '<th ' + th + '>Radicado</th><th ' + th + '>Sede / Servicio</th><th ' + th + '>Responsable</th>' +
    '<th ' + th + '>Estado</th><th ' + th + '>Vence</th><th ' + th + '>Días</th></tr>' +
    filas + '</table>' +
    (_urlPlataforma_("") ? '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 4px;"><tr><td style="background:#006081;border-radius:10px;">' +
      '<a href="' + _urlPlataforma_("") + '" style="display:inline-block;padding:11px 20px;font-family:' + FF + ';font-size:13px;font-weight:700;color:#fff;text-decoration:none;">Abrir la plataforma &rarr;</a></td></tr></table>' : '') +
    '<div style="margin-top:18px;background:#FFF8E6;border:1px solid #F1DFA8;border-radius:10px;padding:11px 14px;font-family:' + FF + ';font-size:11px;line-height:1.6;color:#6B5415;">&#128274; ' + _textoConfidencial_(true) + '</div>' +
    '<div style="margin-top:14px;font-family:' + FF + ';font-size:11px;color:#8398A3;">' + MARCA_SISTEMA + '.</div>' +
    '</td></tr></table></td></tr></table></div>';

  _enviar(destino, "Control PQRS – " + d.vencidas + " vencidas, " + d.porVencer + " por vencer (" + _fmt(new Date()) + ")",
    "Vencidas: " + d.vencidas + " · Por vencer: " + d.porVencer, html);
}

// =====================================================================================
// INICIO · QUÉ HAY QUE HACER HOY
// =====================================================================================
function apiResumenHoy_() {
  var h = _h(CFG.HOJA_DATOS);
  var n = CFG.FILA_FIN - CFG.FILA_DATOS + 1;
  var datos = _datos_();
  var tz = _tz_();
  var hoy = _soloFecha_(new Date());
  var enOchoDias = new Date(hoy.getTime() + 8 * 86400000);
  var mesHoy = Utilities.formatDate(hoy, tz, "yyyy-MM");
  var mesAnt = Utilities.formatDate(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 15), tz, "yyyy-MM");

  var r = { sinDireccionar: 0, enGestion: 0, porResponder: 0, vencidas: 0, porVencer: 0, porCorregir: 0,
            cerradasMes: 0, radicadasMes: 0, radicadasMesAnterior: 0, radicadasHoy: 0, abiertas: 0,
            aTiempoMes: 0, cerradasConTerminoMes: 0,
            total: 0, correosPendientes: 0, correo: null, formPendientes: 0, urgentes: [], recientes: [] };

  datos.forEach(function (f) {
    if (!f[C.CODIGO - 1] || !_filaVisible_(f)) return;
    r.total++;
    var fr = f[C.FECHA_RADICACION - 1];
    if (fr instanceof Date && !isNaN(fr.getTime())) {
      var mk = Utilities.formatDate(fr, tz, "yyyy-MM");
      if (mk === mesHoy) r.radicadasMes++;
      else if (mk === mesAnt) r.radicadasMesAnterior++;
      if (Utilities.formatDate(fr, tz, "yyyy-MM-dd") === Utilities.formatDate(hoy, tz, "yyyy-MM-dd")) r.radicadasHoy++;
    }
    var est = _norm(f[C.ESTADO - 1]);
    var cerrada = est.indexOf("cerrada") !== -1;
    var conArea = !!f[C.CORREO_RESP - 1];
    var conRta = !!(f[C.RTA_AREA - 1] || "").toString().trim();
    var sem = (f[C.SEMAFORO - 1] || "").toString();
    var fMax = f[C.FECHA_MAX - 1];

    if (cerrada) {
      var fc = f[C.FECHA_RTA_USUARIO - 1];
      if (fc instanceof Date && Utilities.formatDate(fc, tz, "yyyy-MM") === mesHoy) {
        r.cerradasMes++;
        var op = (f[C.OPORTUNIDAD - 1] || "").toString();
        if (op) { r.cerradasConTerminoMes++; if (op === "A tiempo") r.aTiempoMes++; }
      }
      return;
    }
    r.abiertas++;
    if (!conArea && !_esFeli(f[C.TIPO_PQRS - 1])) r.sinDireccionar++;
    else if (conArea && !conRta) r.enGestion++;
    if (conRta) r.porResponder++;
    if (sem.indexOf("🔴") === 0) r.vencidas++;
    else if (sem.indexOf("🟡") === 0 || (fMax instanceof Date && fMax <= enOchoDias)) r.porVencer++;
    if (sem.indexOf("⚠") === 0) r.porCorregir++;

    if (sem.indexOf("🔴") === 0 || sem.indexOf("🟡") === 0) {
      r.urgentes.push({
        codigo: f[C.CODIGO - 1], semaforo: sem, tipo: f[C.TIPO_PQRS - 1],
        sede: f[C.SEDE - 1], servicio: f[C.SERVICIO - 1],
        responsable: f[C.RESPONSABLE - 1] || "Sin asignar",
        fechaMax: _fmt(fMax), orden: fMax instanceof Date ? fMax.getTime() : 9e15, dias: _dias_(f[C.DIAS - 1]),
      });
    }
  });

  r.urgentes.sort(function (a, b) { return a.orden - b.orden; });
  r.urgentes = r.urgentes.slice(0, 8);
  r.cumplimientoMes = r.cerradasConTerminoMes ? Math.round(r.aTiempoMes / r.cerradasConTerminoMes * 100) : null;

  // Últimas radicadas (cualquier canal), para la columna de actividad reciente.
  for (var i = datos.length - 1; i >= 0 && r.recientes.length < 6; i--) {
    var f = datos[i];
    if (!f[C.CODIGO - 1] || !_filaVisible_(f)) continue;
    r.recientes.push({ codigo: f[C.CODIGO - 1], tipo: f[C.TIPO_PQRS - 1], canal: f[C.CANAL - 1],
                       sede: f[C.SEDE - 1], fecha: _fmt(f[C.FECHA_RADICACION - 1]), semaforo: f[C.SEMAFORO - 1] });
  }

  if (!SESION || _permitido_(SESION, P_CORREO)) {
    try { var c = apiCorreos_(true); r.correo = c.resumen; r.correosPendientes = c.resumen.relevantes; }
    catch (e) { r.correosPendientes = -1; }
  } else { r.correosPendientes = -1; r.sinCorreo = true; }
  r.porSede = {}; r.prioritarias = []; r.prioritariasAbiertas = 0; r.prioritariasVitales = 0; r.felicitacionesPendientes = 0;
  var cats = _categorias_();
  datos.forEach(function (f) {
    if (!f[C.CODIGO - 1] || !_filaVisible_(f)) return;
    var sede = (f[C.SEDE - 1] || "Sin sede").toString().trim() || "Sin sede";
    var cerrada = _norm(f[C.ESTADO - 1]).indexOf("cerrada") !== -1, sem = String(f[C.SEMAFORO - 1] || "");
    var ps = r.porSede[sede] || (r.porSede[sede] = { total: 0, abiertas: 0, vencidas: 0, porVencer: 0, mes: 0 });
    ps.total++;
    if (!cerrada) ps.abiertas++;
    if (sem.indexOf("🔴") === 0) ps.vencidas++;
    if (sem.indexOf("🟡") === 0) ps.porVencer++;
    var fr = f[C.FECHA_RADICACION - 1];
    if (fr instanceof Date && Utilities.formatDate(fr, tz, "yyyy-MM") === mesHoy) ps.mes++;
    var pr = _prioridadDe_(f[C.CLASIF_INTERNA - 1], f[C.ENTIDAD - 1], cats);
    var nv = _nivelDeCategoria_(f[C.CLASIF_INTERNA - 1], cats);
    if (!cerrada && _esFeli(f[C.TIPO_PQRS - 1]) && !f[C.CORREO_RESP - 1]) r.felicitacionesPendientes++;
    if (!cerrada && !_esFeli(f[C.TIPO_PQRS - 1]) && (pr === "Crítica" || pr === "Alta" || _rango_(nv) >= 2)) r.prioritariasAbiertas++;
    if (!cerrada && _rango_(nv) >= 3) r.prioritariasVitales++;
    if (!cerrada && (pr === "Crítica" || pr === "Alta")) r.prioritarias.push({ codigo: f[C.CODIGO - 1], prioridad: pr,
      limite: HORAS_NIVEL[nv] && _rango_(nv) >= 2 ? "antes de " + _fmtHora_(_limiteHoras_(f, nv)) : "",
      clasificacion: f[C.CLASIF_INTERNA - 1], tipo: f[C.TIPO_PQRS - 1], remitente: (/Remitente institucional: ([^(·]+)/.exec(String(f[C.OBSERVACIONES - 1] || "")) || [])[1] || f[C.EPS - 1] || "",
      fechaMax: _fmt(f[C.FECHA_MAX - 1]), semaforo: sem, conArea: !!f[C.CORREO_RESP - 1], orden: pr === "Crítica" ? 0 : 1 });
  });
  r.prioritarias.sort(function (a, b) { return a.orden - b.orden; });
  r.prioritarias = r.prioritarias.slice(0, 8);
  try { r.formPendientes = _estadoFormulario_(datos).pendientes || 0; } catch (e) { r.formPendientes = 0; }
  return r;
}

// =====================================================================================
// CANAL CORREO CON VISTO BUENO
// =====================================================================================
var PALABRAS_PQRS = ["queja","reclamo","peticion","petición","sugerencia","felicitacion","felicitación",
  "pqrs","inconformidad","derecho de peticion","derecho de petición","tutela","mala atencion",
  "mala atención","no me atendieron","reclamacion","reclamación","inconforme","denuncia","solicitud"];

function _etiqueta_(nombre) {
  var l = GmailApp.getUserLabelByName(nombre);
  return l ? l : GmailApp.createLabel(nombre);
}

/**
 * Correos que parecen PQRS y todavía no se han radicado ni descartado.
 * No radica nada: solo los propone para que el SIAU dé el visto bueno.
 */
function apiCorreosPendientes_(soloContar) {   // compatibilidad: solo lo relevante
  var r = apiCorreos_(!!soloContar);
  if (soloContar) { var a = []; for (var i = 0; i < r.resumen.relevantes; i++) a.push(1); return a; }
  return r.items.filter(function (x) { return x.categoria !== "otro"; });
}

function _detectarTipo_(texto) {
  var t = _norm(texto);
  if (t.indexOf("felicita") !== -1 || t.indexOf("agradec") !== -1) return "Felicitación";
  if (t.indexOf("sugerencia") !== -1 || t.indexOf("sugiero") !== -1) return "Sugerencia";
  if (t.indexOf("tutela") !== -1) return "Tutela";
  if (t.indexOf("reclamo") !== -1 || t.indexOf("reclamacion") !== -1) return "Reclamo";
  if (t.indexOf("queja") !== -1 || t.indexOf("inconform") !== -1) return "Queja";
  return "Petición";
}

/** Radica un correo tras el visto bueno del SIAU, con los datos que este completó. */
function apiRadicarCorreo_(idMsg, d) {
  if (!idMsg) return { ok: false, mensaje: "Falta el identificador del correo." };
  var msg;
  try { msg = GmailApp.getMessageById(idMsg); } catch (e) { return { ok: false, mensaje: "No pude abrir ese correo." }; }
  if (!d.descripcion) return { ok: false, mensaje: "La descripción no puede quedar vacía." };
  if (!d.tipoPqrs) return { ok: false, mensaje: "Indica el tipo de PQRS." };

  var soloFecha = _soloFecha_(d.fechaRecepcion) || _soloFecha_(msg.getDate());
  var esFeli = _esFeli(d.tipoPqrs);

  var vals = {};
  vals[C.CANAL] = "Correo electrónico";
  vals[C.MARCA] = msg.getDate();
  vals[C.FECHA_PQRS] = _soloFecha_(d.fechaPqrs) || soloFecha;
  vals[C.FECHA_RECEPCION] = soloFecha;
  vals[C.FECHA_RADICACION] = soloFecha;
  vals[C.ESTADO] = "Recibida";
  vals[C.REDIRECCIONES] = 0;
  vals[C.DEPARTAMENTO] = "ATLÁNTICO";
  vals[C.REGISTRADO_POR] = d.automatico ? "Automático (correo)" : _usuario();
  vals[C.ID_CORREO] = idMsg;
  vals[C.ENTIDAD] = esFeli ? "" : (d.entidad || "SEDE");
  vals[C.OBSERVACIONES] = "Radicado desde correo: " + (msg.getSubject() || "");

  Object.keys(CAMPOS).forEach(function (k) {
    if (["canal","fechaPqrs","fechaRecepcion","fechaRadicacion","entidad"].indexOf(k) !== -1) return;
    if (d[k] !== undefined && d[k] !== null && d[k] !== "") vals[CAMPOS[k]] = d[k];
  });
  if (d.observaciones) vals[C.OBSERVACIONES] = d.observaciones + " · Radicado desde correo: " + (msg.getSubject() || "");

  var resC = _reservarRadicado_(soloFecha, vals), fila = resC.fila, codigo = resC.codigo;
  SpreadsheetApp.flush();
  _traza(codigo, "Radicación", "Correo de " + (d.correo || "") + " aprobado por " + _usuario() +
    " · asunto: " + (msg.getSubject() || ""));

  try { msg.getThread().addLabel(_etiqueta_(CFG.GMAIL_PROCESADO)); } catch (e) {}
  var hiloId = "";
  try { hiloId = msg.getThread().getId(); } catch (e) {}
  var adjuntos = "";
  if (d.guardarAdjuntos && hiloId) {
    try { adjuntos = _guardarAdjuntosHilo_(hiloId, codigo, fila); } catch (e) { adjuntos = "no se pudieron guardar: " + (e.message || e); }
  }
  if (hiloId) _guardarHilo_(hiloId, { categoria: d.clasificacion ? "institucional" : "pqrs", estado: "Radicado " + codigo, codigo: codigo,
    correoUsuario: d.correo || "", asunto: msg.getSubject() || "", accion: "Radicada como " + codigo + (d.automatico ? " (automático)" : "") });
  SpreadsheetApp.flush();
  try { var clC = _postRadicacion_(fila, d.clasificacion ? "sugerir" : "auto"); if (clC.codigo) codigo = clC.codigo; } catch (e) { Logger.log(e); }
  var acuse = d.sinAcuse ? "en el mismo hilo" : _acuseRecepcion_(fila);
  if (!d.automatico) { try { _avisoNuevoCaso_(fila, {}); } catch (e) { Logger.log(e); } }

  return { ok: true, codigo: codigo, acuse: acuse, adjuntos: adjuntos };
}

/** Marca un correo como «no es PQRS» para que no vuelva a aparecer. */
function apiDescartarCorreo_(idMsg, motivo) {
  try {
    var msg = GmailApp.getMessageById(idMsg);
    msg.getThread().addLabel(_etiqueta_(CFG.GMAIL_DESCARTADO));
    _traza("—", "Correo descartado", (msg.getSubject() || "") + (motivo ? " · " + motivo : "") + " · por " + _usuario());
    return { ok: true };
  } catch (e) {
    return { ok: false, mensaje: "No pude marcar ese correo: " + (e.message || e) };
  }
}

// =====================================================================================
// PLANTILLAS DE RESPUESTA
// =====================================================================================
var PLANTILLAS_BASE = [
  ["T1", "Oportunidad en citas de especialista",
   "Reciba un cordial saludo.\n\nAgradecemos que nos haya compartido su experiencia. Verificamos su caso con el área asistencial y se realizó la gestión ante el prestador para garantizar la asignación de su cita dentro del término establecido en la Resolución 1552 de 2013.\n\nQuedamos atentos a cualquier inquietud adicional."],
  ["T2", "Entrega de medicamentos",
   "Reciba un cordial saludo.\n\nRevisamos su solicitud con el servicio farmacéutico y se adelantó la gestión para garantizar el suministro de su medicamento. Su tratamiento continuará sin interrupciones según el plan de manejo médico.\n\nAgradecemos su comprensión."],
  ["T3", "Programación de cirugías",
   "Reciba un cordial saludo.\n\nSu caso fue revisado con el área quirúrgica, que adelantó la gestión para la programación de su procedimiento. La fecha definitiva será informada al contacto que registró en su solicitud.\n\nAgradecemos su paciencia."],
  ["T4", "Trato del personal",
   "Reciba un cordial saludo.\n\nLamentamos la situación que nos describe. Su caso fue remitido al área responsable y a Talento Humano para la revisión correspondiente y las acciones de mejora a que haya lugar.\n\nReiteramos nuestro compromiso con una atención humanizada y le agradecemos habernos informado."],
  ["T5", "Autorizaciones y trámites administrativos",
   "Reciba un cordial saludo.\n\nRealizamos el seguimiento ante el área de Autorizaciones y su trámite fue gestionado. Puede verificar el estado del servicio en nuestros canales de atención.\n\nQuedamos atentos a cualquier inquietud adicional."],
  ["T6", "Infraestructura, aseo y comodidad",
   "Reciba un cordial saludo.\n\nTrasladamos su observación al área de servicios generales e infraestructura, que adelantó la revisión y las acciones correctivas correspondientes en la sede.\n\nAgradecemos su reporte: nos ayuda a mejorar las condiciones de atención."],
  ["T7", "Facturación y cobros",
   "Reciba un cordial saludo.\n\nSu solicitud fue revisada con el área de facturación, donde se verificó el cobro y se realizaron los ajustes que correspondían.\n\nAgradecemos su comprensión."],
  ["T8", "Agradecimiento por felicitación",
   "Reciba un cordial saludo.\n\nAgradecemos el tiempo que dedicó a reconocer la labor de nuestro equipo. Su mensaje fue compartido con el área y con las personas que menciona: este tipo de comentarios motiva e impulsa nuestro compromiso con la atención.\n\nGracias por confiar en MiRed IPS."],
];

function _hojaPlantillas_() {
  var ss = _ss_();
  var h = ss.getSheetByName("Plantillas");
  if (h) return h;

  h = ss.insertSheet("Plantillas");
  h.getRange(1, 1, 1, 3).setValues([["CÓDIGO", "TIPOLOGÍA", "TEXTO DE RESPUESTA"]]);
  h.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#0B7A9E").setFontColor("#FFFFFF");
  h.setColumnWidth(1, 80); h.setColumnWidth(2, 300); h.setColumnWidth(3, 700);
  h.getRange(2, 1, PLANTILLAS_BASE.length, 3).setValues(PLANTILLAS_BASE);
  h.setFrozenRows(1);
  return h;
}

function apiPlantillas_() {
  var h = _hojaPlantillas_();
  var ultima = h.getLastRow();
  if (ultima < 2) return [];
  return h.getRange(2, 1, ultima - 1, 3).getValues()
    .filter(function (r) { return r[1] && r[2]; })
    .map(function (r) { return { codigo: r[0], tipologia: r[1], texto: r[2] }; });
}

function apiGuardarPlantilla_(tipologia, texto) {
  if (!tipologia || !texto) return { ok: false, mensaje: "Faltan la tipología y el texto." };
  var h = _hojaPlantillas_();
  var n = h.getLastRow();
  h.appendRow(["T" + n, tipologia, texto]);
  _traza("—", "Plantilla creada", tipologia);
  return { ok: true, plantillas: apiPlantillas_() };
}

// =====================================================================================
// v5 · FECHAS SIN HORA, MIGRACIÓN Y UTILIDADES DE PRESENTACIÓN
// =====================================================================================
/*
 * Por qué había decimales en «Días transcurridos»: el script creaba las fechas a la
 * medianoche de SU zona horaria y la hoja las leía en OTRA (p. ej. 22:00 del día
 * anterior). TODAY() − fecha daba 0,0833… Desde v5 toda fecha sin hora se construye
 * en la zona horaria de la HOJA y las fórmulas usan INT().
 */
var _TZ = null;
function _tz_() {
  if (!_TZ) {
    try { _TZ = _ss_().getSpreadsheetTimeZone(); } catch (e) {}
    _TZ = _TZ || Session.getScriptTimeZone() || "America/Bogota";
  }
  return _TZ;
}

/** Medianoche (zona de la hoja) de una fecha, texto yyyy-mm-dd o dd/mm/yyyy. */
function _soloFecha_(v) {
  if (v === null || v === undefined || v === "") return null;
  var tz = _tz_(), ymd = "", m;
  var dos = function (x) { return ("0" + parseInt(x, 10)).slice(-2); };
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return null;
    ymd = Utilities.formatDate(v, tz, "yyyy-MM-dd");
  } else {
    var s = v.toString().trim();
    if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s))) ymd = m[1] + "-" + dos(m[2]) + "-" + dos(m[3]);
    else if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s))) ymd = m[3] + "-" + dos(m[2]) + "-" + dos(m[1]);
    else {
      var d = new Date(s);
      if (isNaN(d.getTime())) return null;
      ymd = Utilities.formatDate(d, tz, "yyyy-MM-dd");
    }
  }
  return Utilities.parseDate(ymd, tz, "yyyy-MM-dd");
}

/** Días enteros (nunca decimales) para mostrar en la plataforma y en los correos. */
function _dias_(v) {
  if (typeof v === "number" && isFinite(v)) return Math.max(0, Math.round(v));
  return "";
}

/** Quita el símbolo inicial del semáforo guardado en la hoja («🔴 Vencida» → «Vencida»). */
function _limpiarSimbolo_(t) {
  return (t || "").toString().replace(/^[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ]+/, "").trim();
}

/** Texto legible del término: «15 días hábiles», «No aplica» o qué revisar. */
function _terminoTexto_(termino, tipoDia, entidad) {
  if (termino === "N/A") return "No aplica (felicitación)";
  if (typeof termino === "number") return termino + (termino === 1 ? " día " : " días ") + (tipoDia || "").toString().toLowerCase();
  if (!entidad) return "Falta la entidad presentada";
  return "Revisar la entidad «" + entidad + "»: no coincide con la tabla de términos";
}

// ---------------------------------------------------------------------------
// MIGRACIÓN AUTOMÁTICA (se ejecuta una sola vez al abrir la plataforma)
// ---------------------------------------------------------------------------
var ESQUEMA = "8.1";

function repararFechasYFormulas() {   // también disponible en el menú PQRS
  SpreadsheetApp.getUi();
  var r = _migrar_(true);
  try { SpreadsheetApp.getUi().alert(r.mensaje); } catch (e) {}
  return r;
}

/** Última fila que debe tener fórmulas: último registro + colchón. */
function _finFormulas_(h) {
  return Math.max(_finDatos_() + CFG.COLCHON_FORMULAS, CFG.FILA_DATOS + CFG.COLCHON_FORMULAS);
}

function _migrar_(forzar) {
  var props = PropertiesService.getScriptProperties();
  if (!forzar && props.getProperty("ESQUEMA") === ESQUEMA) return { ok: true, hecho: false, mensaje: "" };

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { ok: false, hecho: false, mensaje: "" };
  try {
    if (!forzar && props.getProperty("ESQUEMA") === ESQUEMA) return { ok: true, hecho: false, mensaje: "" };
    var h = _h(CFG.HOJA_DATOS);
    var enc = h.getRange(CFG.FILA_DATOS - 1, 1, 1, 53).getValues()[0].map(function (x) { return _norm(x); });
    if (enc[C.TERMINO - 1].indexOf("termino") === -1 || enc[C.DIAS - 1].indexOf("dias") === -1) {
      return { ok: false, hecho: false, mensaje: "Los encabezados del consolidado no coinciden con la versión esperada; no se tocaron las fórmulas." };
    }
    var cambios = [];

    // v8 · 1) Estructura: columnas nuevas, parámetros, festivos, términos, categorías, entidades y directorio.
    try { cambios = cambios.concat(_estructuraV8_(h)); } catch (e) { cambios.push("estructura: " + (e.message || e)); }
    // v8.1 · una sola estructura de radicado
    try { var u = _unificarRadicados_(); if (u) cambios.push(u + " radicado(s) unificado(s) en SIAU-AAAA-MM-NNNN"); } catch (e) { cambios.push("radicados: " + (e.message || e)); }

    var fin = _finFormulas_(h);
    var n = _finDatos_() - CFG.FILA_DATOS + 1;

    // 2) Fechas sin hora: se lleva cada valor a la medianoche que le corresponde.
    var corregidas = 0, tz = _tz_();
    [C.FECHA_PQRS, C.FECHA_RECEPCION, C.FECHA_RADICACION, C.FECHA_RTA_AREA, C.FECHA_RTA_USUARIO].forEach(function (col) {
      var rg = h.getRange(CFG.FILA_DATOS, col, n, 1);
      var vals = rg.getValues(), cambio = false;
      for (var i = 0; i < vals.length; i++) {
        var v = vals[i][0];
        if (!(v instanceof Date) || isNaN(v.getTime())) continue;
        var t = new Date(Math.round(v.getTime() / 1000) * 1000);
        var H = parseInt(Utilities.formatDate(t, tz, "H"), 10);
        var M = parseInt(Utilities.formatDate(t, tz, "m"), 10);
        var S = parseInt(Utilities.formatDate(t, tz, "s"), 10);
        if (H === 0 && M === 0 && S === 0) continue;
        var base = t;
        // Medianoche desplazada por zona horaria (hora «redonda»): se lleva al día más cercano.
        if (S === 0 && M % 15 === 0 && H >= 12) base = new Date(t.getTime() + 12 * 3600000);
        vals[i][0] = _soloFecha_(base);
        cambio = true; corregidas++;
      }
      if (cambio) rg.setValues(vals);
    });

    // 3) Fórmulas de términos (festivos en su propia hoja, categorías de riesgo, EPS) hasta el último registro + colchón.
    try { if (h.getMaxRows() < fin) h.insertRowsAfter(h.getMaxRows(), fin - h.getMaxRows()); } catch (e) {}
    var ef = _escribirFormulas_(h, fin);
    if (!ef.ok) return { ok: false, hecho: false, mensaje: ef.mensaje };

    props.setProperty("ESQUEMA", ESQUEMA);
    _traza("—", "Actualización v8.1", "Fechas ajustadas: " + corregidas + " · fórmulas hasta la fila " + fin +
      (cambios.length ? " · " + cambios.join(" · ") : ""));
    return { ok: true, hecho: true, corregidas: corregidas,
             mensaje: "Consolidado actualizado a la versión 8.1: una sola estructura de radicado (SIAU-AAAA-MM-NNNN), sin límite de filas, festivos automáticos, riesgo según las circulares de la Supersalud " +
                      "(vital 24 h, vital en niñas, niños y adolescentes 8 h, priorizado 48 h) y directorio de áreas" +
                      (corregidas ? " · " + corregidas + " fecha(s) corregida(s)." : ".") };
  } finally {
    lock.releaseLock();
  }
}

/** Parámetros de Config (columna B, desde la fila 11): etiqueta y valor por defecto. */
var PARAMS_V8 = [
  [8, "(sin uso desde v8.1: todos los radicados usan el prefijo de B13)", ""],
  [9, "Importar respuestas del formulario desde (fecha y hora)", ""],
  [10, "Enlace a la política de tratamiento de datos personales", ""],
  [11, "Enlace público del formulario QR", ""],
];

/** Cambios de estructura de la versión 8. Idempotente: solo agrega lo que falta. */
function _estructuraV8_(h) {
  var hechos = [];
  // Encabezados de las columnas nuevas (BB:BE)
  var enc = h.getRange(CFG.FILA_DATOS - 1, 54, 1, 4).getValues()[0];
  var faltan = false;
  [54, 55, 56, 57].forEach(function (c, i) { if (!enc[i]) { enc[i] = ENCABEZADOS_V8[c]; faltan = true; } });
  if (faltan) {
    try { if (h.getMaxColumns() < CFG.NCOL) h.insertColumnsAfter(h.getMaxColumns(), CFG.NCOL - h.getMaxColumns()); } catch (e) {}
    h.getRange(CFG.FILA_DATOS - 1, 54, 1, 4).setValues([enc]);
    try { h.getRange(CFG.FILA_DATOS - 1, 54, 1, 4).setFontWeight("bold").setBackground("#006081").setFontColor("#FFFFFF"); } catch (e) {}
    hechos.push("columnas de riesgo, población, autorización de datos y área sugerida");
  }
  // Parámetros nuevos
  var cfg = _h(CFG.HOJA_CONFIG);
  PARAMS_V8.forEach(function (p) {
    var fila = CFG.CFG_PARAM_INI + p[0];
    if (!cfg.getRange(fila, 1).getValue()) cfg.getRange(fila, 1).setValue(p[1]);
    if (p[2] && !cfg.getRange(fila, 2).getValue()) cfg.getRange(fila, 2).setValue(p[2]);
  });
  // Término para «EPS» como entidad presentada (fila 9 de la tabla de términos)
  if (!cfg.getRange(9, 1).getValue()) {
    cfg.getRange(9, 1, 1, 4).setValues([["EPS", 3, "Calendario", "Circular Supersalud 2023151000000010-5 – reclamo de riesgo simple (72 h) si la EPS no indica otro"]]);
    hechos.push("término para EPS (72 h)");
  }
  // Festivos en su propia hoja (se calculan solos: Ley 51 de 1983 y Pascua)
  var fest = _hojaFestivos_();
  if (fest.creada) hechos.push("hoja Festivos " + fest.desde + "–" + fest.hasta);
  // Categorías de riesgo y entidades de control nuevas
  hechos = hechos.concat(_completarTabla_(_hojaCategorias_(), CAT_COLS, CATEGORIAS_BASE, "categoría"));
  hechos = hechos.concat(_completarTabla_(_hojaEntidades_(), ENT_COLS, ENTIDADES_BASE, "entidad"));
  // Directorio: columnas de enrutamiento en Responsables
  hechos = hechos.concat(_directorioV8_());
  return hechos;
}

// ---------------------------------------------------------------------------
// v8 · FESTIVOS DE COLOMBIA (se calculan solos; ya no hay que digitarlos cada año)
// ---------------------------------------------------------------------------
/*
 * Ley 51 de 1983 («Ley Emiliani»): Reyes, San José, San Pedro y San Pablo, Asunción, Raza,
 * Todos los Santos e Independencia de Cartagena se trasladan al lunes siguiente. Jueves y
 * Viernes Santo dependen de la Pascua; Ascensión (+43), Corpus Christi (+64) y Sagrado
 * Corazón (+71) caen en lunes contados desde el domingo de Pascua.
 */
function _pascua_(y) {
  var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
      g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
      l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  var mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(y, mes - 1, dia));
}
function _festivosColombia_(y) {
  var D = function (m, d) { return new Date(Date.UTC(y, m - 1, d)); };
  var lunes = function (dt) { var w = dt.getUTCDay(); return w === 1 ? dt : new Date(dt.getTime() + ((8 - w) % 7) * 86400000); };
  var mas = function (dt, n) { return new Date(dt.getTime() + n * 86400000); };
  var p = _pascua_(y);
  var l = [
    [D(1, 1), "Año Nuevo"], [lunes(D(1, 6)), "Reyes Magos"], [lunes(D(3, 19)), "San José"],
    [mas(p, -3), "Jueves Santo"], [mas(p, -2), "Viernes Santo"], [D(5, 1), "Día del Trabajo"],
    [mas(p, 43), "Ascensión del Señor"], [mas(p, 64), "Corpus Christi"], [mas(p, 71), "Sagrado Corazón"],
    [lunes(D(6, 29)), "San Pedro y San Pablo"], [D(7, 20), "Independencia"], [D(8, 7), "Batalla de Boyacá"],
    [lunes(D(8, 15)), "Asunción de la Virgen"], [lunes(D(10, 12)), "Día de la Raza"], [lunes(D(11, 1)), "Todos los Santos"],
    [lunes(D(11, 11)), "Independencia de Cartagena"], [D(12, 8), "Inmaculada Concepción"], [D(12, 25), "Navidad"],
  ];
  return l.map(function (x) { return [x[0].toISOString().substring(0, 10), x[1]]; })
          .sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
}
/** Hoja Festivos (A: fecha, B: descripción), del año anterior a cinco años adelante. Agrega los años que falten. */
function _hojaFestivos_() {
  var ss = _ss_();
  var h = ss.getSheetByName("Festivos"), creada = false;
  if (!h) {
    h = ss.insertSheet("Festivos");
    h.getRange(1, 1, 1, 2).setValues([["FECHA", "DESCRIPCIÓN"]]);
    try { h.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#006081").setFontColor("#FFFFFF"); h.setFrozenRows(1); } catch (e) {}
    creada = true;
  }
  var tz = _tz_();
  var anio = parseInt(Utilities.formatDate(new Date(), tz, "yyyy"), 10);
  var u = h.getLastRow();
  var existentes = {};
  if (u >= 2) h.getRange(2, 1, u - 1, 1).getValues().forEach(function (r) {
    if (r[0] instanceof Date) existentes[Utilities.formatDate(r[0], tz, "yyyy-MM-dd")] = true;
    else if (r[0]) existentes[String(r[0]).substring(0, 10)] = true;
  });
  var nuevas = [];
  for (var y = anio - 1; y <= anio + 5; y++) {
    _festivosColombia_(y).forEach(function (f) {
      if (!existentes[f[0]]) { existentes[f[0]] = true; nuevas.push([Utilities.parseDate(f[0], tz, "yyyy-MM-dd"), f[1]]); }
    });
  }
  if (nuevas.length) {
    h.getRange(Math.max(u, 1) + 1, 1, nuevas.length, 2).setValues(nuevas);
    try { h.getRange(2, 1, Math.max(u, 1) - 1 + nuevas.length, 1).setNumberFormat("dd/MM/yyyy"); } catch (e) {}
    creada = creada || nuevas.length > 0;
  }
  return { hoja: h, creada: creada, desde: anio - 1, hasta: anio + 5, nuevas: nuevas.length };
}

// ---------------------------------------------------------------------------
// v8 · DIRECTORIO DE ÁREAS Y DIRECCIONAMIENTO (automático o manual)
// ---------------------------------------------------------------------------
/*
 * La hoja Responsables es el directorio. Desde v8 cada área puede declarar qué servicios
 * atiende, en qué sedes y qué palabras de la manifestación le corresponden. Con eso la
 * plataforma sugiere el área al radicar (por cualquier canal) y, si se activa en
 * Configuración ▸ Automatización, direcciona sola las felicitaciones o las PQRS con
 * un área inequívoca.
 */
var RESP_COLS_V8 = ["SERVICIOS QUE ATIENDE (;)", "SEDES (; vacío = todas)", "PALABRAS CLAVE (;)", "CORREOS EN COPIA (;)"];
// [patrón del nombre del área, servicios, palabras clave]
var DIRECTORIO_BASE = [
  [/^siau|atencion al usuario/, "ATENCIÓN AL USUARIO; ORIENTADOR; WHATSAPP", "informacion; orientacion; tramite; atencion al usuario"],
  [/calidad/, "", "seguridad del paciente; evento adverso; error en la atencion; calidad"],
  [/gerencia/, "", "gerente; gerencia; directivos"],
  [/aliment/, "ALIMENTACIÓN", "comida; alimentacion; dieta; almuerzo; desayuno; cena"],
  [/cirug/, "CIRUGÍA", "cirugia; operacion; quirofano; procedimiento quirurgico; programacion de cirugia"],
  [/consulta externa/, "CONSULTA EXTERNA; CONSULTA EXTERNA - MEDICINA GENERAL; CONSULTA EXTERNA - NUTRICION; CONSULTA EXTERNA - PSICOLOGIA",
   "consulta; medico general; control; nutricionista; psicologia; cita medica"],
  [/intensivo adultos|intermedio adultos/, "CUIDADO INTENSIVO ADULTOS; CUIDADO INTERMEDIO ADULTOS", "uci adultos; cuidados intensivos"],
  [/neonatal/, "CUIDADO INTENSIVO NEONATAL; CUIDADO INTERMEDIO NEONATAL", "uci neonatal; recien nacido; neonato"],
  [/pediatric/, "CUIDADO INTENSIVO PEDIÁTRICO; CUIDADO INTERMEDIO PEDIÁTRICO", "uci pediatrica"],
  [/docencia/, "DOCENCIA", "estudiante; practicante; interno; residente"],
  [/farmacia|farmaceut/, "FARMACIA", "medicamento; farmacia; formula; insulina; entrega de medicamentos"],
  [/hospitalizacion adult/, "HOSPITALIZACIÓN ADULTOS", "hospitalizacion; hospitalizado; piso"],
  [/ginecolog/, "HOSPITALIZACIÓN GINECOLÓGICA", "parto; ginecologia; embarazo; gestante; maternidad"],
  [/hospitalizacion pediatr/, "HOSPITALIZACIÓN PEDIATRÍA", "pediatria; hospitalizacion pediatrica"],
  [/laboratorio/, "LABORATORIO CLINICO", "laboratorio; examenes; muestra; resultados de laboratorio"],
  [/odontolog/, "CONSULTA EXTERNA - ODONTOLOGIA", "odontologia; odontologo; muela; diente; higiene oral"],
  [/radiolog|imagen/, "RADIOLOGÍA E IMÁGENES DIAGNÓSTICAS; APOYO DIAGNOSTICO", "rayos x; radiografia; ecografia; tomografia; imagenes diagnosticas"],
  [/telemedicina/, "TELEMEDICINA", "telemedicina; teleconsulta; videollamada"],
  [/transfusional/, "UNIDAD TRANSFUSIONAL", "transfusion; sangre; banco de sangre"],
  [/urgencia/, "URGENCIAS", "urgencias; triage; observacion; ambulancia; sala de espera de urgencias"],
  [/vacuna/, "VACUNACIÓN", "vacuna; vacunacion; esquema de vacunacion"],
  [/facturacion|admision/, "ADMISIONES", "factura; cobro; copago; cuota moderadora; admision; facturacion"],
  [/autorizacion/, "AUTORIZACIONES", "autorizacion; orden medica; autorizar; remision"],
  [/cita|agend|call/, "ASIGNACIÓN DE CITAS; CALL CENTER", "cita; agendar; agenda; call center; linea telefonica; reprogramar"],
  [/talento humano/, "", "grosero; grosera; maltrato; mal trato; falta de respeto; actitud; trato"],
  [/infraestructura|servicios generales|mantenimiento/, "", "aire acondicionado; bano; papel higienico; aseo; sillas; agua; infraestructura; ventilador"],
];

function _directorioV8_() {
  var h = _h(CFG.HOJA_RESP), hechos = [];
  var fe = CFG.RESP_FILA - 1;
  var cab = h.getRange(fe, 8, 1, 4).getValues()[0];
  if (!cab[0] && !cab[2]) {
    h.getRange(fe, 8, 1, 4).setValues([RESP_COLS_V8]);
    try { h.getRange(fe, 8, 1, 4).setFontWeight("bold").setBackground("#006081").setFontColor("#FFFFFF"); } catch (e) {}
    hechos.push("directorio con servicios, sedes y palabras clave");
  }
  var u = h.getLastRow();
  if (u < CFG.RESP_FILA) return hechos;
  var filas = h.getRange(CFG.RESP_FILA, 1, u - CFG.RESP_FILA + 1, 11).getValues(), n = 0;
  filas.forEach(function (r, i) {
    if (!r[1] || r[7] || r[9]) return;           // ya tiene servicios o palabras clave
    var area = _norm(r[1]);
    for (var j = 0; j < DIRECTORIO_BASE.length; j++) {
      if (DIRECTORIO_BASE[j][0].test(area)) {
        h.getRange(CFG.RESP_FILA + i, 8, 1, 3).setValues([[DIRECTORIO_BASE[j][1], r[8] || "", DIRECTORIO_BASE[j][2]]]);
        n++; break;
      }
    }
  });
  if (n) hechos.push(n + " área(s) con reglas de direccionamiento sugeridas");
  return hechos;
}

/**
 * Sugiere el área responsable de una PQRS. Devuelve las 3 mejores con su puntaje y razones.
 * Servicio que atiende +6 · palabra clave en la descripción +2 (máx. 3 por área) · sede propia +1.
 * Un área con sedes declaradas que no incluyen la sede del caso se descarta.
 */
function _sugerirArea_(f, lista) {
  lista = (lista || apiResponsables_()).filter(function (r) { return r.activo; });
  var servicio = _norm(f[C.SERVICIO - 1]), servEsp = _norm(f[C.SERVICIO_ESP - 1]), sede = _norm(f[C.SEDE - 1]);
  var texto = " " + _norm(f[C.DESCRIPCION - 1]).replace(/[^a-z0-9ñ ]/g, " ").replace(/\s+/g, " ") + " ";
  var out = [];
  lista.forEach(function (r) {
    var puntos = 0, razones = [];
    if (r.sedes.length && sede && r.sedes.map(_norm).indexOf(sede) === -1) return;
    if (r.sedes.length && sede) { puntos += 1; }
    r.servicios.forEach(function (sv) {
      var n = _norm(sv);
      if (n && (n === servicio || n === servEsp)) { puntos += 6; razones.push("atiende " + sv); }
    });
    var k = 0;
    r.palabras.forEach(function (p) {
      var n = _norm(p);
      if (k < 3 && n.length >= 3 && texto.indexOf(" " + n) !== -1) { puntos += 2; k++; razones.push("«" + p + "»"); }
    });
    if (puntos >= 2) out.push({ id: r.id, area: r.area, nombre: r.nombre, correo: r.correo, puntos: puntos, razones: razones });
  });
  out.sort(function (a, b) { return b.puntos - a.puntos; });
  return out.slice(0, 3);
}
/** ¿La sugerencia es inequívoca? (para el direccionamiento automático) */
function _areaClara_(sug) {
  return sug.length && sug[0].puntos >= 6 && _correoOk(sug[0].correo) && (sug.length === 1 || sug[0].puntos - sug[1].puntos >= 4);
}
function apiSugerirArea_(codigo) {
  var fila = _filaDe(codigo);
  if (fila < 0) return { ok: false, mensaje: "Radicado no encontrado." };
  var f = _h(CFG.HOJA_DATOS).getRange(fila, 1, 1, CFG.NCOL).getValues()[0];
  return { ok: true, sugerencias: _sugerirArea_(f) };
}

/** Agrega columnas y filas base que falten en una tabla de configuración (por nombre en la columna A o B). */
function _completarTabla_(hoja, cols, base, nombre) {
  var hechos = [];
  var cab = hoja.getRange(1, 1, 1, cols.length).getValues()[0];
  var nuevasCols = 0;
  cols.forEach(function (c, i) { if (!cab[i]) { hoja.getRange(1, i + 1).setValue(c); nuevasCols++; } });
  if (nuevasCols) try { hoja.getRange(1, 1, 1, cols.length).setFontWeight("bold").setBackground("#006081").setFontColor("#FFFFFF"); } catch (e) {}
  var clave = nombre === "entidad" ? 1 : 0;   // entidades se identifican por ENTIDAD (columna B)
  var u = hoja.getLastRow();
  var existentes = u >= 2 ? hoja.getRange(2, 1, u - 1, cols.length).getValues() : [];
  var mapa = {};
  existentes.forEach(function (r, i) { mapa[_norm(r[clave])] = { fila: i + 2, r: r }; });
  var agregadas = 0, completadas = 0;
  base.forEach(function (b) {
    var e = mapa[_norm(b[clave])];
    if (!e) { hoja.appendRow(b); agregadas++; return; }
    // columnas nuevas vacías en filas existentes: se completan con el valor base
    var cambio = false;
    for (var j = 0; j < cols.length; j++) if ((e.r[j] === "" || e.r[j] === null) && b[j] !== "" && j >= 7) { e.r[j] = b[j]; cambio = true; }
    if (cambio) { hoja.getRange(e.fila, 1, 1, cols.length).setValues([e.r]); completadas++; }
  });
  if (nuevasCols) hechos.push(nuevasCols + " columna(s) nueva(s) en " + hoja.getName());
  if (agregadas) hechos.push(agregadas + " " + nombre + "(es) nueva(s)");
  if (completadas) hechos.push(completadas + " " + nombre + "(es) completada(s)");
  return hechos;
}

/** Fórmulas (sintaxis en inglés) de una fila del consolidado: AF..AJ y AT. */
function _formulasFila_(r) {
  var T = "Config!$A$6:$D$9", FEST = "Festivos!$A$2:$A$400", UMB = "Config!$B$12";
  var AE = "$AE" + r, E = "$E" + r, AS = "$AS" + r, AH = "$AH" + r, AF = "$AF" + r, AG = "$AG" + r;
  var FELI = 'LEFT(UPPER(TRIM($AA' + r + ')),8)="FELICITA"';
  var U = "UPPER(TRIM(" + AE + "))";
  var KEY = 'IF(LEFT(' + U + ',5)="SUPER","SUPER SALUD",IF(LEFT(' + U + ',8)="SECRETAR","SECRETARIA DE SALUD",' +
            'IF(LEFT(' + U + ',4)="SEDE","SEDE",' + U + ')))';
  var busca = function (col, falla) {
    return 'IFERROR(VLOOKUP(' + U + ',' + T + ',' + col + ',FALSE),IFERROR(VLOOKUP(' + KEY + ',' + T + ',' + col + ',FALSE),' + falla + '))';
  };
  var CAT = "Categorias_Correo!$A$2:$E$60", AB = "UPPER(TRIM($AB" + r + "))";
  return {
    bloque: [
      '=IF($AA' + r + '="","",IF(' + FELI + ',"N/A",IFERROR(VLOOKUP(' + AB + ',' + CAT + ',4,FALSE),IF(' + AE + '="","",' + busca(2, '"⚠"') + '))))',
      '=IF($AA' + r + '="","",IF(' + FELI + ',"N/A",IFERROR(VLOOKUP(' + AB + ',' + CAT + ',5,FALSE),IF(' + AE + '="","",' + busca(3, '""') + '))))',
      '=IF(OR(' + E + '="",NOT(ISNUMBER(' + E + ')),' + AF + '="",' + AF + '="N/A",NOT(ISNUMBER(' + AF + '))),"",' +
        'IF(' + AG + '="Hábiles",WORKDAY(INT(' + E + '),' + AF + ',' + FEST + '),INT(' + E + ')+' + AF + '))',
      '=IF(' + E + '="","",IF(' + FELI + ',"⭐ Felicitación",IF(NOT(ISNUMBER(' + E + ')),"⚠ Revisar fecha",' +
        'IF(UPPER(TRIM($AK' + r + '))="RESPONDIDA - CERRADA","✅ Cerrada",IF(' + AE + '="","⚠ Falta entidad",' +
        'IF(' + AH + '="","⚠ Revisar término",IF(TODAY()>' + AH + ',"🔴 Vencida",' +
        'IF(' + AH + '-TODAY()<=' + UMB + ',"🟡 Próxima a vencer","🟢 En término"))))))))',
      '=IF(OR(' + E + '="",NOT(ISNUMBER(' + E + '))),"",IF(ISNUMBER(' + AS + '),MAX(0,INT(' + AS + ')-INT(' + E + ')),MAX(0,TODAY()-INT(' + E + '))))',
    ],
    oportunidad: '=IF(OR(' + AS + '="",NOT(ISNUMBER(' + AS + ')),' + AH + '=""),"",IF(INT(' + AS + ')<=' + AH + ',"A tiempo","Fuera de término"))',
  };
}

/** Cambia el separador de argumentos «,» por «;» fuera de los textos entre comillas. */
function _conPuntoYComa_(f) {
  var out = "", dentro = false;
  for (var i = 0; i < f.length; i++) {
    var ch = f.charAt(i);
    if (ch === '"') dentro = !dentro;
    out += (!dentro && ch === ",") ? ";" : ch;
  }
  return out;
}
function _esErrorDeFormula_(v) { return /^#(ERROR|NAME|NOMBRE)/i.test((v || "").toString()); }

/**
 * Escribe las fórmulas de todas las filas. Primero prueba en la primera fila con la
 * sintaxis estándar (coma); si la hoja responde #ERROR! (configuración regional con
 * punto y coma), repite con «;». Así funciona en cualquier configuración regional.
 */
function _escribirFormulas_(h, fin) {
  _hojaCategorias_();   // las tablas referenciadas deben existir antes de escribir las fórmulas
  _hojaFestivos_();
  var n = fin - CFG.FILA_DATOS + 1;
  var props = PropertiesService.getScriptProperties();
  var preferido = props.getProperty("SEPARADOR_FORMULAS") || ",";
  var intentos = preferido === ";" ? [";", ","] : [",", ";"];
  var sep = null;
  for (var k = 0; k < intentos.length && !sep; k++) {
    var p = _formulasFila_(CFG.FILA_DATOS);
    var fila = intentos[k] === ";" ? p.bloque.map(_conPuntoYComa_) : p.bloque;
    var rg = h.getRange(CFG.FILA_DATOS, C.TERMINO, 1, 5);
    rg.setFormulas([fila]);
    SpreadsheetApp.flush();
    var vis = rg.getDisplayValues()[0];
    if (!vis.some(_esErrorDeFormula_)) sep = intentos[k];
  }
  if (!sep) return { ok: false, mensaje: "La hoja rechazó las fórmulas de términos (#ERROR!). Revisa la configuración regional en Archivo ▸ Configuración." };
  _formulasBloque_(h, CFG.FILA_DATOS, fin, sep);
  SpreadsheetApp.flush();
  props.setProperty("SEPARADOR_FORMULAS", sep);
  return { ok: true, separador: sep, filas: n };
}

/**
 * Autodiagnóstico al abrir la plataforma: si las fórmulas muestran #ERROR!, apuntan a
 * otra fila (p. ej. después de borrar filas) o faltan al final, se reescriben solas.
 */
function _saludFormulas_() {
  var h = _h(CFG.HOJA_DATOS);
  var fin = _finDatos_();
  var n = fin - CFG.FILA_DATOS + 1;
  var problema = "";
  var muestra = h.getRange(CFG.FILA_DATOS, C.TERMINO, Math.min(n, 60), 5).getDisplayValues();
  for (var i = 0; i < muestra.length && !problema; i++) if (muestra[i].some(_esErrorDeFormula_)) problema = "fórmulas con #ERROR!";
  if (!problema) {
    var filas = [CFG.FILA_DATOS, Math.floor((CFG.FILA_DATOS + fin) / 2), fin];
    filas.forEach(function (r) {
      if (problema) return;
      var f = h.getRange(r, C.DIAS).getFormula();
      var m = /\$E(\d+)/.exec(f || "");
      if (f && r === CFG.FILA_DATOS && h.getRange(r, C.TERMINO).getFormula().indexOf("Categorias_Correo") === -1) problema = "fórmulas sin la tabla de categorías";
      if (f && r === CFG.FILA_DATOS && h.getRange(r, C.FECHA_MAX).getFormula().indexOf("Festivos!") === -1) problema = "fórmulas con los festivos viejos";
      if (!f) problema = "fila " + r + " sin fórmula";
      else if (!m || parseInt(m[1], 10) !== r) problema = "la fila " + r + " apuntaba a la fila " + (m ? m[1] : "?");
    });
  }
  if (!problema) return { ok: true, reparado: false };
  var ef = _escribirFormulas_(h, _finFormulas_(h));
  if (ef.ok) _traza("—", "Fórmulas reparadas", "Causa: " + problema + " · " + ef.filas + " filas · separador «" + ef.separador + "»");
  return { ok: ef.ok, reparado: ef.ok, mensaje: ef.ok ? "Se repararon las fórmulas del consolidado (" + problema + ")." : ef.mensaje };
}

// =====================================================================================
// PANEL POR MES Y AÑO (tarjetas de indicadores del Inicio)
// =====================================================================================
function _nuevoAgregado_() {
  return { total: 0, abiertas: 0, cerradas: 0, vencidas: 0, tipos: {}, canales: {}, sedes: {} };
}
function _sumar_(ag, f, sem) {
  var mas = function (o, k) { k = (k || "Sin dato").toString().trim() || "Sin dato"; o[k] = (o[k] || 0) + 1; return k; };
  var cerrada = _norm(f[C.ESTADO - 1]).indexOf("cerrada") !== -1;
  ag.total++;
  if (cerrada) ag.cerradas++; else ag.abiertas++;
  if (sem.indexOf("🔴") === 0) ag.vencidas++;
  var tipo = mas(ag.tipos, f[C.TIPO_PQRS - 1]);
  mas(ag.canales, f[C.CANAL - 1]);
  var sede = (f[C.SEDE - 1] || "Sin sede").toString().trim() || "Sin sede";
  var s = ag.sedes[sede] || (ag.sedes[sede] = { total: 0, abiertas: 0, vencidas: 0, tipos: {}, servicios: {} });
  s.total++;
  if (!cerrada) s.abiertas++;
  if (sem.indexOf("🔴") === 0) s.vencidas++;
  s.tipos[tipo] = (s.tipos[tipo] || 0) + 1;
  mas(s.servicios, f[C.SERVICIO - 1]);
}

/** Resumen de un año: 12 meses con tipo, canal y sede, y el total de cada año disponible. */
function apiResumenMensual_(anio) {
  var h = _h(CFG.HOJA_DATOS);
  var n = CFG.FILA_FIN - CFG.FILA_DATOS + 1;
  var datos = _datos_();
  var tz = _tz_();
  var hoy = new Date();
  var anioActual = parseInt(Utilities.formatDate(hoy, tz, "yyyy"), 10);
  anio = parseInt(anio, 10) || anioActual;

  var anios = {}, meses = [], anual = _nuevoAgregado_();
  for (var m = 0; m < 12; m++) meses.push(_nuevoAgregado_());

  datos.forEach(function (f) {
    if (!f[C.CODIGO - 1] || !_filaVisible_(f)) return;
    var fr = f[C.FECHA_RADICACION - 1];
    if (!(fr instanceof Date) || isNaN(fr.getTime())) return;
    var y = parseInt(Utilities.formatDate(fr, tz, "yyyy"), 10);
    anios[y] = (anios[y] || 0) + 1;
    if (y !== anio) return;
    var mi = parseInt(Utilities.formatDate(fr, tz, "M"), 10) - 1;
    var sem = (f[C.SEMAFORO - 1] || "").toString();
    _sumar_(meses[mi], f, sem);
    _sumar_(anual, f, sem);
  });
  if (!anios[anioActual]) anios[anioActual] = 0;

  return {
    anio: anio,
    mesActual: anio === anioActual ? parseInt(Utilities.formatDate(hoy, tz, "M"), 10) - 1 : 11,
    anios: Object.keys(anios).map(function (k) { return { anio: parseInt(k, 10), total: anios[k] }; })
             .sort(function (a, b) { return b.anio - a.anio; }),
    meses: meses, anual: anual,
  };
}

// =====================================================================================
// NOVEDADES EN SEGUNDO PLANO (avisos emergentes de la plataforma)
// =====================================================================================
/**
 * Devuelve lo que ocurrió después de «desde» (milisegundos): PQRS radicadas por
 * cualquier canal y respuestas de áreas registradas. Si conCorreo = true, también
 * cuenta los correos relevantes pendientes (sin las notificaciones de esta plataforma).
 */
function apiNovedades_(desde, conCorreo) {
  var ahora = Date.now();
  desde = Number(desde) || (ahora - 5 * 60000);
  var out = { ahora: ahora, eventos: [], correo: null };
  var h = _h(CFG.HOJA_TRAZA);
  var ultima = h.getLastRow();
  if (ultima >= CFG.TRAZA_FILA) {
    var ini = Math.max(CFG.TRAZA_FILA, ultima - 150);
    var filas = h.getRange(ini, 1, ultima - ini + 1, 5).getValues();
    var datos = null;
    filas.forEach(function (r) {
      var f = r[0];
      if (!(f instanceof Date) || f.getTime() <= desde) return;
      var acc = (r[2] || "").toString();
      if (["Radicación", "Respuesta del área registrada", "Alerta de riesgo", "Correo de ente de control", "Alerta de meta interna"].indexOf(acc) === -1) return;
      var ev = { ts: f.getTime(), codigo: r[1], accion: acc, detalle: (r[3] || "").toString().substring(0, 140), usuario: r[4] };
      if (acc === "Alerta de riesgo" || acc === "Alerta de meta interna") ev.alerta = true;
      if (acc === "Correo de ente de control") ev.ente = true;
      if (r[1] && r[1] !== "—") {
        if (!datos) {
          var hd = _h(CFG.HOJA_DATOS);
          datos = _datos_();
        }
        for (var i = datos.length - 1; i >= 0; i--) {
          if (datos[i][C.CODIGO - 1] === r[1]) {
            ev.tipo = datos[i][C.TIPO_PQRS - 1]; ev.canal = datos[i][C.CANAL - 1]; ev.sede = datos[i][C.SEDE - 1];
            ev.visible = _filaVisible_(datos[i]);
            ev.prioridad = _prioridadDe_(datos[i][C.CLASIF_INTERNA - 1], datos[i][C.ENTIDAD - 1]);
            ev.clasificacion = datos[i][C.CLASIF_INTERNA - 1];
            ev.nivel = _nivelDeCategoria_(datos[i][C.CLASIF_INTERNA - 1]);
            ev.felicitacion = _esFeli(datos[i][C.TIPO_PQRS - 1]);
            break;
          }
        }
      }
      if (ev.visible === false) return;
      out.eventos.push(ev);
    });
  }
  if (conCorreo && (!SESION || _permitido_(SESION, P_CORREO))) {
    try {
      var c = apiCorreos_(true);
      out.correo = c.resumen;
    } catch (e) { out.correo = { error: String(e.message || e) }; }
  }
  return out;
}

// =====================================================================================
// CORREO: SEPARAR LO RELEVANTE DE LAS NOTIFICACIONES DE ESTA PLATAFORMA
// =====================================================================================
var MARCA_SISTEMA = "Mensaje generado por el Sistema de PQRS de MiRed IPS";
var RE_ASUNTO_SISTEMA = /^(radicaci[oó]n de su [a-záéíóúñ]+|gracias por su felicitaci[oó]n|su pqrs .+ est[aá] en tr[aá]mite|respuesta a su pqrs|estado de su pqrs|control pqrs|\[(solicitud interna|interno|cerrada|reconocimientos?|alerta|riesgo|priorizada|vital|pqrs|por clasificar))/i;
var RE_RESPUESTA = /^\s*((re|rv|fw|fwd|res|enc|aw|tr)\s*:\s*)+/i;
var RE_REBOTE = /(delivery status notification|undeliverable|undelivered|no se ha podido entregar|no se pudo entregar|mail delivery (failed|subsystem)|returned mail|notificaci[oó]n de estado de entrega)/i;

function _misCorreos_() {
  var mios = [];
  try { mios.push(Session.getEffectiveUser().getEmail()); } catch (e) {}
  try { mios = mios.concat(GmailApp.getAliases()); } catch (e) {}
  try { if (_param(3)) mios.push(String(_param(3))); } catch (e) {}
  return mios.filter(String).map(function (x) { return x.toString().trim().toLowerCase(); });
}

function _atendidos_() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty("CORREOS_ATENDIDOS") || "[]"); }
  catch (e) { return []; }
}
function _marcarAtendido_(id) {
  var l = _atendidos_();
  if (l.indexOf(id) === -1) l.push(id);
  if (l.length > 350) l = l.slice(l.length - 350);
  PropertiesService.getScriptProperties().setProperty("CORREOS_ATENDIDOS", JSON.stringify(l));
}

/** Quita del cuerpo lo citado de mensajes anteriores (la respuesta del área queda limpia). */
function _sinCitas_(t) {
  var lineas = (t || "").toString().replace(/\r/g, "").split("\n"), out = [];
  for (var i = 0; i < lineas.length; i++) {
    var l = lineas[i];
    if (/^\s*>/.test(l)) break;
    if (/^\s*(El|On)\s.+(escribi[oó]|wrote)\s*:?\s*$/i.test(l)) break;
    if (/^\s*-{2,}\s*(Original Message|Mensaje original|Forwarded message|Mensaje reenviado)/i.test(l)) break;
    if (/^\s*(De|From)\s*:/i.test(l) && i + 1 < lineas.length && /^\s*(Enviado|Sent|Fecha|Date)\s*:/i.test(lineas[i + 1])) break;
    out.push(l);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Registra como «respuesta del área» el texto de un correo interno y lo marca como atendido. */
function apiRegistrarRespuestaDesdeCorreo_(idMsg, codigo, texto) {
  var msg;
  try { msg = GmailApp.getMessageById(idMsg); } catch (e) { return { ok: false, mensaje: "No pude abrir ese correo." }; }
  if (_filaDe(codigo) < 0) return { ok: false, mensaje: "No encontré el radicado " + codigo + "." };
  var t = (texto || _sinCitas_(msg.getPlainBody())).toString().trim();
  if (!t) return { ok: false, mensaje: "El correo no tiene texto para registrar." };
  var det = apiRegistrarRespuestaArea_(codigo, t, msg.getDate());
  _marcarAtendido_(idMsg);
  _traza(codigo, "Correo del área vinculado", "De " + msg.getFrom() + " · " + (msg.getSubject() || ""));
  return { ok: true, codigo: codigo, detalle: det };
}

/** Marca un correo de seguimiento como revisado (deja constancia en la trazabilidad si tiene radicado). */
function apiMarcarCorreoAtendido_(idMsg, codigo, nota) {
  try {
    var msg = GmailApp.getMessageById(idMsg);
    _marcarAtendido_(idMsg);
    if (codigo && _filaDe(codigo) >= 0) {
      _traza(codigo, "Correo del usuario revisado", "De " + msg.getFrom() + " · " + (msg.getSubject() || "") +
        (nota ? " · " + nota : "") + " · " + _sinCitas_(msg.getPlainBody()).substring(0, 400));
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, mensaje: "No pude marcar ese correo: " + (e.message || e) };
  }
}

/**
 * Bandeja del correo organizada por CONVERSACIONES (hilos de Gmail).
 * Categorías:
 *   pqrs     → parece una PQRS nueva
 *   cita     → solicitud de cita (se direcciona al área de citas; no es PQRS)
 *   curso    → conversación en gestión: se pidieron datos, se remitió a un área o se respondió
 *   area     → un área responde sobre un radicado
 *   usuario  → el usuario escribe sobre un radicado existente
 *   rebote   → una notificación no se pudo entregar
 *   otro     → correo de una persona que no parece PQRS ni cita
 *   sistema  → avisos que envió esta plataforma (se ocultan, solo se cuentan)
 */
var RE_PQRS_FUERTE = /(queja|reclam|inconform|derecho de peticion|tutela|denuncia|felicit|sugerencia|sugiero|mala atencion|no me atendieron|maltrato|pesimo servicio|demora|negaron|negaron el servicio|pqrs|pqr\b)/;
var RE_CITA = /(\bcitas?\b|agendar|agendamiento|\bagenda\b|asignar(me)? (una )?cita|asignacion de cita|programar|reprogramar|cancelar (la |mi )?cita|\bturno\b|disponibilidad de (agenda|citas)|control con|consulta con)/;

function _categoriaTexto_(asunto, cuerpo) {
  var t = _norm(asunto + " " + cuerpo);
  if (RE_PQRS_FUERTE.test(t)) return "pqrs";
  if (RE_CITA.test(t)) return "cita";
  if (/(solicitud|peticion|solicito|requiero|historia clinica|certificado|copia de)/.test(t)) return "pqrs";
  return "otro";
}

// ---------------------------------------------------------------------------
// Registro de la gestión de cada conversación (hoja Gestion_Correo)
// ---------------------------------------------------------------------------
var HILO_COLS = ["ID HILO", "CATEGORÍA", "ESTADO", "CORREO USUARIO", "ASUNTO", "ÁREA", "CORREO ÁREA",
                 "RADICADO", "ÚLTIMA ACCIÓN", "FECHA", "REGISTRADO POR"];
function _hojaHilos_() {
  var ss = _ss_();
  var h = ss.getSheetByName("Gestion_Correo");
  if (h) return h;
  h = ss.insertSheet("Gestion_Correo");
  h.getRange(1, 1, 1, HILO_COLS.length).setValues([HILO_COLS]);
  h.getRange(1, 1, 1, HILO_COLS.length).setFontWeight("bold").setBackground("#006081").setFontColor("#FFFFFF");
  h.setFrozenRows(1);
  return h;
}
function _hilos_() {
  var h = _hojaHilos_(), u = h.getLastRow(), out = {};
  if (u < 2) return out;
  h.getRange(2, 1, u - 1, HILO_COLS.length).getValues().forEach(function (r, i) {
    if (!r[0]) return;
    out[r[0]] = { fila: i + 2, categoria: r[1], estado: r[2], correoUsuario: r[3], asunto: r[4], area: r[5],
                  correoArea: r[6], codigo: r[7], accion: r[8], fecha: r[9] instanceof Date ? r[9].getTime() : 0 };
  });
  return out;
}
function _guardarHilo_(id, d) {
  var h = _hojaHilos_(), actual = _hilos_()[id] || {};
  var fila = actual.fila || (h.getLastRow() + 1);
  var v = function (k) { return d[k] !== undefined ? d[k] : (actual[k] || ""); };
  h.getRange(fila, 1, 1, HILO_COLS.length).setValues([[id, v("categoria"), v("estado"), v("correoUsuario"), v("asunto"),
    v("area"), v("correoArea"), v("codigo"), d.accion || actual.accion || "", new Date(), _usuario()]]);
}

// ---------------------------------------------------------------------------
// Lectura
// ---------------------------------------------------------------------------
function _contexto_() {
  var pref = (_param(2) || "SIAU").toString().trim().toUpperCase();
  var hd = _h(CFG.HOJA_DATOS);
  var n = CFG.FILA_FIN - CFG.FILA_DATOS + 1;
  var ids = hd.getRange(CFG.FILA_DATOS, C.ID_CORREO, n, 1).getValues();
  var cods = hd.getRange(CFG.FILA_DATOS, C.CODIGO, n, 1).getValues();
  var yaRadicados = {}, existe = {};
  for (var i = 0; i < n; i++) {
    if (ids[i][0]) yaRadicados[ids[i][0]] = cods[i][0];
    if (cods[i][0]) existe[cods[i][0].toString().toUpperCase()] = true;
  }
  var correosAreas = {};
  apiResponsables_().forEach(function (r) { if (r.correo) correosAreas[r.correo.toString().trim().toLowerCase()] = r.area; });
  return { mios: _misCorreos_(), atendidos: _atendidos_(), reCodigo: new RegExp("\\b(" + pref + "-\\d{4}-\\d{2}-\\d{4,})\\b", "i"),
           yaRadicados: yaRadicados, existe: existe, correosAreas: correosAreas, hilos: _hilos_(), tz: _tz_() };
}
function _correoDe_(msg) {
  var de = msg.getFrom() || "";
  return { nombre: de.replace(/<.*>/, "").replace(/"/g, "").trim(), correo: ((de.match(/<([^>]+)>/) || [null, de])[1] || "").trim().toLowerCase() };
}
function _rolMensaje_(msg, ctx) {
  var p = _correoDe_(msg), asunto = msg.getSubject() || "";
  if (/mailer-daemon|postmaster/i.test(p.correo) || RE_REBOTE.test(asunto)) return "rebote";
  if (ctx.mios.indexOf(p.correo) !== -1) return "siau";
  var cuerpo = msg.getPlainBody() || "";
  if (!RE_RESPUESTA.test(asunto) && (RE_ASUNTO_SISTEMA.test(asunto) || cuerpo.indexOf(MARCA_SISTEMA) !== -1)) return "siau";
  if (ctx.correosAreas[p.correo]) return "area";
  return "usuario";
}

function apiCorreos_(soloResumen) {
  _etiqueta_(CFG.GMAIL_PROCESADO);
  _etiqueta_(CFG.GMAIL_DESCARTADO);
  var etiqueta = GmailApp.getUserLabelByName(CFG.GMAIL_LABEL);
  var ctx = _contexto_();

  var hilos = [], vistos = {};
  var agregar = function (t) { if (!vistos[t.getId()]) { vistos[t.getId()] = true; hilos.push(t); } };
  if (etiqueta) etiqueta.getThreads(0, 30).forEach(agregar);
  GmailApp.search('in:inbox newer_than:45d -label:"' + CFG.GMAIL_DESCARTADO + '" -category:promotions -category:social', 0, 60).forEach(agregar);

  var items = [], res = { institucional: 0, pqrs: 0, cita: 0, curso: 0, area: 0, usuario: 0, rebote: 0, otro: 0, sistema: 0 };

  hilos.forEach(function (hilo) {
    var etq = hilo.getLabels().map(function (l) { return l.getName(); });
    if (etq.indexOf(CFG.GMAIL_DESCARTADO) !== -1) return;
    var hid = hilo.getId(), info = ctx.hilos[hid] || null;
    var msgs = hilo.getMessages();
    var codigoHilo = info && info.codigo ? info.codigo : "", despuesRadicado = false;
    var solicitante = null, ultimoExt = null, rolUltimo = "";
    var pendientes = [], nSistema = 0, rebotes = [];

    msgs.forEach(function (m) {
      var id = m.getId();
      var rol = _rolMensaje_(m, ctx);
      if (ctx.yaRadicados[id]) { codigoHilo = ctx.yaRadicados[id]; despuesRadicado = true; }
      if (rol === "siau") { nSistema++; return; }
      if (rol === "rebote") { if (ctx.atendidos.indexOf(id) === -1) rebotes.push(m); return; }
      if (rol === "usuario" && !solicitante) solicitante = _correoDe_(m);
      ultimoExt = m; rolUltimo = rol;
      if (!ctx.yaRadicados[id] && ctx.atendidos.indexOf(id) === -1) pendientes.push({ m: m, rol: rol });
    });
    res.sistema += nSistema;

    // Rebotes: un aviso por mensaje devuelto
    rebotes.forEach(function (m) {
      res.rebote++;
      if (!soloResumen) items.push(_itemCorreo_(hilo, m, "rebote", "", ctx, info, null, msgs.length));
    });
    if (!pendientes.length) return;
    var ult = pendientes[pendientes.length - 1];

    var cat;
    var asunto0 = msgs[0].getSubject() || "";
    var mc = ctx.reCodigo.exec(asunto0) || ctx.reCodigo.exec(ult.m.getSubject() || "") || ctx.reCodigo.exec((ult.m.getPlainBody() || "").substring(0, 3000));
    var codigo = mc ? mc[1].toUpperCase() : codigoHilo;
    if (codigo && !ctx.existe[codigo]) codigo = "";

    var entHilo = solicitante ? _entidadDe_(solicitante.correo, ENT_CACHE || (ENT_CACHE = _entidades_())) : null;
    var cerradoSinNovedad = info && /atendid|cerrad/i.test(info.estado || "") && !(ultimoExt && ultimoExt.getDate().getTime() > (info.fecha || 0));
    if (entHilo && !codigo && cerradoSinNovedad) {
      return;
    } else if (entHilo && !codigo) {
      cat = "institucional";
    } else if (info && info.estado && !codigo) {
      // Conversación que ya se está gestionando desde la plataforma
      var hayNuevo = ultimoExt && ultimoExt.getDate().getTime() > (info.fecha || 0);
      if (/atendid|cerrad/i.test(info.estado) && !hayNuevo) return;
      cat = "curso";
    } else if (codigo) {
      cat = (ult.rol === "area" || /\[(solicitud interna|interno)/i.test(ult.m.getSubject() || "")) ? "area" : "usuario";
    } else if (etq.indexOf(CFG.GMAIL_PROCESADO) !== -1 && !despuesRadicado) {
      return;
    } else {
      cat = etq.indexOf(CFG.GMAIL_LABEL) !== -1 ? "pqrs" : _categoriaTexto_(asunto0, pendientes.map(function (p) { return p.m.getPlainBody() || ""; }).join("\n"));
    }
    res[cat]++;
    if (soloResumen) return;
    if (cat === "otro" && res.otro > 25) return;
    var it = _itemCorreo_(hilo, ult.m, cat, codigo, ctx, info, solicitante, msgs.length);
    if (entHilo) {
      var catC = _categoriaCorreo_(asunto0, ult.m.getPlainBody() || "", CATS_CACHE || (CATS_CACHE = _categorias_()));
      it.entidad = entHilo.entidad; it.tipoEntidad = entHilo.tipo; it.categoriaCorreo = catC ? catC.nombre : "";
      it.prioridad = catC ? catC.prioridad : entHilo.prioridad;
    }
    it.nuevo = !!(info && ultimoExt && ultimoExt.getDate().getTime() > (info.fecha || 0));
    it.ultimoRol = rolUltimo;
    it.pendientes = pendientes.length;
    items.push(it);
  });

  items.sort(function (a, b) { return b.ts - a.ts; });
  res.relevantes = res.institucional + res.pqrs + res.cita + res.curso + res.area + res.usuario + res.rebote;
  var rangoP = { "Crítica": 0, "Alta": 1, "Media": 2 };
  items.sort(function (a, b) { return ((rangoP[a.prioridad] !== undefined ? rangoP[a.prioridad] : 3) - (rangoP[b.prioridad] !== undefined ? rangoP[b.prioridad] : 3)) || (b.ts - a.ts); });
  return { ok: true, resumen: res, items: items };
}

function _itemCorreo_(hilo, m, cat, codigo, ctx, info, solicitante, nMensajes) {
  var p = _correoDe_(m), asunto = m.getSubject() || "", cuerpo = m.getPlainBody() || "";
  var texto = _norm(asunto + " " + cuerpo), claves = [];
  PALABRAS_PQRS.concat(["cita", "agendar", "programar"]).forEach(function (k) {
    if (texto.indexOf(_norm(k)) !== -1 && claves.indexOf(k) === -1) claves.push(k);
  });
  return {
    id: m.getId(), hiloId: hilo.getId(), categoria: cat, codigo: codigo,
    ts: m.getDate().getTime(),
    fecha: Utilities.formatDate(m.getDate(), ctx.tz, "dd/MM/yyyy HH:mm"),
    fechaISO: Utilities.formatDate(m.getDate(), ctx.tz, "yyyy-MM-dd"),
    nombre: p.nombre || p.correo, correo: p.correo, area: ctx.correosAreas[p.correo] || "",
    solicitante: solicitante ? solicitante.correo : p.correo,
    asunto: asunto, cuerpo: cuerpo.substring(0, 2500),
    respuesta: _sinCitas_(cuerpo).substring(0, 4000),
    claves: claves, tipoSugerido: _detectarTipo_(asunto + " " + cuerpo),
    mensajes: nMensajes, estado: info ? info.estado : "", areaHilo: info ? info.area : "",
  };
}

/** Conversación completa: mensajes, quién escribe (usuario, área, SIAU), adjuntos y datos detectados. */
function apiHilo_(hiloId) {
  var hilo;
  try { hilo = GmailApp.getThreadById(hiloId); } catch (e) { hilo = null; }
  if (!hilo) return { ok: false, mensaje: "No encontré esa conversación en el correo." };
  var ctx = _contexto_();
  var info = ctx.hilos[hiloId] || null;
  var codigo = info && info.codigo ? info.codigo : "";
  var solicitante = null, textoUsuario = [];
  var mensajes = hilo.getMessages().map(function (m) {
    var p = _correoDe_(m), rol = _rolMensaje_(m, ctx);
    if (ctx.yaRadicados[m.getId()]) codigo = ctx.yaRadicados[m.getId()];
    if (rol === "usuario") { if (!solicitante) solicitante = p; textoUsuario.push(m.getPlainBody() || ""); }
    var adj = [];
    try {
      m.getAttachments({ includeInlineImages: false }).forEach(function (a, i) {
        adj.push({ idx: i, nombre: a.getName(), tipo: a.getContentType(), tam: a.getSize() });
      });
    } catch (e) {}
    return { id: m.getId(), rol: rol, nombre: p.nombre || p.correo, correo: p.correo, area: ctx.correosAreas[p.correo] || "",
             fecha: Utilities.formatDate(m.getDate(), ctx.tz, "dd/MM/yyyy HH:mm"), asunto: m.getSubject() || "",
             texto: (_sinCitas_(m.getPlainBody()) || (m.getPlainBody() || "")).replace(MARCA_SISTEMA + ".", "").replace(MARCA_SISTEMA, "").trim().substring(0, 6000),
             adjuntos: adj, atendido: ctx.atendidos.indexOf(m.getId()) !== -1 };
  });
  if (!codigo) {
    var mc = ctx.reCodigo.exec(mensajes.map(function (x) { return x.asunto; }).join(" "));
    if (mc && ctx.existe[mc[1].toUpperCase()]) codigo = mc[1].toUpperCase();
  }
  var datos = _extraerDatos_(textoUsuario.join("\n"));
  if (solicitante) { datos.correo = solicitante.correo; if (!datos.nombreSolicitante && solicitante.nombre && solicitante.nombre.indexOf("@") === -1) datos.nombreSolicitante = solicitante.nombre; }
  var primero = mensajes[0] || {};
  var entH = solicitante ? _entidadDe_(solicitante.correo) : null, catH = entH ? _categoriaCorreo_(primero.asunto || "", textoUsuario.join("\n")) : null;
  return { ok: true, hiloId: hiloId, asunto: primero.asunto || "", codigo: codigo, info: info,
           entidad: entH ? { nombre: entH.entidad, tipo: entH.tipo, presentada: entH.presentada, eps: _epsDeEntidad_(entH.entidad), prioridad: entH.prioridad } : null,
           categoriaCorreo: catH ? catH.nombre : "", categorias: _categorias_().map(function (c) { return { nombre: c.nombre, prioridad: c.prioridad, tipo: c.tipo }; }),
           solicitante: solicitante, mensajes: mensajes, datos: datos,
           categoria: _categoriaTexto_(primero.asunto || "", textoUsuario.join("\n")),
           tipoSugerido: _detectarTipo_(textoUsuario.join("\n")) };
}

// ---------------------------------------------------------------------------
// Datos del usuario que se pueden leer del texto del correo
// ---------------------------------------------------------------------------
function _buscarEnLista_(texto, nombreLista) {
  var lista = _listasConfig_()[nombreLista] || [], t = " " + _norm(texto).replace(/[^a-z0-9ñ ]/g, " ") + " ";
  var mejor = "", largo = 0;
  lista.forEach(function (v) {
    var n = _norm(v).replace(/^(c|p)\.\s*/, "").replace(/^(camino|paso)\s+/, "").replace(/[^a-z0-9ñ ]/g, " ").replace(/\s+/g, " ").trim();
    if (n.length < 4) return;
    if (t.indexOf(" " + n + " ") !== -1 && n.length > largo) { mejor = v; largo = n.length; }
  });
  return mejor;
}
function _extraerDatos_(texto) {
  var d = {}, t = (texto || "").toString(), m;
  var tn = _norm(t);
  if ((m = /(c\.?\s?c\.?|cedula|cédula|documento|identificaci[oó]n|t\.?\s?i\.?|tarjeta de identidad|registro civil|pasaporte|n[uú]mero|no\.)[^\d\n]{0,25}(\d[\d\.\s]{4,14}\d)/i.exec(t))) {
    var num = m[2].replace(/\D/g, "");
    if (num.length >= 6 && num.length <= 11 && !/^3\d{9}$/.test(num)) d.numDocSolicitante = num;
  }
  var tipoDoc = /tarjeta de identidad|\bt\.?\s?i\b/.test(tn) ? "tarjeta de identidad" : (/registro civil/.test(tn) ? "registro civil" :
                (/extranjer/.test(tn) ? "cedula de extranjeria" : (/pasaporte/.test(tn) ? "pasaporte" : (/cedula|\bc\.?\s?c\b/.test(tn) ? "cedula de ciudadania" : ""))));
  if (tipoDoc) {
    var abrev = { "cedula de ciudadania": "cc", "tarjeta de identidad": "ti", "cedula de extranjeria": "ce", "registro civil": "rc", "pasaporte": "pa" }[tipoDoc];
    var listaDoc = _listasConfig_()["TIPO DOCUMENTO"] || [], encontrado = "";
    listaDoc.forEach(function (v) { var nv = _norm(v).replace(/\./g, ""); if (!encontrado && (nv === tipoDoc || nv === abrev)) encontrado = v; });
    if (!encontrado) listaDoc.forEach(function (v) {
      var nv = _norm(v);
      if (!encontrado && nv.length >= 5 && nv.indexOf(tipoDoc.split(" ")[0]) === 0 && nv.indexOf(tipoDoc.split(" ").pop()) !== -1) encontrado = v;
    });
    if (encontrado) d.tipoDocSolicitante = encontrado;
  }
  if ((m = /(?:\+?57[\s-]?)?(3\d{2})[\s-]?(\d{3})[\s-]?(\d{4})\b/.exec(t))) d.telefono = m[1] + m[2] + m[3];
  if ((m = /(?:mi nombre es|me llamo|nombre(?: completo)?\s*:)\s*([A-Za-zÁÉÍÓÚÑáéíóúñ]+(?:\s+[A-Za-zÁÉÍÓÚÑáéíóúñ]+){1,4})/i.exec(t))) {
    d.nombreSolicitante = m[1].trim().replace(/\s+(y|mi|con|de la|identificad[oa]).*$/i, "");
  }
  var eps = _buscarEnLista_(t, "EPS / PRESTADOR"); if (eps) d.eps = eps;
  var sede = _buscarEnLista_(t, "SEDE"); if (sede) d.sede = sede;
  var serv = _buscarEnLista_(t, "SERVICIO"); if (serv) d.servicio = serv;
  var reg = _buscarEnLista_(t, "RÉGIMEN"); if (reg) d.regimen = reg;
  return d;
}

// ---------------------------------------------------------------------------
// Adjuntos: ver, guardar en Drive y reenviar
// ---------------------------------------------------------------------------
var MAX_VISTA = 8 * 1024 * 1024;
function _adjunto_(msgId, idx) {
  var m = GmailApp.getMessageById(msgId);
  var a = m.getAttachments({ includeInlineImages: false })[idx];
  if (!a) throw new Error("El adjunto ya no está disponible.");
  return a;
}
function apiAdjunto_(msgId, idx) {
  try {
    var a = _adjunto_(msgId, idx);
    if (a.getSize() > MAX_VISTA) return { ok: false, grande: true, nombre: a.getName(), mensaje: "El archivo pesa más de 8 MB: guárdalo en Drive para abrirlo." };
    return { ok: true, nombre: a.getName(), tipo: a.getContentType(), tam: a.getSize(), base64: Utilities.base64Encode(a.getBytes()) };
  } catch (e) { return { ok: false, mensaje: String(e.message || e) }; }
}
function _carpetaAdjuntos_(codigo) {
  var raizNombre = "PQRS · Adjuntos del correo";
  var it = DriveApp.getFoldersByName(raizNombre);
  var raiz = it.hasNext() ? it.next() : DriveApp.createFolder(raizNombre);
  var sub = codigo || "Sin radicar";
  var it2 = raiz.getFoldersByName(sub);
  return it2.hasNext() ? it2.next() : raiz.createFolder(sub);
}
function apiGuardarAdjuntoDrive_(msgId, idx, codigo) {
  try {
    var a = _adjunto_(msgId, idx);
    var f = _carpetaAdjuntos_(codigo).createFile(a.copyBlob()).setName(a.getName());
    if (codigo) _traza(codigo, "Adjunto guardado", a.getName() + " · " + f.getUrl());
    return { ok: true, url: f.getUrl(), nombre: a.getName() };
  } catch (e) { return { ok: false, mensaje: String(e.message || e) }; }
}
/** Arma los archivos a enviar: adjuntos elegidos del hilo + archivos subidos desde el equipo. */
function _blobs_(o, excluirMsgId) {
  var out = [], total = 0;
  (o.adjuntos || []).forEach(function (x) {
    if (excluirMsgId && x.msgId === excluirMsgId) return;
    var b = _adjunto_(x.msgId, x.idx).copyBlob(); total += b.getBytes().length; out.push(b);
  });
  (o.archivos || []).forEach(function (f) {
    var b = Utilities.newBlob(Utilities.base64Decode(f.base64), f.tipo || "application/octet-stream", f.nombre || "archivo");
    total += b.getBytes().length; out.push(b);
  });
  if (total > 20 * 1024 * 1024) throw new Error("Los archivos suman más de 20 MB; Gmail no permite enviarlos.");
  return out;
}

// ---------------------------------------------------------------------------
// Correo corto en el mismo hilo (misma imagen que las demás notificaciones)
// ---------------------------------------------------------------------------
function _html_(t) { return (t || "").toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function _opcionesCorreo_(extra) {
  var o = { name: CFG.REMITENTE, from: _remitenteAlias_() || undefined, inlineImages: { logoNiRed: Utilities.newBlob(Utilities.base64Decode(LOGO_BASE64), "image/png", "logo.png") } };
  if (!o.from) delete o.from;
  Object.keys(extra || {}).forEach(function (k) { if (extra[k] !== undefined && extra[k] !== null && extra[k] !== "") o[k] = extra[k]; });
  return o;
}
/** Último mensaje del usuario en el hilo (a ese se le responde para no escribirle a la propia oficina). */
function _mensajeUsuario_(hilo, ctx) {
  var msgs = hilo.getMessages(), sol = null, ultimo = null;
  msgs.forEach(function (m) {
    var rol = _rolMensaje_(m, ctx);
    if (rol !== "usuario") return;
    var p = _correoDe_(m);
    if (!sol) sol = p.correo;
    if (p.correo === sol) ultimo = m;
  });
  return ultimo;
}

// ---------------------------------------------------------------------------
// Acciones sobre la conversación
// ---------------------------------------------------------------------------
/** Pide al usuario, en el mismo hilo, los datos o documentos que faltan. */
function apiSolicitarDatos_(hiloId, o) {
  o = o || {};
  var hilo = GmailApp.getThreadById(hiloId), ctx = _contexto_();
  var base = _mensajeUsuario_(hilo, ctx);
  if (!base) return { ok: false, mensaje: "No encontré un mensaje del usuario al cual responder en esta conversación." };
  if (!(o.items && o.items.length) && !o.mensaje) return { ok: false, mensaje: "Elige qué datos o documentos necesitas." };
  var html = _correoHilo_({
    titulo: "Necesitamos completar su solicitud",
    mensaje: o.mensaje || "Reciba un cordial saludo. Para dar trámite a su solicitud necesitamos que nos envíe, respondiendo a este mismo correo, la siguiente información:",
    lista: o.items || [],
    cierre: "Puede adjuntar fotos o archivos PDF de los documentos. Una vez los recibamos continuaremos con la gestión.",
  });
  try {
    base.reply("Para dar trámite a su solicitud necesitamos: " + (o.items || []).join("; "), _opcionesCorreo_({ htmlBody: html, attachments: _blobs_(o) }));
  } catch (e) { return { ok: false, mensaje: "No se pudo enviar: " + (e.message || e) }; }
  var info = ctx.hilos[hiloId] || {};
  _guardarHilo_(hiloId, { categoria: o.categoria || info.categoria || "pqrs", estado: "Esperando datos del usuario",
    correoUsuario: _correoDe_(base).correo, asunto: hilo.getFirstMessageSubject(), accion: "Solicitud de datos: " + (o.items || []).join(", ") });
  if (info.codigo) _traza(info.codigo, "Datos solicitados al usuario", (o.items || []).join(", "));
  return { ok: true, mensaje: "Solicitud enviada a " + _correoDe_(base).correo + " en la misma conversación." };
}

/**
 * Direcciona la conversación a un área.
 *   modo "reenviar": se reenvía al área (el usuario no la ve); la respuesta del área vuelve a este hilo.
 *   modo "copia":    se responde al usuario con el área en copia, y los tres conversan en el mismo hilo.
 */
function apiDireccionarHilo_(hiloId, o) {
  o = o || {};
  var resp = _responsablePorId(o.idResponsable);
  if (!resp) return { ok: false, mensaje: "Elige el área." };
  if (!_correoOk(resp.correo)) return { ok: false, mensaje: "«" + resp.area + "» no tiene un correo válido. Complétalo en Responsables." };
  var hilo = GmailApp.getThreadById(hiloId), ctx = _contexto_();
  var base = _mensajeUsuario_(hilo, ctx);
  if (!base) return { ok: false, mensaje: "No encontré el mensaje del usuario en esta conversación." };
  var usuario = _correoDe_(base);
  var esCita = o.categoria === "cita";
  var info = ctx.hilos[hiloId] || {};
  var codigo = info.codigo || "";
  var avisoUsr = "";
  try {
    if (o.modo === "copia") {
      var htmlC = _correoHilo_({
        titulo: esCita ? "Su solicitud de cita fue remitida" : "Su solicitud fue remitida al área encargada",
        mensaje: "Reciba un cordial saludo. Hemos remitido su solicitud a " + resp.area + (resp.nombre ? " (" + resp.nombre + ")" : "") +
          ", que se encuentra en copia de este correo y le responderá por este mismo medio." + (o.nota ? "\n\n" + o.nota : ""),
      });
      base.reply("Hemos remitido su solicitud a " + resp.area + ".", _opcionesCorreo_({ htmlBody: htmlC, cc: resp.correo, attachments: _blobs_(o) }));
      avisoUsr = "el usuario y el área quedaron en la misma conversación";
    } else {
      var htmlR = _correoHilo_({
        interno: "SOLICITUD INTERNA · " + (esCita ? "SOLICITUD DE CITA" : "GESTIÓN DE SOLICITUD") + (codigo ? " · " + codigo : ""),
        titulo: esCita ? "Solicitud de cita de un usuario" : "Solicitud de un usuario para su gestión",
        mensaje: "La Oficina de Atención al Usuario le remite esta solicitud de " + (usuario.nombre || usuario.correo) + " (" + usuario.correo + ")." +
          (o.nota ? "\n\nIndicaciones: " + o.nota : "") + "\n\nResponda a este correo con la gestión realizada; la respuesta llega a la conversación del SIAU.",
        cita: base.getPlainBody(), citaTitulo: "Mensaje del usuario · " + Utilities.formatDate(base.getDate(), ctx.tz, "dd/MM/yyyy HH:mm"),
      });
      base.forward(resp.correo, _opcionesCorreo_({ htmlBody: htmlR, attachments: _blobs_(o, base.getId()) }));
      if (o.avisarUsuario) {
        base.reply("Su solicitud fue remitida a " + resp.area + ".", _opcionesCorreo_({ htmlBody: _correoHilo_({
          titulo: esCita ? "Recibimos su solicitud de cita" : "Recibimos su solicitud",
          mensaje: "Reciba un cordial saludo. Su solicitud fue remitida a " + resp.area + " para su gestión. Le responderemos por este mismo medio." }) }));
        avisoUsr = "aviso enviado a " + usuario.correo;
      }
    }
  } catch (e) { return { ok: false, mensaje: "No se pudo enviar: " + (e.message || e) }; }
  _guardarHilo_(hiloId, { categoria: esCita ? "cita" : (info.categoria || "pqrs"), estado: "En el área: " + resp.area,
    correoUsuario: usuario.correo, asunto: hilo.getFirstMessageSubject(), area: resp.area, correoArea: resp.correo,
    accion: (o.modo === "copia" ? "Respuesta con copia al área " : "Reenviado al área ") + resp.area });
  _traza(codigo || "—", esCita ? "Solicitud de cita direccionada" : "Correo direccionado al área",
    resp.area + " (" + resp.correo + ") · usuario " + usuario.correo + (o.nota ? " · " + o.nota : ""));
  return { ok: true, mensaje: (o.modo === "copia" ? "Respondido al usuario con copia a " : "Reenviado a ") + resp.area + (avisoUsr ? " · " + avisoUsr : "") };
}

/** Responde al usuario en el mismo hilo (opcionalmente con copia al área que tiene el caso). */
function apiResponderHilo_(hiloId, o) {
  o = o || {};
  if (!o.mensaje) return { ok: false, mensaje: "Escribe el mensaje." };
  var hilo = GmailApp.getThreadById(hiloId), ctx = _contexto_();
  var base = _mensajeUsuario_(hilo, ctx);
  if (!base) return { ok: false, mensaje: "No encontré un mensaje del usuario al cual responder." };
  var info = ctx.hilos[hiloId] || {};
  try {
    base.reply(o.mensaje, _opcionesCorreo_({ htmlBody: _correoHilo_({ mensaje: o.mensaje }),
      cc: (o.copiaArea && info.correoArea) ? info.correoArea : "", attachments: _blobs_(o) }));
  } catch (e) { return { ok: false, mensaje: "No se pudo enviar: " + (e.message || e) }; }
  _guardarHilo_(hiloId, { estado: o.cerrar ? "Atendido" : "Respondido al usuario", correoUsuario: _correoDe_(base).correo,
    asunto: hilo.getFirstMessageSubject(), categoria: info.categoria || o.categoria || "pqrs", accion: "Respuesta al usuario" });
  if (info.codigo) _traza(info.codigo, "Mensaje al usuario por el hilo", o.mensaje.substring(0, 300));
  return { ok: true, mensaje: "Mensaje enviado a " + _correoDe_(base).correo + "." };
}

/** Escribe al área en el mismo hilo (reenvío del último mensaje con una nota). */
function apiEscribirArea_(hiloId, o) {
  o = o || {};
  var ctx = _contexto_(), info = ctx.hilos[hiloId] || {};
  if (!info.correoArea) return { ok: false, mensaje: "Esta conversación aún no tiene un área asignada." };
  if (!o.mensaje) return { ok: false, mensaje: "Escribe el mensaje para el área." };
  var hilo = GmailApp.getThreadById(hiloId), msgs = hilo.getMessages(), base = msgs[msgs.length - 1];
  try {
    base.forward(info.correoArea, _opcionesCorreo_({ htmlBody: _correoHilo_({ interno: "SOLICITUD INTERNA · SEGUIMIENTO", mensaje: o.mensaje,
      cita: base.getPlainBody(), citaTitulo: "Último mensaje de la conversación" }), attachments: _blobs_(o, base.getId()) }));
  } catch (e) { return { ok: false, mensaje: "No se pudo enviar: " + (e.message || e) }; }
  _guardarHilo_(hiloId, { accion: "Seguimiento al área " + info.area });
  return { ok: true, mensaje: "Mensaje enviado a " + info.area + "." };
}

/** Da por atendida la conversación (vuelve a aparecer si llega un correo nuevo). */
function apiCerrarHilo_(hiloId, nota) {
  var hilo = GmailApp.getThreadById(hiloId);
  var info = _hilos_()[hiloId] || {};
  _guardarHilo_(hiloId, { estado: "Atendido", asunto: hilo.getFirstMessageSubject(), categoria: info.categoria || "otro", accion: nota || "Marcada como atendida" });
  var ctx = _contexto_();
  hilo.getMessages().forEach(function (m) { if (_rolMensaje_(m, ctx) === "rebote") _marcarAtendido_(m.getId()); });
  return { ok: true };
}

/** Guarda en Drive los adjuntos que envió el usuario en la conversación y deja el enlace en el radicado. */
function _guardarAdjuntosHilo_(hiloId, codigo, fila) {
  var hilo = GmailApp.getThreadById(hiloId), ctx = _contexto_(), n = 0, carpeta = null;
  hilo.getMessages().forEach(function (m) {
    if (_rolMensaje_(m, ctx) !== "usuario") return;
    m.getAttachments({ includeInlineImages: false }).forEach(function (a) {
      if (!carpeta) carpeta = _carpetaAdjuntos_(codigo);
      carpeta.createFile(a.copyBlob()).setName(a.getName()); n++;
    });
  });
  if (!n) return "sin adjuntos";
  var h = _h(CFG.HOJA_DATOS), obs = h.getRange(fila, C.OBSERVACIONES).getValue();
  h.getRange(fila, C.OBSERVACIONES).setValue((obs ? obs + " · " : "") + "Adjuntos: " + carpeta.getUrl());
  _traza(codigo, "Adjuntos guardados", n + " archivo(s) · " + carpeta.getUrl());
  return n + " archivo(s) guardado(s) en Drive";
}
var CATS_CACHE = null, ENT_CACHE = null;

// =====================================================================================
// v7 · ACCESO POR USUARIO Y CONTRASEÑA, ROLES Y SEDES ASIGNADAS
// =====================================================================================
/*
 * La aplicación web se ejecuta como la cuenta dueña (siau@miredips.org): todo lo que
 * tabulan los técnicos queda en este consolidado. Cada persona entra con su usuario y
 * contraseña; las funciones internas terminan en «_» (Apps Script no permite llamarlas
 * desde el navegador) y solo se alcanzan a través de api(), que valida la sesión, el
 * rol y las sedes asignadas.
 */
var USR_COLS = ["USUARIO", "NOMBRE", "CORREO", "ROL", "SEDES ASIGNADAS", "GESTIONA CORREO", "AVISOS POR CORREO",
                "ACTIVO", "CLAVE (HASH)", "SAL", "CREADO", "ÚLTIMO INGRESO", "DEBE CAMBIAR CLAVE"];
var ROLES = ["Administrador", "Técnico", "Consulta"];
var SESION = null;           // usuario de la llamada en curso (null = disparadores / sistema)
var DURACION_SESION = 21600; // 6 horas (máximo de CacheService)

function _hojaUsuarios_() {
  var ss = _ss_();
  var h = ss.getSheetByName("Usuarios");
  if (h) return h;
  h = ss.insertSheet("Usuarios");
  h.getRange(1, 1, 1, USR_COLS.length).setValues([USR_COLS]);
  h.getRange(1, 1, 1, USR_COLS.length).setFontWeight("bold").setBackground("#00475F").setFontColor("#FFFFFF");
  h.setFrozenRows(1);
  try { h.hideSheet(); } catch (e) {}
  return h;
}
function _usuarios_() {
  var h = _hojaUsuarios_(), u = h.getLastRow();
  if (u < 2) return [];
  return h.getRange(2, 1, u - 1, USR_COLS.length).getValues().map(function (r, i) {
    return { fila: i + 2, usuario: String(r[0] || "").trim().toLowerCase(), nombre: r[1], correo: r[2], rol: r[3] || "Técnico",
             sedes: String(r[4] || "").split(/\s*[;,|]\s*/).filter(String), correoOk: _si_(r[5]), avisos: _si_(r[6]),
             activo: _si_(r[7]), hash: r[8], sal: r[9], creado: r[10], ultimo: r[11], cambiar: _si_(r[12]) };
  }).filter(function (x) { return x.usuario; });
}
function _si_(v) { return /^(si|sí|true|1|x)$/i.test(String(v || "").trim()); }
function _hash_(clave, sal) {
  var v = sal + "|" + clave;
  for (var i = 0; i < 150; i++) {
    v = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, v + "|" + sal, Utilities.Charset.UTF_8)
      .map(function (b) { return ("0" + (b & 255).toString(16)).slice(-2); }).join("");
  }
  return v;
}
function _claveValida_(c) { return typeof c === "string" && c.length >= 8 && /[A-Za-z]/.test(c) && /\d/.test(c); }
function _publico_(u) {
  return { usuario: u.usuario, nombre: u.nombre, correo: u.correo, rol: u.rol, sedes: u.sedes, gestionaCorreo: u.correoOk,
           avisos: u.avisos, activo: u.activo, ultimo: u.ultimo instanceof Date ? Utilities.formatDate(u.ultimo, _tz_(), "dd/MM/yyyy HH:mm") : "",
           debeCambiar: u.cambiar, fila: u.fila };
}

// ---------------------------------------------------------------------------
// Funciones públicas (las únicas que el navegador puede llamar)
// ---------------------------------------------------------------------------
/** ¿Ya hay usuarios? Si no, la pantalla de acceso ofrece crear el primer administrador. */
function estadoAcceso() {
  try {
    return { hayUsuarios: _usuarios_().length > 0, institucion: "MiRed Barranquilla IPS S.A.S.", logo: LOGO_BASE64 };
  } catch (e) {
    return { hayUsuarios: true, institucion: "MiRed Barranquilla IPS S.A.S.", logo: LOGO_BASE64, error: _explicarError_(e) };
  }
}
/**
 * «No cuentas con el permiso necesario para acceder al documento solicitado» significa que el código
 * se está ejecutando con la cuenta de quien abre el enlace (no con la del SIAU) y esa cuenta no ve la hoja.
 */
function _explicarError_(e) {
  var m = String((e && e.message) || e || "");
  if (!/permiso|permission|autoriz|authoriz|access|acceso/i.test(m)) return m;
  var cuenta = "";
  try { cuenta = Session.getEffectiveUser().getEmail() || ""; } catch (x) {}
  var personal = /@(gmail|hotmail|outlook|yahoo)\./i.test(cuenta);
  return "La plataforma se está ejecutando con " + (cuenta ? "la cuenta «" + cuenta + "»" : "una cuenta sin acceso") +
    ", que no tiene permiso sobre el consolidado." + (personal ? " Es una cuenta personal: Google usó la cuenta predeterminada del navegador." : "") +
    " Solución: abre una ventana de incógnito (o un perfil de Chrome) con SOLO la cuenta del SIAU de MiRed, entra al consolidado ▸ Extensiones ▸ Apps Script " +
    "y desde allí: Implementar ▸ Administrar implementaciones ▸ lápiz ▸ «Ejecutar como: Yo (cuenta del SIAU)», «Quién tiene acceso: Cualquier persona», Nueva versión ▸ Implementar.";
}

/**
 * Ejecútala desde el editor de Apps Script (▶ Ejecutar) para saber con qué cuenta corre el código y si
 * esa cuenta abre el consolidado. Solo funciona desde el editor: desde la web no devuelve nada.
 */
function verificarCuenta() {
  var activa = "", efectiva = "";
  try { activa = Session.getActiveUser().getEmail() || ""; } catch (e) {}
  try { efectiva = Session.getEffectiveUser().getEmail() || ""; } catch (e) {}
  if (!activa || activa !== efectiva) return "Solo se puede ejecutar desde el editor de Apps Script.";
  var r = "Cuenta que ejecuta el código: " + efectiva + "\n";
  try {
    var ss = _ss_();
    r += "✔ Abre el consolidado «" + ss.getName() + "» (dueño: " + (function () { try { return ss.getOwner().getEmail(); } catch (e) { return "?"; } })() + ").\n";
    r += /@(gmail|hotmail|outlook|yahoo)\./i.test(efectiva)
      ? "⚠ Es una cuenta personal. Implementa con la cuenta del SIAU de MiRed para que los correos salgan de allí y los datos queden en la cuenta institucional."
      : "Listo para implementar: Implementar ▸ Nueva implementación ▸ Aplicación web ▸ Ejecutar como: Yo ▸ Cualquier persona.";
  } catch (e) { r += "✖ " + (e.message || e); }
  Logger.log(r);
  return r;
}

/** Solo funciona mientras la hoja Usuarios esté vacía. */
function crearPrimerAdministrador(d) {
  var lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    if (_usuarios_().length) return { ok: false, mensaje: "Ya existe un administrador. Pídele que te cree un usuario." };
    d = d || {};
    var usuario = String(d.usuario || "").trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,30}$/.test(usuario)) return { ok: false, mensaje: "El usuario debe tener de 3 a 30 letras o números, sin espacios." };
    if (!_claveValida_(d.clave)) return { ok: false, mensaje: "La contraseña debe tener mínimo 8 caracteres, con letras y números." };
    var sal = Utilities.getUuid();
    _hojaUsuarios_().appendRow([usuario, d.nombre || usuario, d.correo || "", "Administrador", "TODAS", "SI", "SI", "SI",
      _hash_(d.clave, sal), sal, new Date(), "", "NO"]);
    _traza("—", "Usuario creado", "Primer administrador: " + usuario);
    return iniciarSesion(usuario, d.clave);
  } finally { lock.releaseLock(); }
}

function iniciarSesion(usuario, clave) {
  try { return _iniciarSesion_(usuario, clave); }
  catch (e) { return { ok: false, mensaje: _explicarError_(e) }; }
}
function _iniciarSesion_(usuario, clave) {
  usuario = String(usuario || "").trim().toLowerCase();
  var cache = CacheService.getScriptCache();
  var intentos = parseInt(cache.get("int_" + usuario) || "0", 10);
  if (intentos >= 5) return { ok: false, mensaje: "Demasiados intentos. Espera 15 minutos o pide a un administrador que restablezca tu contraseña." };
  var u = _usuarios_().filter(function (x) { return x.usuario === usuario; })[0];
  if (!u || !u.hash || _hash_(String(clave || ""), u.sal) !== u.hash) {
    cache.put("int_" + usuario, String(intentos + 1), 900);
    return { ok: false, mensaje: "Usuario o contraseña incorrectos." };
  }
  if (!u.activo) return { ok: false, mensaje: "Tu usuario está inactivo. Habla con un administrador de la plataforma." };
  cache.remove("int_" + usuario);
  var token = Utilities.getUuid() + Utilities.getUuid().replace(/-/g, "");
  cache.put("ses_" + token, JSON.stringify({ usuario: u.usuario, t: Date.now() }), DURACION_SESION);
  _hojaUsuarios_().getRange(u.fila, 12).setValue(new Date());
  return { ok: true, token: token, usuario: _publico_(u) };
}

function cerrarSesion(token) {
  try { CacheService.getScriptCache().remove("ses_" + token); } catch (e) {}
  return { ok: true };
}

function _sesion_(token) {
  if (!token) return null;
  var cache = CacheService.getScriptCache();
  var raw = cache.get("ses_" + token);
  if (!raw) return null;
  var s = JSON.parse(raw);
  var u = _usuarios_().filter(function (x) { return x.usuario === s.usuario; })[0];
  if (!u || !u.activo) { cache.remove("ses_" + token); return null; }
  cache.put("ses_" + token, raw, DURACION_SESION);   // renueva
  var todas = !u.sedes.length || u.sedes.some(function (x) { return /^todas$/i.test(x); }) || u.rol === "Administrador";
  return { usuario: u.usuario, nombre: u.nombre || u.usuario, correo: u.correo, rol: u.rol, sedes: u.sedes, todas: todas,
           sedesNorm: u.sedes.map(_norm), gestionaCorreo: u.rol === "Administrador" || u.correoOk, avisos: u.avisos, debeCambiar: u.cambiar };
}

// ---------------------------------------------------------------------------
// Permisos por función
// ---------------------------------------------------------------------------
var P_LEER = "leer", P_RADICAR = "radicar", P_GESTION = "gestion", P_CORREO = "correo", P_ADMIN = "admin";
var RUTAS = {
  appBootstrap: [appBootstrap_, P_LEER], apiResumenHoy: [apiResumenHoy_, P_LEER], apiResumenMensual: [apiResumenMensual_, P_LEER],
  apiBandeja: [apiBandeja_, P_LEER], apiDetalle: [apiDetalle_, P_LEER, "codigo"], apiDashboard: [apiDashboard_, P_LEER],
  apiNovedades: [apiNovedades_, P_LEER], apiPlantillas: [apiPlantillas_, P_LEER], apiResponsables: [apiResponsables_, P_LEER],
  apiCambiarMiClave: [apiCambiarMiClave_, P_LEER], apiSugerirTipo: [apiSugerirTipo_, P_LEER],

  apiRadicar: [apiRadicar_, P_RADICAR, "sede"], apiNotificarRadicacion: [apiNotificarRadicacion_, P_RADICAR, "codigo"], apiActualizarDatos: [apiActualizarDatos_, P_RADICAR, "codigo"],
  apiEnviarAlArea: [apiEnviarAlArea_, P_GESTION, "codigo"], apiRedireccionar: [apiRedireccionar_, P_GESTION, "codigo"],
  apiRegistrarRespuestaArea: [apiRegistrarRespuestaArea_, P_GESTION, "codigo"], apiResponderUsuario: [apiResponderUsuario_, P_GESTION, "codigo"],
  apiReenviar: [apiReenviar_, P_GESTION, "codigo"], apiGuardarPlantilla: [apiGuardarPlantilla_, P_GESTION],
  apiReclasificar: [apiReclasificar_, P_RADICAR, "codigo"],

  apiCorreos: [apiCorreos_, P_CORREO], apiHilo: [apiHilo_, P_CORREO], apiAdjunto: [apiAdjunto_, P_CORREO],
  apiGuardarAdjuntoDrive: [apiGuardarAdjuntoDrive_, P_CORREO], apiSolicitarDatos: [apiSolicitarDatos_, P_CORREO],
  apiDireccionarHilo: [apiDireccionarHilo_, P_CORREO], apiResponderHilo: [apiResponderHilo_, P_CORREO],
  apiEscribirArea: [apiEscribirArea_, P_CORREO], apiCerrarHilo: [apiCerrarHilo_, P_CORREO], apiRadicarCorreo: [apiRadicarCorreo_, P_CORREO],
  apiDescartarCorreo: [apiDescartarCorreo_, P_CORREO], apiRegistrarRespuestaDesdeCorreo: [apiRegistrarRespuestaDesdeCorreo_, P_CORREO],
  apiMarcarCorreoAtendido: [apiMarcarCorreoAtendido_, P_CORREO], apiProcesarCorreoAhora: [apiProcesarCorreoAhora_, P_CORREO],

  apiGuardarResponsable: [apiGuardarResponsable_, P_ADMIN], apiEliminarResponsable: [apiEliminarResponsable_, P_ADMIN],
  apiLeerFormulario: [apiLeerFormulario_, P_ADMIN], apiGuardarMapeo: [apiGuardarMapeo_, P_ADMIN],
  apiImportarRespuestasForm: [apiImportarRespuestasForm_, P_ADMIN], apiEstadoFormulario: [apiEstadoFormulario_, P_ADMIN],
  apiUsuarios: [apiUsuarios_, P_ADMIN], apiGuardarUsuario: [apiGuardarUsuario_, P_ADMIN], apiRestablecerClave: [apiRestablecerClave_, P_ADMIN],
  apiGuardarEnlace: [apiGuardarEnlace_, P_ADMIN],
  // v8.2
  apiExportarExcel: [apiExportarExcel_, P_ADMIN], apiRespaldarAhora: [apiRespaldarAhora_, P_ADMIN],
  apiAjustes: [apiAjustes_, P_ADMIN], apiGuardarAjustes: [apiGuardarAjustes_, P_ADMIN],
  apiGuardarEntidad: [apiGuardarEntidad_, P_ADMIN], apiGuardarCategoria: [apiGuardarCategoria_, P_ADMIN], apiProbarAvisoExterno: [apiProbarAvisoExterno_, P_ADMIN],

  // v8
  apiPrioritarias: [apiPrioritarias_, P_LEER], apiEvaluarRiesgo: [apiEvaluarRiesgo_, P_LEER], apiSugerirArea: [apiSugerirArea_, P_LEER, "codigo"],
  apiIdentificarPrioritarias: [apiIdentificarPrioritarias_, P_RADICAR], apiFijarRiesgo: [apiFijarRiesgo_, P_RADICAR, "codigo"],
  apiRedactarRespuesta: [apiRedactarRespuesta_, P_GESTION, "codigo"], apiDireccionarFelicitaciones: [apiDireccionarFelicitaciones_, P_GESTION],
  apiFormularioQR: [apiFormularioQR_, P_ADMIN], apiCrearFormulario: [apiCrearFormulario_, P_ADMIN], apiDiagnostico: [apiDiagnostico_, P_ADMIN],
};

/*
 * v7.3 · La plataforma es un puente:
 *   Técnico (SIAU de sede) → radica/tabula y consulta las PQRS de sus sedes asignadas.
 *   Administrador          → direcciona a las áreas, responde al usuario, gestiona el correo y los accesos.
 *   Consulta               → solo ve.
 */
function _permitido_(s, permiso) {
  if (permiso === P_LEER) return true;
  if (permiso === P_RADICAR) return s.rol === "Administrador" || s.rol === "Técnico";
  return s.rol === "Administrador";   // gestión, correo y administración
}

/** Puerta única de la plataforma: sesión + permiso + sede. */
function api(token, nombre, args) {
  var s = _sesion_(token);
  if (!s) return { __sesion: false, mensaje: "Tu sesión terminó. Vuelve a ingresar." };
  var ruta = RUTAS[nombre];
  if (!ruta) throw new Error("Acción no disponible: " + nombre);
  if (!_permitido_(s, ruta[1])) return { ok: false, __permiso: false, mensaje: "Tu rol (" + s.rol + ") no permite esta acción." };
  SESION = s;
  args = args || [];
  if (ruta[2] === "codigo") {
    var fila = _filaDe(args[0]);
    if (fila > 0 && !_sedeVisible_(_h(CFG.HOJA_DATOS).getRange(fila, C.SEDE).getValue()))
      return { ok: false, mensaje: "Esta PQRS pertenece a una sede que no tienes asignada." };
  }
  if (ruta[2] === "sede") {
    var sede = (args[0] || {}).sede;
    if (!s.todas && !sede) return { ok: false, mensaje: "Elige la sede de la PQRS." };
    if (sede && !_sedeVisible_(sede)) return { ok: false, mensaje: "No tienes asignada la sede «" + sede + "»." };
  }
  return ruta[0].apply(null, args);
}

/** Visibilidad por sede: sin sesión (disparadores) o con «TODAS» se ve todo. */
function _sedeVisible_(sede) {
  if (!SESION || SESION.todas) return true;
  var n = _norm(sede);
  if (!n) return false;
  return SESION.sedesNorm.indexOf(n) !== -1;
}
function _filaVisible_(f) { return _sedeVisible_(f[C.SEDE - 1]); }

// ---------------------------------------------------------------------------
// Administración de usuarios
// ---------------------------------------------------------------------------
function apiUsuarios_() {
  return { ok: true, usuarios: _usuarios_().map(_publico_), roles: ROLES, sedes: _listasConfig_()["SEDE"] || [], enlace: _enlaceAcceso_() };
}
/** Enlace que se comparte con los técnicos. «/dev» es el de prueba: solo lo abren los editores del proyecto. */
function _enlaceAcceso_() {
  var url = "", cuenta = "", propio = "";
  url = _urlBase_();
  try { cuenta = Session.getEffectiveUser().getEmail() || ""; } catch (e) {}
  try { propio = String(PropertiesService.getScriptProperties().getProperty("URL_PLATAFORMA") || "").trim(); } catch (e) {}
  return { url: url, prueba: /\/dev(\?|$)/.test(url), cuenta: cuenta, personalizado: !!propio && propio === url };
}
/** v9.2 · El administrador cambia el enlace de la plataforma desde Usuarios y sedes (propiedad URL_PLATAFORMA).
 *  Solo acepta la «URL de la aplicación web» (/exec); vacío = vuelve al enlace predeterminado. */
function apiGuardarEnlace_(url) {
  url = String(url || "").trim().replace(/[?#].*$/, "");
  if (url && !/^https:\/\/script\.google\.com\/(a\/macros\/[^\/]+|macros)\/s\/[A-Za-z0-9_-]{20,}\/exec$/.test(url))
    return { ok: false, mensaje: /\/dev$/.test(url) ? "Ese es el enlace de prueba (/dev): solo lo abren los editores del proyecto. Copia el que termina en /exec."
      : "Pega la «URL de la aplicación web»: empieza por https://script.google.com/…/macros/s/ y termina en /exec." };
  PropertiesService.getScriptProperties().setProperty("URL_PLATAFORMA", url);
  return { ok: true, enlace: _enlaceAcceso_() };
}
function apiGuardarUsuario_(d) {
  d = d || {};
  var lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    var h = _hojaUsuarios_(), lista = _usuarios_();
    var usuario = String(d.usuario || "").trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,30}$/.test(usuario)) return { ok: false, mensaje: "Usuario inválido: de 3 a 30 letras, números, punto o guion." };
    if (ROLES.indexOf(d.rol) === -1) return { ok: false, mensaje: "Elige un rol." };
    if (d.correo && !_correoOk(d.correo)) return { ok: false, mensaje: "El correo no es válido." };
    var sedes = (d.sedes || []).join("; ") || (d.rol === "Administrador" ? "TODAS" : "");
    if (!sedes) return { ok: false, mensaje: "Asigna al menos una sede (o TODAS)." };
    var existente = lista.filter(function (x) { return x.usuario === usuario; })[0];
    if (existente && !d.editar) return { ok: false, mensaje: "Ese usuario ya existe." };
    if (existente) {
      if (SESION && existente.usuario === SESION.usuario && (d.activo === false || d.rol !== "Administrador"))
        return { ok: false, mensaje: "No puedes quitarte el rol de administrador ni inactivarte a ti mismo." };
      var admins = lista.filter(function (x) { return x.rol === "Administrador" && x.activo && x.usuario !== usuario; }).length;
      if (!admins && (d.rol !== "Administrador" || d.activo === false)) return { ok: false, mensaje: "Debe quedar al menos un administrador activo." };
      h.getRange(existente.fila, 2, 1, 7).setValues([[d.nombre || "", d.correo || "", d.rol, sedes, d.gestionaCorreo ? "SI" : "NO",
        d.avisos ? "SI" : "NO", d.activo === false ? "NO" : "SI"]]);
      _traza("—", "Usuario actualizado", usuario + " · " + d.rol + " · " + sedes + (d.activo === false ? " · INACTIVO" : ""));
    } else {
      if (!_claveValida_(d.clave)) return { ok: false, mensaje: "Contraseña temporal: mínimo 8 caracteres con letras y números." };
      var sal = Utilities.getUuid();
      h.appendRow([usuario, d.nombre || "", d.correo || "", d.rol, sedes, d.gestionaCorreo ? "SI" : "NO", d.avisos ? "SI" : "NO",
        d.activo === false ? "NO" : "SI", _hash_(d.clave, sal), sal, new Date(), "", "SI"]);
      _traza("—", "Usuario creado", usuario + " · " + d.rol + " · " + sedes);
    }
    return apiUsuarios_();
  } finally { lock.releaseLock(); }
}
function apiRestablecerClave_(usuario, clave) {
  var u = _usuarios_().filter(function (x) { return x.usuario === String(usuario || "").toLowerCase(); })[0];
  if (!u) return { ok: false, mensaje: "No existe ese usuario." };
  if (!_claveValida_(clave)) return { ok: false, mensaje: "Mínimo 8 caracteres con letras y números." };
  var sal = Utilities.getUuid();
  _hojaUsuarios_().getRange(u.fila, 9, 1, 2).setValues([[_hash_(clave, sal), sal]]);
  _hojaUsuarios_().getRange(u.fila, 13).setValue("SI");
  CacheService.getScriptCache().remove("int_" + u.usuario);
  _traza("—", "Contraseña restablecida", u.usuario);
  return { ok: true, mensaje: "Contraseña temporal asignada a " + u.usuario + ". Deberá cambiarla al ingresar." };
}
function apiCambiarMiClave_(actual, nueva) {
  var u = _usuarios_().filter(function (x) { return x.usuario === SESION.usuario; })[0];
  if (!u || _hash_(String(actual || ""), u.sal) !== u.hash) return { ok: false, mensaje: "La contraseña actual no es correcta." };
  if (!_claveValida_(nueva)) return { ok: false, mensaje: "La nueva contraseña debe tener mínimo 8 caracteres, con letras y números." };
  var sal = Utilities.getUuid();
  _hojaUsuarios_().getRange(u.fila, 9, 1, 2).setValues([[_hash_(nueva, sal), sal]]);
  _hojaUsuarios_().getRange(u.fila, 13).setValue("NO");
  return { ok: true, mensaje: "Contraseña actualizada." };
}


// =====================================================================================
// v7 · CLASIFICADOR DEL TIPO DE PQRS SEGÚN LO QUE DICE EL TEXTO
// =====================================================================================
/*
 * Revisa la descripción y propone el tipo (Queja, Reclamo, Petición, Sugerencia,
 * Felicitación, Denuncia, Tutela). Si el usuario marcó «Felicitación» pero el texto es
 * una queja, lo detecta. Confianza «alta» → se reclasifica (formulario QR y correo) y
 * queda constancia; «media» → se deja la sugerencia para que el técnico decida.
 */
var LEXICO_TIPOS = {
  "Felicitación": [["felicit", 3], ["agradec", 2], ["excelente atencion", 3], ["muy buena atencion", 3], ["buena atencion", 2],
    ["gracias por", 2], ["reconocer", 2], ["reconocimiento", 2], ["amable", 1], ["calidez", 2], ["humanizad", 1], ["destacar", 1],
    ["buen servicio", 2], ["excelente servicio", 3], ["muy atentos", 2], ["felicidades", 2]],
  "Queja": [["queja", 3], ["mala atencion", 3], ["pesima atencion", 3], ["maltrato", 3], ["grosero", 3], ["grosera", 3], ["irrespetuos", 3],
    ["descortes", 2], ["negligencia", 3], ["humill", 3], ["me grito", 3], ["mal trato", 3], ["indignante", 2], ["inconform", 2],
    ["demora", 2], ["esperando", 1], ["horas de espera", 2], ["no me atendieron", 3], ["no me quisieron atender", 3], ["pesimo", 2],
    ["desorden", 1], ["falta de respeto", 3], ["mala actitud", 3], ["no hay medicos", 2], ["me dejaron", 1], ["vergüenza", 2], ["verguenza", 2]],
  "Reclamo": [["reclamo", 3], ["reclam", 2], ["no me entregaron", 3], ["no han entregado", 3], ["medicamento", 1], ["no autoriz", 3],
    ["negaron", 2], ["cobro", 2], ["me cobraron", 3], ["factura", 1], ["no me asignan", 3], ["no asignan", 2], ["no hay agenda", 3],
    ["incumpl", 2], ["pendiente", 1], ["no me han dado", 2], ["no me dan", 2], ["exijo", 2], ["no me realizaron", 3], ["cancelaron", 1], ["autorizacion", 2], ["sin entrega", 3], ["inconvenientes con", 2]],
  "Petición": [["derecho de peticion", 4], ["solicito", 2], ["solicitud", 1], ["requiero", 2], ["copia de", 2], ["historia clinica", 2],
    ["certificado", 2], ["informacion sobre", 1], ["favor enviar", 2], ["le pido", 1], ["peticion", 2], ["necesito que", 1]],
  "Sugerencia": [["sugiero", 3], ["sugerencia", 3], ["seria bueno", 3], ["recomiendo", 2], ["propongo", 3], ["deberian", 2],
    ["podrian", 2], ["mejorar", 1], ["seria importante", 2], ["ojala", 1], ["implementar", 1]],
  "Denuncia": [["denuncia", 4], ["denunciar", 4], ["fraude", 3], ["corrupcion", 3], ["soborno", 3], ["cobro irregular", 3], ["acoso", 3],
    ["abuso", 2], ["ilegal", 2], ["robo", 2], ["extorsion", 3]],
  "Tutela": [["accion de tutela", 5], ["tutela", 3], ["juzgado", 3], ["fallo", 2], ["desacato", 4], ["auto admisorio", 4], ["juez", 2],
    ["medida provisional", 3]],
};

function _clasificarTipo_(texto, declarado) {
  var t = " " + _norm(texto).replace(/[^a-z0-9ñ ]/g, " ").replace(/\s+/g, " ") + " ";
  // Fórmulas de cortesía de cartas y remisiones: no son felicitaciones («Agradecemos su gestión»).
  t = t.replace(/ (agradec\w*|gracias) (de antemano|por su (atencion|gestion|colaboracion|pronta respuesta|valiosa)|su (atencion|gestion|colaboracion|pronta)|y quedo|quedamos)\w*/g, " ")
       .replace(/ (cordial(mente)?|atentamente|cordial saludo|quedo atent\w*|quedamos atent\w*) /g, " ");
  var puntaje = {}, razones = {};
  Object.keys(LEXICO_TIPOS).forEach(function (tipo) { puntaje[tipo] = 0; razones[tipo] = []; });
  Object.keys(LEXICO_TIPOS).forEach(function (tipo) {
    LEXICO_TIPOS[tipo].forEach(function (p) {
      var k = _norm(p[0]);
      if (t.indexOf(k) !== -1) {
        // una negación justo antes anula las palabras positivas («no fue excelente atención»)
        var neg = new RegExp("\\bno (fue |es |me )?(una )?" + k.split(" ")[0]).test(t);
        if (tipo === "Felicitación" && neg) { puntaje["Queja"] += p[1]; razones["Queja"].push("no " + p[0]); return; }
        puntaje[tipo] += p[1]; razones[tipo].push(p[0]);
      }
    });
  });
  // Una felicitación con señales negativas fuertes casi siempre es una queja.
  if (puntaje["Felicitación"] && puntaje["Queja"] >= 3) puntaje["Felicitación"] = Math.max(0, puntaje["Felicitación"] - 2);
  var decl = "";
  Object.keys(puntaje).forEach(function (k) { if (_norm(k) === _norm(declarado)) decl = k; });
  if (decl) puntaje[decl] += 1;   // lo que marcó el usuario suma un punto a su favor
  var orden = Object.keys(puntaje).sort(function (a, b) { return puntaje[b] - puntaje[a]; });
  var mejor = orden[0], seg = orden[1];
  var confianza = "baja";
  if (puntaje[mejor] >= 3 && puntaje[mejor] - puntaje[seg] >= 2) confianza = "alta";
  else if (puntaje[mejor] >= 2 && puntaje[mejor] > puntaje[seg]) confianza = "media";
  return { tipo: puntaje[mejor] ? mejor : (decl || ""), confianza: puntaje[mejor] ? confianza : "baja", puntaje: puntaje,
           razones: razones[mejor] || [], declarado: decl || declarado || "" };
}

/** Busca en la lista TIPO DE PQRS el valor exacto (Config puede tenerlo en mayúsculas o sin tilde). */
function _tipoEnLista_(tipo) {
  var n = _normalizarValorLista_(tipo, "TIPO DE PQRS");
  return n.reconocido ? n.valor : tipo;
}

/**
 * Aplica el clasificador a una fila recién escrita.
 *   modo "auto"     → confianza alta: se reclasifica y queda constancia (QR y correo)
 *   modo "sugerir"  → nunca cambia el tipo; deja la sugerencia (radicación presencial)
 */
function _aplicarClasificador_(fila, modo) {
  var h = _h(CFG.HOJA_DATOS);
  var f = h.getRange(fila, 1, 1, CFG.NCOL).getValues()[0];
  var decl = f[C.TIPO_PQRS - 1], desc = f[C.DESCRIPCION - 1];
  if (!desc) return null;
  var r = _clasificarTipo_(desc, decl);
  if (!r.tipo || _norm(r.tipo) === _norm(decl)) return r;
  var obs = String(f[C.OBSERVACIONES - 1] || "").replace(/\s*\[(Tipo sugerido|Reclasificada)[^\]]*\]/g, "");
  var nuevo = _tipoEnLista_(r.tipo);
  if (modo === "auto" && (r.confianza === "alta" || !decl)) {
    h.getRange(fila, C.TIPO_PQRS).setValue(nuevo);
    h.getRange(fila, C.OBSERVACIONES).setValue((obs ? obs + " " : "") + "[Reclasificada: " + (decl || "sin tipo") + " → " + nuevo + "]");
    if (_esFeli(decl) && !_esFeli(nuevo) && !h.getRange(fila, C.ENTIDAD).getValue()) h.getRange(fila, C.ENTIDAD).setValue(entidadSedeLista_());
    _traza(f[C.CODIGO - 1], "Reclasificada automáticamente", "Declarado: " + (decl || "—") + " · según el texto: " + nuevo +
      " (señales: " + r.razones.slice(0, 5).join(", ") + ")");
    r.aplicado = true;
  } else if (r.confianza !== "baja") {
    h.getRange(fila, C.OBSERVACIONES).setValue((obs ? obs + " " : "") + "[Tipo sugerido: " + nuevo + "]");
  }
  return r;
}

function apiSugerirTipo_(texto, declarado) { return _clasificarTipo_(texto || "", declarado || ""); }

function apiReclasificar_(codigo, tipo) {
  var fila = _filaDe(codigo);
  if (fila < 0) return { ok: false, mensaje: "Radicado no encontrado." };
  var h = _h(CFG.HOJA_DATOS);
  var antes = h.getRange(fila, C.TIPO_PQRS).getValue();
  var obs = String(h.getRange(fila, C.OBSERVACIONES).getValue() || "").replace(/\s*\[(Tipo sugerido|Reclasificada)[^\]]*\]/g, "");
  h.getRange(fila, C.TIPO_PQRS).setValue(tipo);
  h.getRange(fila, C.OBSERVACIONES).setValue(obs + (antes !== tipo ? " [Reclasificada: " + (antes || "sin tipo") + " → " + tipo + "]" : ""));
  if (_esFeli(antes) && !_esFeli(tipo) && !h.getRange(fila, C.ENTIDAD).getValue()) h.getRange(fila, C.ENTIDAD).setValue(entidadSedeLista_());
  SpreadsheetApp.flush();
  _traza(codigo, "Tipo de PQRS ajustado", (antes || "—") + " → " + tipo);
  try { _evaluarPrioridadFila_(fila, "auto"); } catch (e) { Logger.log(e); }
  return apiDetalle_(codigo);
}
function _etiquetasObs_(obs) {
  obs = String(obs || "");
  var s = /\[Tipo sugerido: ([^\]]+)\]/.exec(obs), r = /\[Reclasificada: ([^\]]+)\]/.exec(obs), d = /\[Datos incompletos: ([^\]]+)\]/.exec(obs);
  return { sugerido: s ? s[1] : "", reclasificada: r ? r[1] : "", datosFaltantes: d ? d[1] : "" };
}


// =====================================================================================
// v7 · AUTOMATIZACIÓN DEL CANAL CORREO (documento «Automatización Canal Correo Electrónico»)
// =====================================================================================
/*
 * Cada 5 minutos: identifica la entidad por el dominio del remitente (EPS o ente de
 * control), clasifica el asunto en las cinco categorías (Supersalud riesgo simple,
 * priorizado o vital, Tutela, Derecho de petición), calcula prioridad y término, envía
 * el acuse de recibo en el mismo hilo, avisa internamente por entidad y radica el caso
 * con sus adjuntos. Lo que no se puede clasificar con certeza queda en «EPS y entes»
 * para que el SIAU lo complete con un clic. Los correos de usuarios que son PQRS claras
 * también se radican solos; el técnico solo interviene si hace falta pedir un dato.
 */
var ENT_COLS = ["TIPO", "ENTIDAD", "DOMINIOS O CORREOS (separados por ;)", "ENTIDAD PRESENTADA", "PRIORIDAD", "AVISAR A (correos)", "ACTIVA",
                "CATEGORÍA POR DEFECTO"];
// v8: se agregan los entes de control y los despachos judiciales. Los dominios marcados «verificar» en docs/PENDIENTES.md
// se editan en Configuración ▸ Entidades sin tocar el código.
var ENTIDADES_BASE = [
  ["Ente de control", "Secretaría de Salud Distrital de Barranquilla", "@barranquilla.gov.co", "SECRETARIA DE SALUD", "Crítica", "", "SI", ""],
  ["Ente de control", "Superintendencia Nacional de Salud (Supersalud)", "@supersalud.gov.co", "SUPERSALUD", "Crítica", "", "SI", ""],
  ["Ente de control", "Contraloría", "@contraloria.gov.co", "SUPERSALUD", "Crítica", "", "SI", "REQUERIMIENTO ENTE DE CONTROL"],
  ["EPS", "Nueva EPS", "@nuevaeps.com.co", "EPS", "Alta", "", "SI", ""],
  ["EPS", "Famisanar", "@famisanar.com.co", "EPS", "Alta", "", "SI", ""],
  ["EPS", "Sura", "@sura.com.co", "EPS", "Alta", "", "SI", ""],
  ["EPS", "Mutual Ser", "@mutualser.org; @mutualser.com", "EPS", "Alta", "", "SI", ""],
  ["EPS (BPO)", "Mutual Ser - Affinity (BPO)", "@affinitybpo.com.co", "EPS", "Alta", "", "SI", ""],
  ["EPS", "Salud Total", "@saludtotal.com.co", "EPS", "Alta", "", "SI", ""],
  ["EPS", "EPS Familiar de Colombia", "@epsfamiliardecolombia.com", "EPS", "Alta", "", "SI", ""],
  ["EPS", "EPS Familiar de Colombia - Documental", "documental@miredips.org", "EPS", "Alta", "", "SI", ""],
  ["EPS", "Proteger EPS", "@protegereps.com", "EPS", "Alta", "", "SI", ""],
  ["EPS", "Sanitas", "@epssanitas.com", "EPS", "Alta", "", "SI", ""],
  ["EPS", "Coosalud", "@coosalud.com", "EPS", "Alta", "", "SI", ""],
  ["Ente de control", "Secretaría de Salud Departamental del Atlántico", "@atlantico.gov.co", "SECRETARIA DE SALUD", "Crítica", "", "SI", ""],
  ["Ente de control", "Contraloría Distrital de Barranquilla", "@contraloriabarranquilla.gov.co", "SUPERSALUD", "Crítica", "", "SI", "REQUERIMIENTO ENTE DE CONTROL"],
  ["Ente de control", "Procuraduría General de la Nación", "@procuraduria.gov.co", "SUPERSALUD", "Crítica", "", "SI", "REQUERIMIENTO ENTE DE CONTROL"],
  ["Ente de control", "Personería Distrital de Barranquilla", "@personeriabarranquilla.gov.co", "SUPERSALUD", "Crítica", "", "SI", "REQUERIMIENTO ENTE DE CONTROL"],
  ["Ente de control", "Defensoría del Pueblo", "@defensoria.gov.co", "SUPERSALUD", "Crítica", "", "SI", "REQUERIMIENTO ENTE DE CONTROL"],
  ["Ente de control", "Ministerio de Salud y Protección Social", "@minsalud.gov.co", "SUPERSALUD", "Crítica", "", "SI", "REQUERIMIENTO ENTE DE CONTROL"],
  ["Ente de control", "ICBF", "@icbf.gov.co", "SUPERSALUD", "Crítica", "", "SI", "REQUERIMIENTO ENTE DE CONTROL"],
  ["Rama Judicial", "Despachos judiciales (tutelas)", "@cendoj.ramajudicial.gov.co; @ramajudicial.gov.co", "SUPERSALUD", "Crítica", "", "SI", "TUTELA"],
];
var CAT_COLS = ["CATEGORÍA", "PALABRAS CLAVE (separadas por ;)", "PRIORIDAD", "DÍAS DE TÉRMINO", "TIPO DE DÍA", "META INTERNA (horas)", "TIPO DE PQRS",
                "ALCANCE DE LA META", "NORMA", "NIVEL DE RIESGO"];
// Términos: Circular Externa Supersalud 2023151000000010-5 de 2023 (vital 24 h, priorizado 48 h, simple 72 h);
// Circular Externa Supersalud 2026151000000007-5 de 2026 (riesgo vital en niñas, niños y adolescentes: 8 h);
// derecho de petición 15 días hábiles (Ley 1755 de 2015); tutela: el que fije el juez (48 h por defecto).
// «ALCANCE DE LA META»: Direccionar = alerta si no se ha enviado al área; Responder = alerta si no se ha cerrado.
// Las tres categorías «RIESGO … · N H» las asigna el motor de priorización (cualquier canal); las «SUPERSALUD …» llegan en el asunto del correo.
var CATEGORIAS_BASE = [
  ["TUTELA", "accion de tutela; tutela; fallo de tutela; auto admisorio; desacato; medida provisional; juzgado", "Crítica", 2, "Calendario", 8, "Tutela",
   "Direccionar", "Decreto 2591 de 1991 – el término que fije el despacho (48 h por defecto)", "Tutela"],
  ["SUPERSALUD RIESGO VITAL", "riesgo vital", "Crítica", 1, "Calendario", 4, "", "Direccionar", "Circular Externa Supersalud 2023151000000010-5 de 2023 – riesgo vital: 24 horas", "Vital"],
  ["SUPERSALUD RIESGO PRIORIZADO", "riesgo priorizado; priorizado; priorizada", "Alta", 2, "Calendario", 12, "", "Direccionar", "Circular Externa Supersalud 2023151000000010-5 de 2023 – riesgo priorizado: 48 horas", "Priorizado"],
  ["SUPERSALUD RIESGO SIMPLE", "riesgo simple", "Media", 3, "Calendario", "", "", "", "Circular Externa Supersalud 2023151000000010-5 de 2023 – riesgo simple: 72 horas", "Simple"],
  ["DERECHO DE PETICIÓN", "derecho de peticion; derecho fundamental de peticion; articulo 23 de la constitucion", "Alta", 15, "Hábiles", 8, "Petición",
   "Direccionar", "Ley 1755 de 2015, art. 14 – 15 días hábiles", ""],
  ["RIESGO VITAL NNA · 8 H", "", "Crítica", 0, "Calendario", 8, "", "Responder",
   "Circular Externa Supersalud 2026151000000007-5 de 2026 – riesgo vital en niñas, niños y adolescentes: respuesta de fondo en máximo 8 horas", "Vital NNA"],
  ["RIESGO VITAL · 24 H", "", "Crítica", 1, "Calendario", 4, "", "Direccionar", "Circular Externa Supersalud 2023151000000010-5 de 2023 – riesgo vital: 24 horas", "Vital"],
  ["RIESGO PRIORIZADO · 48 H", "", "Alta", 2, "Calendario", 12, "", "Direccionar",
   "Circular Externa Supersalud 2023151000000010-5 de 2023 – riesgo priorizado (sujetos de especial protección): 48 horas", "Priorizado"],
  ["REQUERIMIENTO ENTE DE CONTROL", "requerimiento de informacion; solicitud de informacion; traslado por competencia", "Alta", 10, "Hábiles", 8, "Petición",
   "Direccionar", "Ley 1755 de 2015, art. 30 – peticiones entre autoridades: 10 días hábiles, salvo que el ente fije otro término", ""],
];
var PRIORIDADES = ["Crítica", "Alta", "Media", "Normal"];

function _hojaConfigTabla_(nombre, cols, base) {
  var ss = _ss_();
  var h = ss.getSheetByName(nombre);
  if (h) return h;
  h = ss.insertSheet(nombre);
  h.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight("bold").setBackground("#006081").setFontColor("#FFFFFF");
  h.getRange(2, 1, base.length, cols.length).setValues(base);
  h.setFrozenRows(1);
  return h;
}
function _hojaEntidades_() { return _hojaConfigTabla_("Entidades_Correo", ENT_COLS, ENTIDADES_BASE); }
function _hojaCategorias_() { return _hojaConfigTabla_("Categorias_Correo", CAT_COLS, CATEGORIAS_BASE); }

function _entidades_() {
  var h = _hojaEntidades_(), u = h.getLastRow();
  if (u < 2) return [];
  return h.getRange(2, 1, u - 1, ENT_COLS.length).getValues().map(function (r, i) {
    return { fila: i + 2, tipo: r[0], entidad: r[1], patrones: String(r[2] || "").split(/\s*[;,]\s*/).map(function (x) { return x.trim().toLowerCase(); }).filter(String),
             presentada: r[3] || (/ente/i.test(r[0]) ? "SUPERSALUD" : "EPS"), prioridad: r[4] || "Alta",
             avisar: String(r[5] || "").split(/\s*[;,]\s*/).filter(_correoOk), activa: r[6] === "" || _si_(r[6]),
             categoria: String(r[7] || "").trim() };
  }).filter(function (e) { return e.entidad && e.patrones.length; });
}
function _categorias_() {
  var h = _hojaCategorias_(), u = h.getLastRow();
  if (u < 2) return [];
  return h.getRange(2, 1, u - 1, CAT_COLS.length).getValues().map(function (r, i) {
    return { fila: i + 2, nombre: String(r[0] || "").trim(), claves: String(r[1] || "").split(/\s*;\s*/).map(_norm).filter(String),
             prioridad: r[2] || "Media", dias: r[3], tipoDia: r[4], meta: parseFloat(r[5]) || 0, tipo: r[6] || "",
             alcance: String(r[7] || "Direccionar"), norma: String(r[8] || ""), nivel: String(r[9] || "") };
  }).filter(function (c) { return c.nombre; });
}

/** Entidad remitente según el correo: dirección exacta (documental@…) o dominio y subdominios. */
function _entidadDe_(correo, entidades) {
  correo = String(correo || "").trim().toLowerCase();
  var dominio = correo.split("@")[1] || "";
  var hallada = null;
  (entidades || _entidades_()).forEach(function (e) {
    if (hallada || !e.activa) return;
    e.patrones.forEach(function (p) {
      if (hallada) return;
      if (p.indexOf("@") > 0) { if (p === correo) hallada = e; return; }
      var d = p.replace(/^@/, "");
      if (dominio === d || (dominio.length > d.length && dominio.slice(-d.length - 1) === "." + d)) hallada = e;
    });
  });
  return hallada;
}
/** Categoría del asunto y del cuerpo (el asunto pesa más). */
function _categoriaCorreo_(asunto, cuerpo, cats) {
  var a = _norm(asunto), b = _norm(String(cuerpo || "").substring(0, 4000)), hallada = null;
  (cats || _categorias_()).forEach(function (c) {
    if (hallada) return;
    c.claves.forEach(function (k) { if (!hallada && k && a.indexOf(k) !== -1) hallada = c; });
  });
  if (hallada) return hallada;
  (cats || _categorias_()).forEach(function (c) {
    if (hallada) return;
    c.claves.forEach(function (k) { if (!hallada && k && k.length > 8 && b.indexOf(k) !== -1) hallada = c; });
  });
  return hallada;
}
function _epsDeEntidad_(nombre) {
  var lista = _listasConfig_()["EPS / PRESTADOR"] || [];
  var nucleo = _norm(String(nombre || "").split(/\s+[-–(]/)[0]).replace(/\beps\b/g, "").replace(/\s+/g, " ").trim();
  if (/secretar/.test(nucleo)) nucleo = "secretaria distrital de salud";
  if (/superintendencia|supersalud/.test(nucleo)) nucleo = "supersalud";
  var hallado = "";
  lista.forEach(function (v) { if (!hallado && nucleo.length >= 4 && _norm(v).indexOf(nucleo) !== -1) hallado = v; });
  return hallado || nombre;
}
function _prioridadDe_(clasif, entidad, cats) {
  var c = _norm(clasif), p = "";
  (cats || _categorias_()).forEach(function (x) { if (!p && _norm(x.nombre) === c) p = x.prioridad; });
  if (p) return p;
  var e = _norm(entidad);
  if (/supersalud|secretaria/.test(e)) return "Crítica";
  if (e === "eps" || /^eps/.test(c)) return "Alta";
  return "Normal";
}

// ---------------------------------------------------------------------------
// Ajustes de la automatización (Configuración ▸ Automatización)
// ---------------------------------------------------------------------------
var AJUSTES_BASE = { autoInstitucional: true, autoUsuarios: true, acuseInstitucional: true, citasAuto: false,
                     webhookChat: "", chatModo: "todas", avisarA: "", avisosSede: true, desde: 0, alias: "",
                     // v8: direccionamiento con el directorio. Felicitaciones: "resumen" (un correo diario por área),
                     // "inmediato" (una por una) o "manual". PQRS: solo si el área es inequívoca y se activa.
                     direccionFelicitaciones: "resumen", direccionAuto: false, avisoCierreArea: true,
                     // v8.2: respaldo diario en Excel dentro de Drive (y, si se indica, carpeta compartida con otra cuenta)
                     respaldoDiario: true, respaldoCorreo: "" };
function _ajustes_() {
  var a = {};
  try { a = JSON.parse(PropertiesService.getScriptProperties().getProperty("AJUSTES") || "{}"); } catch (e) {}
  Object.keys(AJUSTES_BASE).forEach(function (k) { if (a[k] === undefined) a[k] = AJUSTES_BASE[k]; });
  return a;
}
function apiAjustes_() {
  return { ok: true, ajustes: _ajustes_(), entidades: _entidades_(), categorias: _categorias_(), prioridades: PRIORIDADES,
           presentadas: _listasConfig_()["ENTIDAD PRESENTADA"] || ["SEDE", "SUPERSALUD", "SECRETARIA DE SALUD", "EPS"],
           tipos: _listasConfig_()["TIPO DE PQRS"] || [], disparadores: ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); }),
           cuenta: _cuentaCorreo_() };
}
/** Cuenta de Google que envía y lee los correos (la que hizo la implementación) y sus alias «Enviar como». */
function _cuentaCorreo_() {
  var c = { correo: "", alias: [] };
  try { c.correo = Session.getEffectiveUser().getEmail() || ""; } catch (e) {}
  try { c.alias = GmailApp.getAliases() || []; } catch (e) {}
  return c;
}
var ALIAS_OK = null;
/** Alias configurado en Ajustes, solo si la cuenta lo tiene habilitado en Gmail (si no, Gmail rechaza el envío). */
function _remitenteAlias_() {
  if (ALIAS_OK !== null) return ALIAS_OK;
  ALIAS_OK = "";
  try {
    var a = String(_ajustes_().alias || "").trim().toLowerCase();
    if (a && GmailApp.getAliases().map(function (x) { return String(x).toLowerCase(); }).indexOf(a) !== -1) ALIAS_OK = a;
  } catch (e) {}
  return ALIAS_OK;
}
function apiGuardarAjustes_(a) {
  var actual = _ajustes_();
  Object.keys(AJUSTES_BASE).forEach(function (k) { if (a && a[k] !== undefined && k !== "desde") actual[k] = a[k]; });
  if (actual.webhookChat && !/^https:\/\/chat\.googleapis\.com\//.test(actual.webhookChat)) return { ok: false, mensaje: "El webhook debe ser una URL de Google Chat (https://chat.googleapis.com/…)." };
  if (!actual.desde && (actual.autoInstitucional || actual.autoUsuarios)) actual.desde = Date.now();
  actual.respaldoCorreo = String(actual.respaldoCorreo || "").trim();
  if (actual.respaldoCorreo && !_correoOk(actual.respaldoCorreo)) return { ok: false, mensaje: "El correo del respaldo no es válido." };
  if (actual.alias && _cuentaCorreo_().alias.map(function (x) { return String(x).toLowerCase(); }).indexOf(String(actual.alias).toLowerCase()) === -1)
    return { ok: false, mensaje: "«" + actual.alias + "» no está habilitado como «Enviar como» en la cuenta " + _cuentaCorreo_().correo + ". Agrégalo en Gmail ▸ Configuración ▸ Cuentas, o deja el campo vacío." };
  ALIAS_OK = null;
  PropertiesService.getScriptProperties().setProperty("AJUSTES", JSON.stringify(actual));
  _traza("—", "Ajustes de automatización", JSON.stringify({ autoInstitucional: actual.autoInstitucional, autoUsuarios: actual.autoUsuarios, citasAuto: actual.citasAuto, chat: !!actual.webhookChat }));
  return apiAjustes_();
}
function apiGuardarEntidad_(e) {
  var h = _hojaEntidades_();
  if (!e || !e.entidad || !e.patrones) return { ok: false, mensaje: "Faltan la entidad y sus dominios." };
  var fila = e.fila || h.getLastRow() + 1;
  h.getRange(fila, 1, 1, ENT_COLS.length).setValues([[e.tipo || "EPS", e.entidad, e.patrones, e.presentada || "EPS", e.prioridad || "Alta", e.avisar || "",
    e.activa === false ? "NO" : "SI", e.categoria || ""]]);
  _traza("—", "Entidad de correo guardada", e.entidad + " · " + e.patrones);
  return apiAjustes_();
}
function apiGuardarCategoria_(c) {
  var h = _hojaCategorias_();
  if (!c || !c.nombre) return { ok: false, mensaje: "Falta el nombre de la categoría." };
  var fila = c.fila || h.getLastRow() + 1;
  h.getRange(fila, 1, 1, CAT_COLS.length).setValues([[String(c.nombre).toUpperCase(), c.claves || "", c.prioridad || "Media", c.dias === 0 ? 0 : (c.dias || ""),
    c.tipoDia || "Calendario", c.meta || "", c.tipo || "", c.alcance || "Direccionar", c.norma || "", c.nivel || ""]]);
  _traza("—", "Categoría de correo guardada", c.nombre);
  return apiAjustes_();
}

// ---------------------------------------------------------------------------
// Avisos fuera de la plataforma: Google Chat y correo
// ---------------------------------------------------------------------------
function _avisoChat_(texto) {
  var a = _ajustes_();
  if (!a.webhookChat) return false;
  try {
    UrlFetchApp.fetch(a.webhookChat, { method: "post", contentType: "application/json; charset=UTF-8", muteHttpExceptions: true,
      payload: JSON.stringify({ text: texto }) });
    return true;
  } catch (e) { Logger.log("Chat: " + e); return false; }
}
function _correosAviso_(sede, extra) {
  var a = _ajustes_(), out = [];
  var add = function (c) { c = String(c || "").trim().toLowerCase(); if (_correoOk(c) && out.indexOf(c) === -1) out.push(c); };
  String(a.avisarA || "").split(/\s*[;,]\s*/).forEach(add);
  (extra || []).forEach(add);
  if (a.avisosSede) _usuarios_().forEach(function (u) {
    if (!u.activo || !u.avisos || !u.correo) return;
    var todas = u.rol === "Administrador" || u.sedes.some(function (s) { return /^todas$/i.test(s); });
    if (todas || (sede && u.sedes.map(_norm).indexOf(_norm(sede)) !== -1)) add(u.correo);
  });
  return out;
}
/** Línea de Google Chat: solo radicado, prioridad, tipo, sede y fechas (sin nombres ni descripción). */
function _lineaChat_(etiqueta, codigo, partes, fechas) {
  var url = _urlPlataforma_(codigo);
  return (etiqueta ? etiqueta + " " : "") + "*" + codigo + "* — " + partes.filter(String).join(" · ") + (fechas ? "\n" + fechas : "") +
    (url ? "\n<" + url + "|Abrir en la plataforma>" : "");
}
/** Aviso interno de un caso nuevo: correo a quien corresponda + Google Chat. Confidencial: sin datos del usuario. */
function _avisoNuevoCaso_(fila, extra) {
  var f = _h(CFG.HOJA_DATOS).getRange(fila, 1, 1, CFG.NCOL).getValues()[0];
  var codigo = f[C.CODIGO - 1], cats = _categorias_();
  var prioridad = _prioridadDe_(f[C.CLASIF_INTERNA - 1], f[C.ENTIDAD - 1], cats);
  var remitente = (extra && extra.entidad) || "";
  var tipo = f[C.TIPO_PQRS - 1], feli = _esFeli(tipo);
  var vence = feli ? "" : (f[C.FECHA_MAX - 1] instanceof Date ? _fmt(f[C.FECHA_MAX - 1]) : "");
  var fechasTxt = "Recibida " + _fmt(f[C.FECHA_RECEPCION - 1]) + (f[C.FECHA_PQRS - 1] ? " · hechos " + _fmt(f[C.FECHA_PQRS - 1]) : "") + (vence ? " · vence " + vence : "");
  var etq = prioridad === "Crítica" ? "[CRÍTICA]" : prioridad === "Alta" ? "[ALTA]" : "[NUEVA]";
  var a = _ajustes_();
  if (a.chatModo !== "prioritarias" || prioridad === "Crítica" || prioridad === "Alta")
    _avisoChat_(_lineaChat_(etq, codigo, [remitente, f[C.CLASIF_INTERNA - 1], tipo, f[C.SEDE - 1], f[C.CANAL - 1]], fechasTxt));
  var destinos = _correosAviso_(f[C.SEDE - 1], extra && extra.avisar);
  if (!destinos.length) return;
  var html = _correoHilo_({
    interno: "AVISO INTERNO · NUEVA PQRS" + (prioridad !== "Normal" ? " · PRIORIDAD " + prioridad.toUpperCase() : ""),
    kicker: tipo || "PQRS", codigo: codigo,
    titulo: feli ? "Llegó una felicitación" : (prioridad === "Crítica" ? "Nueva PQRS de prioridad crítica" : prioridad === "Alta" ? "Nueva PQRS prioritaria" : "Nueva PQRS radicada"),
    mensaje: "Se radicó un caso en " + (f[C.SEDE - 1] || "una sede sin asignar") + (remitente ? ", remitido por " + remitente : "") + ". " +
      "Por confidencialidad, este aviso no incluye los datos del usuario ni la descripción: consúltalos en la plataforma con tu usuario.",
    fechas: { hechos: _fmt(f[C.FECHA_PQRS - 1]), recepcion: _fmt(f[C.FECHA_RECEPCION - 1]), radicacion: _fmt(f[C.FECHA_RADICACION - 1]), max: vence },
    detalles: [["Prioridad", prioridad], ["Clasificación", f[C.CLASIF_INTERNA - 1]], ["Canal", f[C.CANAL - 1]], ["Sede", f[C.SEDE - 1]], ["Servicio", f[C.SERVICIO - 1]]],
    boton: { texto: "Abrir en la plataforma", url: _urlPlataforma_(codigo) } });
  _enviar(destinos.join(","), "[PQRS" + (prioridad !== "Normal" ? " · " + prioridad : "") + "] " + codigo + (remitente ? " · " + remitente : "") +
    (f[C.CLASIF_INTERNA - 1] ? " · " + f[C.CLASIF_INTERNA - 1] : ""), "Nueva PQRS " + codigo + ". Consulta el detalle en la plataforma.", html);
}
function apiProbarAvisoExterno_() {
  var chat = _avisoChat_("Prueba de avisos del Sistema de PQRS de MiRed IPS: este espacio recibirá las PQRS nuevas y las alertas de vencimiento.");
  var destinos = _correosAviso_("", []);
  if (destinos.length) _enviar(destinos.join(","), "[PQRS] Prueba de avisos", "Prueba", _correoHilo_({ interno: "AVISO INTERNO · PRUEBA", titulo: "Prueba de avisos",
    mensaje: "Así llegarán los avisos de PQRS nuevas y de vencimiento: con radicado, prioridad, sede y fechas.\n\nPor confidencialidad no incluyen nombres, documentos ni la descripción del caso.",
    boton: { texto: "Abrir la plataforma", url: _urlPlataforma_("") } }));
  return { ok: true, mensaje: (chat ? "Mensaje enviado a Google Chat. " : "Google Chat sin configurar. ") + (destinos.length ? "Correo enviado a " + destinos.join(", ") + "." : "Sin destinatarios de correo.") };
}

// ---------------------------------------------------------------------------
// Proceso automático (disparador cada 5 minutos)
// ---------------------------------------------------------------------------
function procesarCorreoEntrante() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { ok: false, mensaje: "Ya hay un proceso en curso." };
  try {
    try { _procesarColaAvisos_(); } catch (e) { Logger.log("Cola: " + e); }
    return _procesarCorreo_();
  } finally { lock.releaseLock(); }
}
function apiProcesarCorreoAhora_() { return procesarCorreoEntrante(); }

function _procesarCorreo_() {
  var a = _ajustes_();
  var res = { ok: true, radicadas: 0, porClasificar: 0, citas: 0, revisar: 0, codigos: [] };
  if (!a.autoInstitucional && !a.autoUsuarios) { res.mensaje = "La radicación automática está apagada."; return res; }
  if (!a.desde) {   // primera ejecución: solo procesa lo que llegue de aquí en adelante
    a.desde = Date.now();
    PropertiesService.getScriptProperties().setProperty("AJUSTES", JSON.stringify(a));
  }
  var etqAuto = _etiqueta_("PQRS-Auto");
  var ctx = _contexto_(), entidades = _entidades_(), cats = _categorias_();
  var dominioPropio = (ctx.mios[0] || "").split("@")[1] || "";
  var hilos = GmailApp.search('in:inbox newer_than:3d -label:"PQRS-Auto" -label:"' + CFG.GMAIL_DESCARTADO + '" -label:"' + CFG.GMAIL_PROCESADO + '"', 0, 40);
  hilos.forEach(function (hilo) {
    var id = hilo.getId();
    if (ctx.hilos[id]) return;                          // ya gestionado a mano
    var msgs = hilo.getMessages(), m = null, rol = "";
    for (var i = 0; i < msgs.length && !m; i++) {
      rol = _rolMensaje_(msgs[i], ctx);
      if (rol === "usuario") m = msgs[i];
      else if (rol === "area") return;                  // hilo interno con un área
    }
    if (!m || ctx.yaRadicados[m.getId()]) return;
    if (a.desde && m.getDate().getTime() < a.desde) return;   // no toca lo anterior a la activación
    var de = _correoDe_(m), asunto = m.getSubject() || "", cuerpo = m.getPlainBody() || "";
    var ent = _entidadDe_(de.correo, entidades);
    if (!ent && dominioPropio && de.correo.split("@")[1] === dominioPropio) return;   // colegas de la institución

    if (ent) {
      if (!a.autoInstitucional) return;
      var cat = _categoriaCorreo_(asunto, cuerpo, cats);
      // v8: entes de control y despachos judiciales tienen una categoría por defecto (requerimiento, tutela)
      if (!cat && ent.categoria) cat = cats.filter(function (c) { return _norm(c.nombre) === _norm(ent.categoria); })[0] || null;
      if (!/eps/i.test(ent.tipo)) _traza("—", "Correo de ente de control", ent.entidad + " · " + Utilities.formatDate(m.getDate(), _tz_(), "dd/MM/yyyy HH:mm") +
        (cat ? " · " + cat.nombre : " · por clasificar"));
      var prioridad = cat ? cat.prioridad : ent.prioridad;
      if (cat) {
        var tipo = cat.tipo || _clasificarTipo_(asunto + "\n" + cuerpo, "").tipo || "Petición";
        var r = apiRadicarCorreo_(m.getId(), {
          tipoPqrs: _tipoEnLista_(tipo), descripcion: asunto + "\n\n" + cuerpo.substring(0, 45000), correo: de.correo,
          nombreSolicitante: ent.entidad, entidad: _normalizarValorLista_(ent.presentada, "ENTIDAD PRESENTADA").valor, eps: _epsDeEntidad_(ent.entidad), clasificacion: cat.nombre,
          observaciones: "Remitente institucional: " + ent.entidad + " (" + ent.tipo + ") · Prioridad " + prioridad,
          guardarAdjuntos: true, sinAcuse: true, automatico: true });
        if (r.ok) {
          res.radicadas++; res.codigos.push(r.codigo);
          if (a.acuseInstitucional) _acuseInstitucional_(m, r.codigo, ent, cat);
          _avisoNuevoCaso_(_filaDe(r.codigo), { entidad: ent.entidad, avisar: ent.avisar });
        }
      } else {
        if (a.acuseInstitucional) _acuseInstitucional_(m, "", ent, null);
        _guardarHilo_(id, { categoria: "institucional", estado: "Por clasificar", correoUsuario: de.correo, asunto: asunto, area: ent.entidad, accion: "Sin categoría detectada · prioridad " + prioridad });
        _avisoChat_("[POR CLASIFICAR] *Correo de " + ent.entidad + " sin clasificar*\nPendiente en Correo ▸ EPS y entes." + (_urlPlataforma_("") ? "\n<" + _urlPlataforma_("") + "|Abrir la plataforma>" : ""));
        var dest = _correosAviso_("", ent.avisar);
        if (dest.length) _enviar(dest.join(","), "[PQRS · por clasificar] Correo de " + ent.entidad, "Correo de " + ent.entidad + " pendiente de clasificar.",
          _correoHilo_({ interno: "AVISO INTERNO · CORREO DE " + ent.entidad.toUpperCase(), kicker: ent.tipo, titulo: "Correo de " + ent.entidad + " pendiente de clasificar",
            mensaje: "Llegó un correo de " + ent.entidad + " y no se identificó su categoría (riesgo vital, priorizado, simple, tutela o derecho de petición).\n\n" +
              "Clasifícalo y radícalo en la plataforma: Correo ▸ EPS y entes. Por confidencialidad, este aviso no incluye el asunto ni el contenido.",
            fechas: { recepcion: Utilities.formatDate(m.getDate(), _tz_(), "dd/MM/yyyy HH:mm") }, detalles: [["Entidad", ent.entidad], ["Prioridad", prioridad]],
            boton: { texto: "Abrir el correo en la plataforma", url: _urlPlataforma_("") } }));
        res.porClasificar++;
      }
      hilo.addLabel(etqAuto);
      return;
    }

    if (!a.autoUsuarios) return;
    var catU = _categoriaTexto_(asunto, cuerpo);
    if (catU === "cita") {
      if (a.citasAuto) {
        var citas = apiResponsables_().filter(function (x) { return x.activo && x.correo && /cita|agend|call/i.test(x.area); })[0];
        if (citas) { var d = apiDireccionarHilo_(id, { idResponsable: citas.id, modo: "reenviar", avisarUsuario: true, categoria: "cita", nota: "Direccionada automáticamente." }); if (d.ok) res.citas++; }
      }
      hilo.addLabel(etqAuto);
      return;
    }
    var fuerte = RE_PQRS_FUERTE.test(_norm(asunto + " " + cuerpo));
    if (catU !== "pqrs" || !fuerte) { res.revisar++; return; }   // queda en Correo para revisión manual
    var datos = _extraerDatos_(asunto + "\n" + cuerpo);
    var clas = _clasificarTipo_(asunto + "\n" + cuerpo, "");
    var faltan = [];
    if (!datos.numDocSolicitante) faltan.push("documento");
    if (!datos.telefono) faltan.push("celular");
    if (!datos.sede) faltan.push("sede");
    var dU = { tipoPqrs: _tipoEnLista_(clas.tipo || "Queja"), descripcion: asunto + "\n\n" + cuerpo.substring(0, 45000), correo: de.correo,
      nombreSolicitante: datos.nombreSolicitante || (de.nombre && de.nombre.indexOf("@") === -1 ? de.nombre : ""), entidad: entidadSedeLista_(),
      observaciones: faltan.length ? "[Datos incompletos: " + faltan.join(", ") + "]" : "", guardarAdjuntos: true, automatico: true };
    Object.keys(datos).forEach(function (k) { if (dU[k] === undefined || dU[k] === "") dU[k] = datos[k]; });
    var rU = apiRadicarCorreo_(m.getId(), dU);
    if (rU.ok) { res.radicadas++; res.codigos.push(rU.codigo); _avisoNuevoCaso_(_filaDe(rU.codigo), {}); hilo.addLabel(etqAuto); }
  });
  res.mensaje = "Radicadas: " + res.radicadas + " · por clasificar: " + res.porClasificar + " · citas direccionadas: " + res.citas + " · para revisar: " + res.revisar;
  return res;
}
function entidadSedeLista_() {
  var ops = _listasConfig_()["ENTIDAD PRESENTADA"] || [];
  for (var i = 0; i < ops.length; i++) if (_norm(ops[i]).indexOf("sede") === 0) return ops[i];
  return "SEDE";
}

/** Acuse de recibo al remitente institucional, en el mismo hilo. */
function _acuseInstitucional_(m, codigo, ent, cat) {
  var f = codigo ? _h(CFG.HOJA_DATOS).getRange(_filaDe(codigo), 1, 1, CFG.NCOL).getValues()[0] : null;
  var lineas = [];
  if (codigo) lineas.push("Radicado: " + codigo);
  lineas.push("Fecha de recepción: " + Utilities.formatDate(m.getDate(), _tz_(), "dd/MM/yyyy HH:mm"));
  if (cat) lineas.push("Clasificación: " + cat.nombre);
  if (f && f[C.FECHA_MAX - 1] instanceof Date) lineas.push("Fecha límite de respuesta: " + _fmt(f[C.FECHA_MAX - 1]));
  try {
    m.reply("Acuse de recibo " + (codigo || ""), _opcionesCorreo_({ htmlBody: _correoHilo_({
      titulo: "Acuse de recibo",
      mensaje: "Reciba un cordial saludo. MiRed Barranquilla IPS S.A.S. confirma la recepción de su comunicación, que fue " +
        (codigo ? "radicada y asignada para su gestión dentro del término correspondiente." : "registrada y será clasificada y radicada por la Oficina de Atención al Usuario."),
      lista: lineas, cierre: "Por favor conserve el número de radicado para cualquier seguimiento." }) }));
    if (codigo) {
      var fila = _filaDe(codigo);
      _h(CFG.HOJA_DATOS).getRange(fila, C.NOTIF_RECEPCION).setValue(new Date());
      _traza(codigo, "Acuse de recibo automático", "A " + ent.entidad + " en el mismo hilo");
    }
  } catch (e) { Logger.log("Acuse: " + e); }
}

// ---------------------------------------------------------------------------
// Alerta de meta interna (Tutela y Derecho de petición: 8 horas desde la recepción)
// ---------------------------------------------------------------------------
function revisarAlertas() {
  var cats = _categorias_(), metas = {};
  cats.forEach(function (c) { if (c.meta) metas[_norm(c.nombre)] = c; });
  var datos = _datos_();
  var props = PropertiesService.getScriptProperties(), enviados = {};
  try { enviados = JSON.parse(props.getProperty("ALERTAS_META") || "{}"); } catch (e) {}
  var ahora = Date.now(), alertas = [];
  datos.forEach(function (f) {
    var cod = f[C.CODIGO - 1], c = metas[_norm(f[C.CLASIF_INTERNA - 1])];
    if (!cod || !c) return;
    if (_norm(f[C.ESTADO - 1]).indexOf("cerrada") !== -1) return;
    var responder = /responder/i.test(c.alcance);
    if (!responder && f[C.CORREO_RESP - 1]) return;               // ya se direccionó
    var ini = _inicioHoras_(f), meta = c.meta * 3600000;
    // «Responder» (riesgo vital NNA): aviso a la mitad de la meta y al cumplirse; «Direccionar»: al cumplirse.
    var hitos = responder ? [0.5, 1] : [1];
    hitos.forEach(function (k) {
      var clave = cod + (k < 1 ? "|50" : "");
      if (enviados[clave] || ahora < ini + meta * k) return;
      enviados[clave] = ahora;
      alertas.push({ f: f, c: c, k: k });
    });
  });
  // limpieza: se olvidan las alertas de más de 90 días
  Object.keys(enviados).forEach(function (k) { if (ahora - enviados[k] > 90 * 86400000) delete enviados[k]; });
  props.setProperty("ALERTAS_META", JSON.stringify(enviados));
  if (!alertas.length) return { alertas: 0 };
  alertas.forEach(function (a) {
    var f = a.f, c = a.c, cod = f[C.CODIGO - 1];
    var responder = /responder/i.test(c.alcance);
    var queFalta = responder ? (f[C.CORREO_RESP - 1] ? "sin respuesta al usuario" : "sin direccionar ni responder") : "sin direccionar";
    var horas = a.k < 1 ? Math.round(c.meta * a.k * 10) / 10 : c.meta;
    var limite = _inicioHoras_(f) + c.meta * 3600000;
    _traza(cod, "Alerta de meta interna", (a.k < 1 ? "Mitad de la meta: " : "Superó ") + horas + " h " + queFalta + " · " + f[C.CLASIF_INTERNA - 1]);
    _avisoChat_(_lineaChat_(a.k < 1 ? "[ALERTA · MITAD DEL TÉRMINO]" : "[ALERTA]", cod,
      [f[C.CLASIF_INTERNA - 1], (a.k < 1 ? "van " : "más de ") + horas + " h " + queFalta, f[C.SEDE - 1]], responder ? "Límite " + _fmtHora_(limite) : "Vence " + _fmt(f[C.FECHA_MAX - 1])));
    var dest = _correosAviso_(f[C.SEDE - 1], []);
    if (f[C.CORREO_RESP - 1] && responder && _correoOk(f[C.CORREO_RESP - 1])) dest.push(String(f[C.CORREO_RESP - 1]).toLowerCase());
    if (dest.length) _enviar(dest.join(","), "[ALERTA PQRS] " + cod + " · " + f[C.CLASIF_INTERNA - 1] + " " + queFalta, cod,
      _correoHilo_({ interno: a.k < 1 ? "ALERTA · VA LA MITAD DEL TÉRMINO" : "ALERTA DE VENCIMIENTO", kicker: f[C.TIPO_PQRS - 1], codigo: cod,
        titulo: a.k < 1 ? "Quedan " + Math.round(c.meta * (1 - a.k) * 10) / 10 + " horas" : "Requiere atención inmediata",
        mensaje: "Esta " + String(f[C.CLASIF_INTERNA - 1] || "PQRS").toLowerCase() + " lleva " + horas + " horas " + queFalta + "." +
          (c.norma ? "\n\nNorma: " + c.norma + "." : "") + (responder ? "\n\nLímite para la respuesta de fondo: " + _fmtHora_(limite) + "." : ""),
        fechas: { hechos: _fmt(f[C.FECHA_PQRS - 1]), recepcion: _fmtHora_(_inicioHoras_(f)), radicacion: _fmt(f[C.FECHA_RADICACION - 1]), max: responder ? _fmtHora_(limite) : _fmt(f[C.FECHA_MAX - 1]) },
        detalles: [["Clasificación", f[C.CLASIF_INTERNA - 1]], ["Sede", f[C.SEDE - 1]], ["Área", f[C.RESPONSABLE - 1] || "Sin asignar"]],
        boton: { texto: f[C.CORREO_RESP - 1] ? "Ver el caso" : "Direccionar ahora", url: _urlPlataforma_(cod) } }));
  });
  return { alertas: alertas.length };
}

/** Fechas clave de un radicado para las notificaciones (hechos, recepción, radicación, vencimiento). */
function _fechasDe_(codigo) {
  if (!codigo) return {};
  try {
    var fila = _filaDe(codigo);
    if (fila < 0) return {};
    var f = _h(CFG.HOJA_DATOS).getRange(fila, 1, 1, CFG.NCOL).getValues()[0];
    return { hechos: _fmt(f[C.FECHA_PQRS - 1]), recepcion: _fmt(f[C.FECHA_RECEPCION - 1]), radicacion: _fmt(f[C.FECHA_RADICACION - 1]),
             max: _esFeli(f[C.TIPO_PQRS - 1]) ? "" : _fmt(f[C.FECHA_MAX - 1]) };
  } catch (e) { return {}; }
}

// =====================================================================================
// v7.1 · NOTIFICACIONES POR CORREO: diseño único, párrafos reales y confidencialidad
// =====================================================================================
/*
 * Todas las notificaciones (al usuario, a las áreas, a los técnicos y en los hilos de
 * Gmail) salen de _correoDiseno_. Reglas:
 *   · El texto se convierte en párrafos <p> con margen (Gmail y Outlook ignoran los saltos
 *     de línea y «white-space:pre-wrap»; por eso antes se veía todo pegado).
 *   · Todo texto que viene del usuario o de la hoja se escapa (no se inyecta HTML).
 *   · Los avisos a técnicos y a Google Chat NO llevan nombres, documentos ni la descripción:
 *     solo radicado, tipo, prioridad, sede y fechas, con un botón a la plataforma.
 *   · Las áreas sí reciben la descripción (la necesitan para gestionar), con la advertencia
 *     de confidencialidad (Ley 1581 de 2012 y reserva de la historia clínica).
 *   · Las felicitaciones tienen su propio diseño: agradecimiento al usuario y reconocimiento
 *     al equipo, sin términos ni vencimientos.
 */
var COLOR_TIPO = { queja: "#E20A31", reclamo: "#B98A00", peticion: "#006D93", sugerencia: "#00985A",
                   felicitacion: "#8455B8", tutela: "#3D5FA8", denuncia: "#B4531A" };
var FONDO_TIPO = { queja: "#FDEBEE", reclamo: "#FBF4DF", peticion: "#E5F1F6", sugerencia: "#E3F4EC",
                   felicitacion: "#F2ECFA", tutela: "#E9EDF7", denuncia: "#F9ECE4" };
function _claveTipo_(t) {
  var k = _norm(t).replace(/[^a-z]/g, "");
  for (var c in COLOR_TIPO) if (k.indexOf(c) === 0) return c;
  return "";
}
function _colorTipo_(t) { return COLOR_TIPO[_claveTipo_(t)] || "#006081"; }
function _fondoTipo_(t) { return FONDO_TIPO[_claveTipo_(t)] || "#E5F1F6"; }

/** Texto plano → párrafos HTML: escapa, separa por líneas en blanco y respeta los saltos simples. */
function _parrafos_(t, estilo) {
  t = String(t === null || t === undefined ? "" : t).replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").trim();
  if (!t) return "";
  return t.split(/\n\s*\n+/).map(function (p) {
    return '<p style="margin:0 0 14px 0;' + (estilo || "") + '">' + _html_(p.trim()).replace(/\n/g, "<br/>") + '</p>';
  }).join("");
}
/** Mensajes redactados por el sistema (traen <b> y <br>): los <br><br> y \n\n se vuelven párrafos. */
function _parrafosHtml_(h, estilo) {
  h = String(h || "").replace(/\r\n?/g, "\n").replace(/(<br\s*\/?>\s*){2,}/gi, "\n\n").trim();
  if (!h) return "";
  return h.split(/\n\s*\n+/).map(function (p) {
    return '<p style="margin:0 0 14px 0;' + (estilo || "") + '">' + p.trim().replace(/\n/g, "<br/>") + '</p>';
  }).join("");
}

/** Dirección de la plataforma (con el radicado para abrirlo directo). Vacío si no hay implementación. */
function _urlPlataforma_(codigo) {
  var u = _urlBase_();
  return u ? u + (codigo ? "?pqrs=" + encodeURIComponent(codigo) : "") : "";
}
/**
 * v9.1 · Enlace /exec que se comparte (invitaciones, correos, Chat).
 * ScriptApp.getService().getUrl() puede devolver una implementación ARCHIVADA: quien la abre ve
 * «No se pudo abrir el archivo en este momento». Por eso manda, en este orden:
 * 1) la propiedad del proyecto URL_PLATAFORMA (Configuración del proyecto ▸ Propiedades de la secuencia de comandos),
 * 2) URL_PLATAFORMA_DEFECTO (la implementación activa al publicar esta versión), 3) getService().getUrl().
 */
var URL_PLATAFORMA_DEFECTO = "https://script.google.com/macros/s/AKfycbz23uMhiBQt0nU5Mr90Xoi5aJWaCcxNsNPZ0-82p1GUMy-aP4KpEU2ado-81QeqpnSJ/exec";
function _urlBase_() {
  var p = "";
  try { p = String(PropertiesService.getScriptProperties().getProperty("URL_PLATAFORMA") || "").trim(); } catch (e) {}
  if (/^https:\/\/script\.google\.com\/.+\/exec$/.test(p)) return p;
  if (URL_PLATAFORMA_DEFECTO) return URL_PLATAFORMA_DEFECTO;
  try { return ScriptApp.getService().getUrl() || ""; } catch (e) { return ""; }
}

function _textoConfidencial_(interno) {
  var siau = _param(3) || "siau@miredips.org";
  return interno
    ? "<b>Información confidencial.</b> Este mensaje contiene datos personales y de salud protegidos por la Ley 1581 de 2012 y por la reserva " +
      "de la historia clínica (Ley 23 de 1981 y Resolución 1995 de 1999). Úselo solo para gestionar esta PQRS: no lo reenvíe, no lo imprima " +
      "ni lo comparta fuera del proceso. Si lo recibió por error, avise a " + siau + " y elimínelo."
    : "<b>Protección de sus datos.</b> MiRed Barranquilla IPS S.A.S. trata sus datos personales y de salud solo para radicar, gestionar y responder su solicitud " +
      "(Ley 1581 de 2012, Decreto 1377 de 2013 compilado en el Decreto 1074 de 2015, y reserva de la historia clínica). Usted puede conocer, actualizar, rectificar " +
      "o suprimir sus datos y revocar la autorización escribiendo a " + siau + (_param(10) ? " · Política de tratamiento: " + _html_(_param(10)) : "") + ". " +
      "Este mensaje es exclusivo para el titular; si lo recibió por error, avísenos y elimínelo. MiRed IPS nunca le pedirá contraseñas ni pagos por este medio.";
}

/**
 * Plantilla base de todas las notificaciones.
 * o = { variante: "usuario" | "interno" | "felicitacion" | "reconocimiento",
 *       etiqueta, banda, kicker, titulo, codigo, estado (barra de avance), mensajeHtml,
 *       fechas: {hechos, recepcion, radicacion, max}, detalles: [[k, v], ...],
 *       bloques: [{titulo, html, color}], cita: {texto, autor}, lista: [], boton: {texto, url} }
 */
function _correoDiseno_(o) {
  var interno = o.variante === "interno" || o.variante === "reconocimiento";
  var feliz = o.variante === "felicitacion" || o.variante === "reconocimiento";
  var acento = feliz ? "#8455B8" : (interno ? "#B98A00" : "#006081");
  var colorK = o.kicker ? _colorTipo_(o.kicker) : acento;
  var P = 'font-family:' + FF + ';';
  var etiqueta = o.etiqueta || (interno ? "Uso interno · Confidencial" : "Atención al usuario");

  // Cabecera: logo + etiqueta, franja de marca
  var cab =
    '<tr><td style="padding:22px 30px 16px 30px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
      '<td valign="middle"><img src="cid:logoNiRed" width="118" alt="MiRed IPS" style="display:block;border:0;"/></td>' +
      '<td align="right" valign="middle"><span style="display:inline-block;' + P + 'font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;' +
        'color:' + (feliz ? "#6A3FA0" : (interno ? "#8A6400" : "#00475F")) + ';background:' + (feliz ? "#F2ECFA" : (interno ? "#FBF1D2" : "#E5F1F6")) +
        ';border-radius:99px;padding:5px 11px;">' + (interno ? "&#128274;&nbsp;" : "") + _html_(etiqueta) + '</span></td>' +
    '</tr></table></td></tr>' +
    '<tr><td style="font-size:0;line-height:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
      '<td style="height:4px;background:' + acento + ';width:64%;"></td><td style="height:4px;background:#E20A31;width:12%;"></td>' +
      '<td style="height:4px;background:#FEDC00;width:12%;"></td><td style="height:4px;background:#009C4D;width:12%;"></td></tr></table></td></tr>' +
    (o.banda ? '<tr><td style="background:' + (feliz ? "#F2ECFA" : "#FBF3DC") + ';padding:9px 30px;' + P + 'font-weight:700;font-size:11px;color:' +
      (feliz ? "#6A3FA0" : "#8A6400") + ';letter-spacing:.05em;">' + _html_(o.banda) + '</td></tr>' : '');

  // Encabezado del mensaje
  var kicker = o.kicker
    ? '<div style="' + P + 'font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:' + colorK + ';margin-bottom:8px;">' +
      '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + colorK + ';margin-right:6px;vertical-align:1px;"></span>' + _html_(o.kicker) + '</div>'
    : '';
  var icono = o.mascota
    ? '<img src="cid:mascotaSiau" width="92" alt="SIAU MiRed IPS" style="display:block;border:0;margin:0 0 10px 0;"/>'
    : feliz
    ? '<div style="width:52px;height:52px;border-radius:50%;background:#F2ECFA;text-align:center;line-height:52px;font-size:26px;color:#8455B8;margin-bottom:14px;">&#9733;</div>'
    : '';
  var rad = o.codigo
    ? '<div style="' + P + 'font-size:12px;color:#6B7F89;margin-top:10px;">Radicado&nbsp; <span style="display:inline-block;background:#E3EFF4;color:#00475F;' +
      'font-family:Consolas,\'SF Mono\',Menlo,monospace;font-weight:700;font-size:12.5px;padding:3px 9px;border-radius:6px;">' + _html_(o.codigo) + '</span></div>'
    : '';
  var titulo = '<div style="font-family:' + FT + ';font-weight:900;font-size:22px;line-height:1.25;color:' + (feliz ? "#4B2A78" : "#00475F") + ';">' + _html_(o.titulo || "") + '</div>';

  // Fechas clave (2 × 2)
  var fx = o.fechas || {};
  var celdas = [["Fecha de los hechos", fx.hechos], ["Fecha de recepción", fx.recepcion], ["Fecha de radicación", fx.radicacion],
                [interno ? "Vence" : "Fecha límite de respuesta", feliz ? "" : fx.max]].filter(function (c) { return c[1]; });
  var fechas = "";
  if (celdas.length) {
    var filas = [];
    for (var i = 0; i < celdas.length; i += 2) {
      filas.push('<tr>' + [celdas[i], celdas[i + 1]].map(function (c) {
        if (!c) return '<td width="50%" style="padding:5px;"></td>';
        var vence = /Vence|límite/.test(c[0]);
        return '<td width="50%" style="padding:5px;" valign="top"><div style="background:' + (vence ? (interno ? "#FDECEF" : "#E5F1F6") : "#F6F9FA") +
          ';border:1px solid ' + (vence ? (interno ? "#F5C6D0" : "#C9E0EA") : "#E3EBEF") + ';border-radius:10px;padding:10px 13px;">' +
          '<div style="' + P + 'font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:' + (vence && interno ? "#AB1130" : "#6B7F89") + ';">' + c[0] + '</div>' +
          '<div style="' + P + 'font-size:15px;font-weight:700;color:' + (vence && interno ? "#AB1130" : "#13212A") + ';margin-top:3px;">' + _html_(c[1]) + '</div></div></td>';
      }).join("") + '</tr>');
    }
    fechas = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 4px;">' + filas.join("") + '</table>';
  }

  // Detalles
  var det = (o.detalles || []).filter(function (d) { return d[1] || d[1] === 0; });
  var detalles = det.length
    ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;border:1px solid #E6EDF0;border-radius:10px;border-collapse:separate;">' +
      det.map(function (d, j) {
        var borde = j < det.length - 1 ? "border-bottom:1px solid #EEF2F4;" : "";
        return '<tr><td style="padding:9px 14px;' + borde + P + 'font-size:12px;color:#6B7F89;white-space:nowrap;width:38%;" valign="top">' + d[0] + '</td>' +
          '<td style="padding:9px 14px;' + borde + P + 'font-size:13px;font-weight:600;color:#13212A;">' + _html_(d[1]) + '</td></tr>';
      }).join("") + '</table>'
    : '';

  // Cita (palabras del usuario en una felicitación, mensaje original en un reenvío)
  var cita = o.cita && o.cita.texto
    ? '<div style="margin-top:18px;background:' + (feliz ? "#F7F3FC" : "#F6F9FA") + ';border-radius:12px;padding:18px 20px 6px;border-left:4px solid ' + (feliz ? "#8455B8" : "#94A3AB") + ';">' +
      (feliz ? '<div style="font-family:Georgia,serif;font-size:40px;line-height:20px;color:#C8B3E6;height:22px;">&ldquo;</div>' : '') +
      (o.cita.autor ? '<div style="' + P + 'font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#6B7F89;margin-bottom:8px;">' + _html_(o.cita.autor) + '</div>' : '') +
      _parrafos_(o.cita.texto, P + 'font-size:14px;line-height:1.7;color:#3B4A52;' + (feliz ? 'font-style:italic;' : '')) + '</div>'
    : '';

  // Bloques de contenido (descripción, indicaciones, respuesta)
  var bloques = (o.bloques || []).filter(function (b) { return b && b.html; }).map(function (b) {
    return '<div style="margin-top:20px;"><div style="font-family:' + FT + ';font-weight:900;font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:#00475F;margin-bottom:8px;">' +
      _html_(b.titulo) + '</div><div style="background:#F6F9FA;border-left:3px solid ' + (b.color || "#94A3AB") + ';border-radius:0 10px 10px 0;padding:14px 16px 2px;">' +
      b.html + '</div></div>';
  }).join("");

  var lista = (o.lista && o.lista.length)
    ? '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 14px;">' + o.lista.map(function (x) {
        return '<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:' + acento + ';' + P + 'font-size:14px;">&#9679;</td>' +
               '<td style="padding:4px 0;' + P + 'font-size:14px;line-height:1.6;color:#2B3A42;">' + _html_(x) + '</td></tr>';
      }).join("") + '</table>' : '';

  var boton = o.boton && o.boton.url
    ? '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 4px;"><tr><td style="background:' + (feliz ? "#6A3FA0" : "#006081") + ';border-radius:10px;">' +
      '<a href="' + _html_(o.boton.url) + '" style="display:inline-block;padding:12px 22px;' + P + 'font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">' +
      _html_(o.boton.texto || "Abrir en la plataforma") + ' &rarr;</a></td></tr></table>'
    : '';

  var contacto = interno
    ? '<b style="color:#4C626D;">Oficina de Atención al Usuario (SIAU)</b> · MiRed Barranquilla IPS S.A.S.'
    : '<b style="color:#4C626D;">Oficina de Atención al Usuario (SIAU)</b> · MiRed Barranquilla IPS S.A.S.<br/>' +
      _html_(_param(3) || "siau@miredips.org") + (_param(4) ? ' &nbsp;·&nbsp; ' + _html_(_param(4)) : '') + (_param(5) ? ' &nbsp;·&nbsp; WhatsApp ' + _html_(_param(5)) : '');

  return '' +
  '<div style="background:#EEF3F5;padding:28px 12px;' + P + '">' +
   '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #DDE6EA;">' +
     cab +
     '<tr><td style="padding:28px 30px 6px 30px;">' +
       icono + kicker + titulo + rad +
       (o.estado ? _progreso(o.estado) : '') +
       '<div style="' + P + 'font-size:14.5px;line-height:1.7;color:#2B3A42;margin-top:18px;">' + (o.mensajeHtml || "") + lista + (o.cierreHtml || "") + '</div>' +
       cita + fechas + detalles + bloques + boton +
     '</td></tr>' +
     '<tr><td style="padding:22px 30px 26px 30px;">' +
       '<div style="background:' + (interno ? "#FFF8E6" : "#F4F7F8") + ';border:1px solid ' + (interno ? "#F1DFA8" : "#E3EBEF") + ';border-radius:10px;padding:11px 14px;' +
         P + 'font-size:11px;line-height:1.6;color:' + (interno ? "#6B5415" : "#6B7F89") + ';">' + (interno ? "&#128274; " : "") + _textoConfidencial_(interno) + '</div>' +
       '<div style="' + P + 'font-size:11px;line-height:1.7;color:#8398A3;margin-top:14px;">' + contacto + '<br/>' + MARCA_SISTEMA + '.</div>' +
     '</td></tr>' +
    '</table></td></tr></table></div>';
}

/** Compatibilidad: plantilla de radicado (acuse, gestión, respuesta, recordatorios). */
function _plantilla(o) {
  var fx = _fechasDe_(o.codigo) || {};
  var feli = _esFeli(o.tipo);
  var variante = o.reconocimiento ? "reconocimiento" : (o.interno ? "interno" : (feli ? "felicitacion" : "usuario"));
  var fechas = { hechos: o.fechaHechos || fx.hechos, recepcion: o.fechaRecepcion || fx.recepcion,
                 radicacion: o.fechaRadicacion || fx.radicacion, max: feli ? "" : (o.fechaMax || fx.max) };
  var detalles = [["Estado", feli && !o.interno ? "" : o.estado]].concat(o.extraDetalles || []).concat([["Sede", o.sede], ["Servicio", o.servicio]]);
  if (o.interno && !o.reconocimiento) detalles = detalles.concat([["Días transcurridos", o.dias], ["Solicitante", o.solicitante],
    ["Documento", o.documento], ["Contacto", o.contacto], ["Área responsable", o.responsable]]);
  if (o.reconocimiento) detalles = detalles.concat([["Área", o.responsable]]);
  var PB = 'font-family:' + FF + ';font-size:13.5px;line-height:1.7;color:#2B3A42;';
  var bloques = [];
  if (!feli) bloques.push({ titulo: o.interno ? "Descripción de la PQRS" : "Su mensaje", html: _parrafos_(o.descripcion, PB), color: "#94A3AB" });
  bloques.push({ titulo: "Indicaciones del SIAU", html: _parrafos_(o.gestion, PB), color: "#B98A00" });
  bloques.push({ titulo: feli && !o.interno ? "Mensaje de la institución" : "Respuesta de la institución", html: _parrafos_(o.respuesta, PB), color: feli ? "#8455B8" : "#006081" });
  return _correoDiseno_({
    variante: variante,
    etiqueta: o.reconocimiento ? "Reconocimiento · Uso interno" : (o.interno ? "Solicitud interna · Confidencial" : (feli ? "Felicitación" : "Atención al usuario")),
    banda: o.reconocimiento ? "RECONOCIMIENTO DE UN USUARIO A SU EQUIPO" : (o.interno ? "SOLICITUD INTERNA DE GESTIÓN · NO REENVIAR AL USUARIO" : ""),
    kicker: o.tipo || "", titulo: o.titulo, codigo: o.codigo,
    estado: (o.sinProgreso || feli) ? "" : o.estado,
    mensajeHtml: _parrafosHtml_(o.mensaje),
    fechas: fechas, detalles: detalles, bloques: bloques,
    cita: feli && o.descripcion ? { texto: o.descripcion, autor: o.interno ? "Palabras del usuario" : "Sus palabras" } : null,
    boton: o.boton || null,
    mascota: feli && !o.interno && !!o.extraDetalles && !!MASCOTA_BASE64,
  });
}

/** Compatibilidad: correos cortos en el mismo hilo de Gmail (acuses, solicitudes de datos, reenvíos). */
function _correoHilo_(o) {
  var PB = 'font-family:' + FF + ';font-size:14.5px;line-height:1.7;color:#2B3A42;';
  var interno = !!o.interno;
  return _correoDiseno_({
    variante: o.variante || (interno ? "interno" : "usuario"),
    etiqueta: o.etiqueta || (interno ? "Uso interno · Confidencial" : "Atención al usuario"),
    banda: interno ? o.interno : "",
    kicker: o.kicker || "", titulo: o.titulo || "", codigo: o.codigo || "",
    mensajeHtml: _parrafos_(o.mensaje, PB),
    lista: o.lista || [],
    fechas: o.fechas || null, detalles: o.detalles || [],
    cierreHtml: _parrafos_(o.cierre, PB),
    cita: o.cita ? { texto: o.cita, autor: o.citaTitulo || "Mensaje original" } : null,
    boton: o.boton || null,
  });
}

// =====================================================================================
// v8 · PRIORIZACIÓN POR RIESGO (Circulares Supersalud 2023151000000010-5 y 2026151000000007-5)
// =====================================================================================
/*
 * Lee la manifestación (de cualquier canal) y los datos del usuario, y decide si es:
 *   Vital NNA  → riesgo vital en niñas, niños o adolescentes: respuesta de fondo en 8 horas (Circular 2026).
 *   Vital      → riesgo inminente para la vida o la integridad: 24 horas (Circular 2023).
 *   Priorizado → sujeto de especial protección (NNA, gestante, persona mayor, discapacidad, víctima,
 *                cáncer, VIH, trasplante, enfermedad huérfana o de alto costo) con una barrera de acceso
 *                o signos de alarma: 48 horas.
 * Es explicable: guarda las señales que encontró. Nunca baja una prioridad ya asignada y respeta las
 * categorías legales (tutela, derecho de petición, requerimiento de ente de control), a las que solo
 * les anota el nivel de riesgo. El técnico o el administrador pueden corregirlo en el detalle.
 */
var RANGO_NIVEL = { "vital nna": 4, "vital": 3, "tutela": 3, "priorizado": 2, "simple": 1 };
var CAT_POR_NIVEL = { "Vital NNA": "RIESGO VITAL NNA · 8 H", "Vital": "RIESGO VITAL · 24 H", "Priorizado": "RIESGO PRIORIZADO · 48 H" };
var HORAS_NIVEL = { "Vital NNA": 8, "Vital": 24, "Priorizado": 48, "Simple": 72 };
var CATS_LEGALES = /^(tutela|derecho de peticion|requerimiento ente de control)/;

var SENALES_VITAL = [
  [/riesgo vital|urgencia vital|peligr\w* (de |su |la )?vida|riesgo (para|de) (su |la |mi )?vida|se (esta|va a|nos va a) mori|se nos muere|puede morir|a punto de morir|se me muere/, 4, "riesgo para la vida"],
  [/suicid|quitarse la vida|autolesi|hacerse dano/, 4, "riesgo suicida"],
  [/no respira|dificultad (para|al) respirar|se (esta )?ahoga|asfixi|sin oxigeno|falta de oxigeno|saturando (bajo|mal)|saturacion baja/, 3, "dificultad respiratoria u oxígeno"],
  [/convulsi/, 3, "convulsiones"],
  [/hemorragi|sangrado (abundante|profuso|severo|activo|fuerte)|sangrando mucho|vomit\w* sangre|perdiendo mucha sangre/, 3, "sangrado importante"],
  [/infarto|dolor (en el|de|del) pecho|paro (cardiaco|cardiorrespiratorio|respiratorio)|accidente cerebro|derrame cerebral|\bacv\b/, 3, "evento cardiovascular o cerebral"],
  [/inconscien|perdio el conocimiento|perdida (del|de) conocimiento|no reacciona|se desmayo (y|varias)|desmayos? (repetid|varias)/, 3, "pérdida de conciencia"],
  [/desmay/, 2, "desmayo"],
  [/(sin|no (le|me|nos) (han )?(entregad|entrega|dad|dan|aplicad|aplican|autoriz)\w*|suspendi\w*|interrumpi\w*|no (hay|tienen)|falta de)\s.{0,50}(insulina|quimio|dialisis|hemodialisis|oxigeno|antirretrovir|anticoagul|inmunosupres|radioterapia)/, 3, "tratamiento vital interrumpido"],
  [/(insulina|quimio|dialisis|hemodialisis|antirretrovir|radioterapia).{0,50}(no (me|le|nos) (han )?(entregad|dad|aplicad|autoriz)|suspendi|sin entrega|interrumpi)/, 3, "tratamiento vital interrumpido"],
  [/embaraz.{0,60}(sangr|no (se|lo) (siente|mueve)|dolor fuerte|contracciones)|sangr.{0,40}embaraz|preeclampsia|eclampsia|trabajo de parto/, 3, "gestante con signos de alarma"],
  [/(remision|traslado|\buci\b|cuidado intensivo|cama).{0,50}(no (hay|le dan|la dan|han|lo)|negad|pendiente|esperando|sin respuesta)|(no (hay|le dan|la dan|han)|negad|pendiente|esperando).{0,50}(remision|traslado|\buci\b|cuidado intensivo)/, 2, "remisión o UCI pendiente"],
  [/estado (critico|grave|delicado)|muy grave|grave estado|deterioro|empeorando|cada vez peor/, 2, "estado grave o deterioro"],
  [/dolor (extremo|insoportable|muy fuerte|intenso|severo)|grit\w* de dolor|retorciendose/, 2, "dolor extremo"],
  [/deshidrat|desnutricion (severa|aguda)|no (ha )?come desde|fiebre (muy alta|alta|de (39|40|41))/, 1, "signos de alarma"],
];
var POBLACIONES = [
  ["NNA", /\b(mi|su|el|la|un|una|del|de la|nuestr[oa]) (hij[oa]|bebe|nin[oa]|menor|niet[oa]|recien nacid[oa]|sobrin[oa])\b|\bneonat|\blactante|\binfante|\badolescente|\bmenor de edad|\bnin[oa]s?\b|\bbebes?\b/],
  ["Gestante", /embarazad|gestante|\bembarazo|prenatal|semanas de gestacion|materna/],
  ["Persona mayor", /adulto mayor|adultos mayores|tercera edad|ancian|persona mayor/],
  ["Discapacidad", /discapacidad|silla de ruedas|invidente|\bciego|\bsord[oa]|lengua de senas|interprete de senas/],
  ["Víctima del conflicto", /victima del conflicto|desplazad[oa] por|\bvictima de (la )?violencia/],
  ["Cáncer", /cancer|oncolog|quimioterapia|radioterapia|tumor|leucemia|linfoma/],
  ["VIH", /\bvih\b|\bsida\b|antirretrovir/],
  ["Enfermedad huérfana", /enfermedad (huerfana|rara)|hemofilia/],
  ["Trasplante", /trasplant/],
  ["Alto costo", /dialisis|renal cronic|insuficiencia renal|artritis reumatoide|esclerosis/],
];
var RE_BARRERA = /(no (me|le|nos|la|lo) (han )?(quieren )?(entregan|entregaron|entregado|autoriz\w*|asignan|asignaron|programan|programaron|realizan|realizaron|atienden|atendieron|dan|dieron|han dado))|negaron|niegan|sin cita|no hay (agenda|citas|medicamento|cama)|cancelaron (la |mi |su )?(cita|cirugia|procedimiento)|reprogram|demora en (la )?(entrega|autorizacion|cita|cirugia|atencion)|(dias|semanas|meses) (esperando|sin)|pendiente (de |la )?(autorizacion|cirugia|cita|entrega)|horas esperando|no me han llamado/;

function _edadNum_(v) {
  if (typeof v === "number" && isFinite(v)) return v;
  var m = /(\d{1,3})\s*(mes|meses)/i.exec(String(v || ""));
  if (m) return 0;
  m = /(\d{1,3})/.exec(String(v || ""));
  return m ? parseInt(m[1], 10) : null;
}
function _nivelDeCategoria_(nombre, cats) {
  var n = _norm(nombre); if (!n) return "";
  var c = (cats || CATS_CACHE || (CATS_CACHE = _categorias_())).filter(function (x) { return _norm(x.nombre) === n; })[0];
  if (c && c.nivel) return c.nivel;
  if (/vital/.test(n) && /nna|nino|menor/.test(n)) return "Vital NNA";
  if (/vital/.test(n)) return "Vital";
  if (/priorizad/.test(n)) return "Priorizado";
  if (/simple/.test(n)) return "Simple";
  if (/tutela/.test(n)) return "Tutela";
  return "";
}
function _rango_(nivel) { return RANGO_NIVEL[_norm(nivel)] || 0; }

/** Evalúa una fila (arreglo) sin escribir nada. */
function _evaluarRiesgo_(f, cats) {
  var r = { nivel: "", categoria: "", razones: [], poblacion: [], puntos: 0, horas: 0 };
  var tipo = f[C.TIPO_PQRS - 1];
  if (_esFeli(tipo)) return r;
  var t = " " + _norm([f[C.DESCRIPCION - 1], f[C.OBSERVACIONES - 1] && String(f[C.OBSERVACIONES - 1]).replace(/\[[^\]]*\]/g, "")].join(" "))
            .replace(/[^a-z0-9ñ ]/g, " ").replace(/\s+/g, " ") + " ";
  SENALES_VITAL.forEach(function (s) { if (s[0].test(t)) { r.puntos += s[1]; if (r.razones.indexOf(s[2]) === -1) r.razones.push(s[2]); } });
  var edad = _edadNum_(f[C.EDAD - 1]);
  var docs = _norm(f[C.TIPO_DOC_SOL - 1] + " " + f[C.TIPO_DOC_AFI - 1]);
  var pobl = _norm(f[C.POBLACION - 1]), serv = _norm(f[C.SERVICIO - 1] + " " + f[C.SERVICIO_ESP - 1]);
  var agregar = function (p) { if (r.poblacion.indexOf(p) === -1) r.poblacion.push(p); };
  if ((edad !== null && edad < 18) || /tarjeta de identidad|registro civil|nacido vivo|\bti\b|\brc\b/.test(docs) || /menor/.test(pobl) || /neonat|pediatr/.test(serv)) agregar("NNA");
  if (edad !== null && edad >= 60) agregar("Persona mayor");
  if (/gestante/.test(pobl)) agregar("Gestante");
  if (/adulto mayor|persona mayor/.test(pobl)) agregar("Persona mayor");
  if (/discapacidad/.test(pobl)) agregar("Discapacidad");
  if (/victima/.test(pobl)) agregar("Víctima del conflicto");
  POBLACIONES.forEach(function (p) { if (p[1].test(t)) agregar(p[0]); });
  var barrera = RE_BARRERA.test(t);
  var actual = _nivelDeCategoria_(f[C.CLASIF_INTERNA - 1], cats);
  var nna = r.poblacion.indexOf("NNA") !== -1;
  if (r.puntos >= 3 || actual === "Vital") r.nivel = nna ? "Vital NNA" : "Vital";
  else if (r.poblacion.length && (barrera || r.puntos >= 2)) r.nivel = "Priorizado";
  if (barrera && r.nivel) r.razones.push("barrera de acceso");
  if (actual && _rango_(actual) > _rango_(r.nivel)) { r.nivel = actual === "Tutela" ? r.nivel : actual; }
  r.categoria = CAT_POR_NIVEL[r.nivel] || "";
  r.horas = HORAS_NIVEL[r.nivel] || 0;
  return r;
}

/**
 * Evalúa y guarda el riesgo de una fila. modo "auto" aplica la categoría (y con ella el término);
 * "sugerir" solo anota el nivel. Devuelve el resultado con «aplicado» = true si cambió la categoría.
 */
function _evaluarPrioridadFila_(fila, modo, f, cats) {
  var h = _h(CFG.HOJA_DATOS);
  f = f || h.getRange(fila, 1, 1, CFG.NCOL).getValues()[0];
  if (!f[C.CODIGO - 1] || _esFeli(f[C.TIPO_PQRS - 1])) return { nivel: "" };
  if (_norm(f[C.ESTADO - 1]).indexOf("cerrada") !== -1) return { nivel: "" };
  if (/\[Riesgo manual:/.test(String(f[C.OBSERVACIONES - 1] || ""))) return { nivel: _nivelDeCategoria_(f[C.CLASIF_INTERNA - 1], cats), manual: true };
  var r = _evaluarRiesgo_(f, cats);
  var texto = r.nivel ? r.nivel + (r.horas ? " · " + r.horas + " h" : "") : "";
  var pobl = r.poblacion.join("; ");
  if (String(f[C.NIVEL_RIESGO - 1] || "") !== texto) h.getRange(fila, C.NIVEL_RIESGO).setValue(texto);
  if (String(f[C.POBLACION_PRIORIZADA - 1] || "") !== pobl) h.getRange(fila, C.POBLACION_PRIORIZADA).setValue(pobl);
  if (!r.nivel) return r;
  var actual = _nivelDeCategoria_(f[C.CLASIF_INTERNA - 1], cats);
  var legal = CATS_LEGALES.test(_norm(f[C.CLASIF_INTERNA - 1]));
  if (modo === "auto" && r.categoria && !legal && _rango_(r.nivel) > _rango_(actual)) {
    h.getRange(fila, C.CLASIF_INTERNA).setValue(r.categoria);
    var obs = String(f[C.OBSERVACIONES - 1] || "").replace(/\s*\[Riesgo: [^\]]*\]/g, "");
    h.getRange(fila, C.OBSERVACIONES).setValue((obs ? obs + " " : "") + "[Riesgo: " + r.nivel + " · " + r.razones.slice(0, 4).join(", ") + "]");
    _traza(f[C.CODIGO - 1], "Priorizada por riesgo", r.categoria + " · señales: " + r.razones.join(", ") +
      (r.poblacion.length ? " · población: " + pobl : "") + " · " + (_nivelNorma_(r.nivel)));
    r.aplicado = true;
  }
  return r;
}
function _nivelNorma_(nivel) {
  return nivel === "Vital NNA" ? "Circular Externa Supersalud 2026151000000007-5 de 2026 (8 horas)"
    : "Circular Externa Supersalud 2023151000000010-5 de 2023 (" + (HORAS_NIVEL[nivel] || "") + " horas)";
}

/** Todo lo que se hace después de escribir una radicación nueva, sea cual sea el canal. */
function _postRadicacion_(fila, modoTipo) {
  var out = { codigo: "" };
  SpreadsheetApp.flush();
  out.tipo = _aplicarClasificador_(fila, modoTipo);
  if (out.tipo && out.tipo.codigo) out.codigo = out.tipo.codigo;
  SpreadsheetApp.flush();
  try {
    out.riesgo = _evaluarPrioridadFila_(fila, "auto");
    if (out.riesgo && out.riesgo.aplicado) { SpreadsheetApp.flush(); _alertaPrioritaria_(fila, out.riesgo); }
  } catch (e) { Logger.log("Riesgo: " + e); }
  try {
    var f = _h(CFG.HOJA_DATOS).getRange(fila, 1, 1, CFG.NCOL).getValues()[0];
    out.areas = _sugerirArea_(f);
    _h(CFG.HOJA_DATOS).getRange(fila, C.AREA_SUGERIDA).setValue(out.areas.length ? out.areas[0].area : "");
  } catch (e) { Logger.log("Área: " + e); out.areas = []; }
  return out;
}

/** Aviso inmediato de un caso priorizado (Chat, correo y alarma en la plataforma). Sin datos personales. */
function _alertaPrioritaria_(fila, r) {
  var f = _h(CFG.HOJA_DATOS).getRange(fila, 1, 1, CFG.NCOL).getValues()[0];
  var cod = f[C.CODIGO - 1];
  var limite = _limiteHoras_(f, r.nivel);
  var etq = r.nivel === "Vital NNA" ? "[RIESGO VITAL NNA · 8 H]" : r.nivel === "Vital" ? "[RIESGO VITAL · 24 H]" : "[PRIORIZADA · 48 H]";
  _traza(cod, "Alerta de riesgo", r.nivel + " · responder antes de " + _fmtHora_(limite) + " · " + (r.poblacion.join(", ") || "sin población especial"));
  _avisoChat_(_lineaChat_(etq, cod, [f[C.TIPO_PQRS - 1], f[C.SEDE - 1], r.razones.slice(0, 3).join(", ")], "Responder antes de " + _fmtHora_(limite)));
  var dest = _correosAviso_(f[C.SEDE - 1], []);
  if (!dest.length) return;
  _enviar(dest.join(","), etq + " " + cod + " · requiere gestión inmediata", "PQRS " + cod + " priorizada: " + r.nivel,
    _correoHilo_({ interno: "ALERTA · " + (r.nivel === "Priorizado" ? "PQRS PRIORIZADA" : "RIESGO VITAL") + " · " + _nivelNorma_(r.nivel).toUpperCase(),
      kicker: f[C.TIPO_PQRS - 1], codigo: cod,
      titulo: r.nivel === "Vital NNA" ? "Riesgo vital en una niña, niño o adolescente" : r.nivel === "Vital" ? "PQRS con riesgo vital" : "PQRS priorizada (sujeto de especial protección)",
      mensaje: "La plataforma identificó esta PQRS como «" + r.nivel + "» y le asignó el término de " + r.horas + " horas (" + _nivelNorma_(r.nivel) + ").\n\n" +
        "Señales: " + r.razones.join(", ") + (r.poblacion.length ? ".\nPoblación: " + r.poblacion.join(", ") + "." : ".") +
        "\n\nDirecciónala de inmediato al área responsable. Por confidencialidad, este aviso no incluye datos del usuario ni la descripción.",
      fechas: { recepcion: _fmtHora_(_inicioHoras_(f)), max: _fmtHora_(limite) },
      detalles: [["Nivel de riesgo", r.nivel], ["Sede", f[C.SEDE - 1]], ["Servicio", f[C.SERVICIO - 1]], ["Canal", f[C.CANAL - 1]]],
      boton: { texto: "Gestionar ahora", url: _urlPlataforma_(cod) } }));
}
function _inicioHoras_(f) {
  var m = f[C.MARCA - 1];
  if (m instanceof Date && !isNaN(m.getTime())) return m.getTime();
  var r = f[C.FECHA_RECEPCION - 1];
  return r instanceof Date ? r.getTime() : Date.now();
}
function _limiteHoras_(f, nivel) { return _inicioHoras_(f) + (HORAS_NIVEL[nivel] || 0) * 3600000; }

/** Comando «Identificar PQRS prioritarias»: revisa todas las abiertas visibles y aplica la priorización. */
function apiIdentificarPrioritarias_() {
  var cats = _categorias_(); CATS_CACHE = cats;
  var datos = _datos_(), nuevas = [], revisadas = 0;
  var t0 = Date.now();
  datos.forEach(function (f, i) {
    if (Date.now() - t0 > 280000) return;
    if (!f[C.CODIGO - 1] || !_filaVisible_(f) || _esFeli(f[C.TIPO_PQRS - 1])) return;
    if (_norm(f[C.ESTADO - 1]).indexOf("cerrada") !== -1) return;
    revisadas++;
    var r = _evaluarPrioridadFila_(CFG.FILA_DATOS + i, "auto", f, cats);
    if (r.aplicado) { nuevas.push({ codigo: f[C.CODIGO - 1], nivel: r.nivel, razones: r.razones, poblacion: r.poblacion }); _alertaPrioritaria_(CFG.FILA_DATOS + i, r); }
  });
  SpreadsheetApp.flush();
  _traza("—", "Identificar PQRS prioritarias", revisadas + " abiertas revisadas · " + nuevas.length + " priorizadas ahora" + (SESION ? " · por " + SESION.usuario : ""));
  var lista = apiPrioritarias_();
  return { ok: true, revisadas: revisadas, nuevas: nuevas, prioritarias: lista.items,
           mensaje: revisadas + " PQRS abiertas revisadas · " + nuevas.length + " nuevas prioritarias · " + lista.items.length + " prioritarias en total." };
}
function identificarPrioritarias() {   // menú de la hoja
  SpreadsheetApp.getUi();
  var r = apiIdentificarPrioritarias_();
  SpreadsheetApp.getUi().alert(r.mensaje + (r.nuevas.length ? "\n\n" + r.nuevas.map(function (x) { return x.codigo + " · " + x.nivel; }).join("\n") : ""));
}

/** PQRS abiertas prioritarias con el tiempo que les queda (para la vista «Prioritarias» y el Inicio). */
function apiPrioritarias_() {
  var cats = _categorias_(), ahora = Date.now(), items = [];
  _datos_().forEach(function (f) {
    if (!f[C.CODIGO - 1] || !_filaVisible_(f) || _esFeli(f[C.TIPO_PQRS - 1])) return;
    if (_norm(f[C.ESTADO - 1]).indexOf("cerrada") !== -1) return;
    var nivel = _nivelDeCategoria_(f[C.CLASIF_INTERNA - 1], cats) || String(f[C.NIVEL_RIESGO - 1] || "").split(" · ")[0];
    var prioridad = _prioridadDe_(f[C.CLASIF_INTERNA - 1], f[C.ENTIDAD - 1], cats);
    if (_rango_(nivel) < 2 && prioridad !== "Crítica" && prioridad !== "Alta") return;
    var limite = HORAS_NIVEL[nivel] && _rango_(nivel) >= 2 ? _limiteHoras_(f, nivel)
      : (f[C.FECHA_MAX - 1] instanceof Date ? f[C.FECHA_MAX - 1].getTime() + 86399000 : 0);
    var obs = String(f[C.OBSERVACIONES - 1] || "");
    items.push({ codigo: f[C.CODIGO - 1], nivel: nivel || prioridad, prioridad: prioridad, clasificacion: f[C.CLASIF_INTERNA - 1],
      tipo: f[C.TIPO_PQRS - 1], sede: f[C.SEDE - 1], servicio: f[C.SERVICIO - 1], canal: f[C.CANAL - 1],
      poblacion: String(f[C.POBLACION_PRIORIZADA - 1] || "").split(/\s*;\s*/).filter(String),
      razones: ((/\[Riesgo: [^·\]]*·\s*([^\]]*)\]/.exec(obs) || [])[1] || "").split(/,\s*/).filter(String),
      remitente: (/Remitente institucional: ([^(·]+)/.exec(obs) || [])[1] || "",
      conArea: !!f[C.CORREO_RESP - 1], responsable: f[C.RESPONSABLE - 1] || "", estado: f[C.ESTADO - 1] || "Recibida",
      limite: limite, limiteTexto: _fmtHora_(limite), horasRestantes: limite ? Math.round((limite - ahora) / 360000) / 10 : null,
      vencida: limite ? limite < ahora : false, orden: _rango_(nivel) * -1e13 + (limite || 9e15) });
  });
  items.sort(function (a, b) { return a.orden - b.orden; });
  return { ok: true, items: items, ahora: ahora };
}

/** Ajuste manual del nivel de riesgo desde el detalle (técnico o administrador). */
function apiFijarRiesgo_(codigo, nivel, motivo) {
  var fila = _filaDe(codigo);
  if (fila < 0) return { ok: false, mensaje: "Radicado no encontrado." };
  var h = _h(CFG.HOJA_DATOS), f = h.getRange(fila, 1, 1, CFG.NCOL).getValues()[0];
  var obs = String(f[C.OBSERVACIONES - 1] || "").replace(/\s*\[Riesgo( manual)?: [^\]]*\]/g, "");
  if (nivel === "auto") {
    h.getRange(fila, C.OBSERVACIONES).setValue(obs);
    SpreadsheetApp.flush();
    var r = _evaluarPrioridadFila_(fila, "auto");
    _traza(codigo, "Riesgo recalculado", (r.nivel || "sin riesgo especial") + (motivo ? " · " + motivo : ""));
    return apiDetalle_(codigo);
  }
  var cat = CAT_POR_NIVEL[nivel] || "";
  var legal = CATS_LEGALES.test(_norm(f[C.CLASIF_INTERNA - 1]));
  if (!legal) h.getRange(fila, C.CLASIF_INTERNA).setValue(cat);
  h.getRange(fila, C.NIVEL_RIESGO).setValue(cat ? nivel + " · " + HORAS_NIVEL[nivel] + " h" : "");
  h.getRange(fila, C.OBSERVACIONES).setValue((obs ? obs + " " : "") + "[Riesgo manual: " + (nivel || "sin riesgo especial") + (motivo ? " · " + motivo : "") + "]");
  SpreadsheetApp.flush();
  _traza(codigo, "Riesgo ajustado a mano", (f[C.NIVEL_RIESGO - 1] || "sin riesgo") + " → " + (nivel || "sin riesgo especial") + (motivo ? " · " + motivo : ""));
  if (_rango_(nivel) >= 2) _alertaPrioritaria_(fila, { nivel: nivel, horas: HORAS_NIVEL[nivel], razones: ["ajuste manual" + (motivo ? ": " + motivo : "")], poblacion: String(f[C.POBLACION_PRIORIZADA - 1] || "").split(/\s*;\s*/).filter(String) });
  return apiDetalle_(codigo);
}

/** Vista previa del riesgo mientras el técnico escribe la radicación (no guarda nada). */
function apiEvaluarRiesgo_(d) {
  d = d || {};
  var f = []; for (var i = 0; i < CFG.NCOL; i++) f.push("");
  f[C.CODIGO - 1] = "PREVIA"; f[C.TIPO_PQRS - 1] = d.tipoPqrs || ""; f[C.DESCRIPCION - 1] = d.descripcion || "";
  f[C.EDAD - 1] = d.edad || ""; f[C.TIPO_DOC_SOL - 1] = d.tipoDocSolicitante || ""; f[C.TIPO_DOC_AFI - 1] = d.tipoDocAfiliado || "";
  f[C.POBLACION - 1] = d.poblacion || ""; f[C.SERVICIO - 1] = d.servicio || ""; f[C.SEDE - 1] = d.sede || "";
  var r = _evaluarRiesgo_(f);
  r.areas = d.descripcion ? _sugerirArea_(f) : [];
  r.norma = r.nivel ? _nivelNorma_(r.nivel) : "";
  return r;
}

// =====================================================================================
// v8 · DIRECCIONAMIENTO AUTOMÁTICO Y FELICITACIONES
// =====================================================================================
/**
 * Después de radicar: si está activado, envía el caso al área que indica el directorio.
 *   Felicitaciones → «inmediato»: se entrega al área apenas llega; «resumen»: rutinaDiaria manda
 *                    un solo correo por área con las del día; «manual»: las entrega el SIAU.
 *   PQRS           → solo con «direccionAuto» y un área inequívoca (servicio que atiende + palabras clave).
 * Devuelve el nombre del área o "".
 */
function _direccionAutomatica_(fila) {
  var a = _ajustes_();
  var f = _h(CFG.HOJA_DATOS).getRange(fila, 1, 1, CFG.NCOL).getValues()[0];
  if (!f[C.CODIGO - 1] || f[C.CORREO_RESP - 1]) return "";
  var feli = _esFeli(f[C.TIPO_PQRS - 1]);
  if (feli && a.direccionFelicitaciones !== "inmediato") return "";
  if (!feli && !a.direccionAuto) return "";
  if (!feli && CATS_LEGALES.test(_norm(f[C.CLASIF_INTERNA - 1]))) return "";   // tutelas y peticiones las revisa el SIAU
  var sug = _sugerirArea_(f);
  var ok = feli ? (sug.length && _correoOk(sug[0].correo)) : _areaClara_(sug);
  if (!ok) return "";
  var r = apiEnviarAlArea_(f[C.CODIGO - 1], sug[0].id, feli ? "" : "Direccionada automáticamente según el directorio (" + sug[0].razones.join(", ") + ").");
  if (r && r.ok === false) return "";
  _traza(f[C.CODIGO - 1], "Direccionamiento automático", sug[0].area + " · " + sug[0].razones.join(", "));
  return sug[0].area;
}

/**
 * Resumen de felicitaciones por área (rutina diaria o botón del SIAU): un solo correo por área con las
 * felicitaciones pendientes de entregar; cada una queda entregada y cerrada con trazabilidad.
 * Las que no tienen un área clara quedan para el SIAU.
 */
function apiDireccionarFelicitaciones_(soloContar) {
  var datos = _datos_(), porArea = {}, sinArea = 0, lista = apiResponsables_();
  var porId = {}; lista.forEach(function (r) { porId[r.id] = r; });
  datos.forEach(function (f, i) {
    if (!f[C.CODIGO - 1] || !_esFeli(f[C.TIPO_PQRS - 1]) || f[C.CORREO_RESP - 1]) return;
    if (_norm(f[C.ESTADO - 1]).indexOf("cerrada") !== -1 || !_filaVisible_(f)) return;
    var sug = _sugerirArea_(f, lista);
    if (!sug.length || !_correoOk(sug[0].correo)) { sinArea++; return; }
    var k = sug[0].id;
    (porArea[k] = porArea[k] || []).push({ fila: CFG.FILA_DATOS + i, f: f });
  });
  var areas = Object.keys(porArea);
  var total = areas.reduce(function (s, k) { return s + porArea[k].length; }, 0);
  if (soloContar === true) return { ok: true, pendientes: total, sinArea: sinArea, areas: areas.length };
  var h = _h(CFG.HOJA_DATOS), enviadas = 0;
  areas.forEach(function (k) {
    var resp = porId[k], items = porArea[k];
    var lineas = items.slice(0, 60).map(function (x) {
      return x.f[C.CODIGO - 1] + " · " + _fmt(x.f[C.FECHA_RADICACION - 1]) + " · " + (x.f[C.SEDE - 1] || "") + (x.f[C.SERVICIO - 1] ? " · " + x.f[C.SERVICIO - 1] : "") +
        "\n«" + String(x.f[C.DESCRIPCION - 1] || "").substring(0, 400) + "»";
    });
    var html = _correoDiseno_({ variante: "reconocimiento", etiqueta: "Reconocimiento · Uso interno", banda: "RECONOCIMIENTOS DE USUARIOS A SU EQUIPO",
      kicker: "Felicitación", titulo: items.length === 1 ? "Un usuario reconoce la labor de su equipo" : items.length + " usuarios reconocen la labor de su equipo",
      mensajeHtml: _parrafosHtml_("La Oficina de Atención al Usuario comparte con " + _html_(resp.area) + " las felicitaciones recibidas. " +
        "Gracias por su compromiso con una atención humanizada, segura y cercana.<br><br>No requieren gestión ni respuesta. Compártanlas con el equipo."),
      bloques: [{ titulo: "Palabras de los usuarios", html: _parrafos_(lineas.join("\n\n"), 'font-family:' + FF + ';font-size:13.5px;line-height:1.7;color:#3B4A52;font-style:italic;'), color: "#8455B8" }] });
    var r = _enviar(resp.correo, "[RECONOCIMIENTOS] " + items.length + " felicitación(es) para " + resp.area,
      items.length + " felicitaciones de usuarios para " + resp.area, html, { cc: (resp.copia || []).join(",") });
    if (!r.ok) return;
    var ahora = new Date();
    items.forEach(function (x) {
      _escribir(x.fila, (function () { var v = {};
        v[C.RESPONSABLE] = resp.area + (resp.nombre ? " · " + resp.nombre : ""); v[C.CORREO_RESP] = resp.correo;
        v[C.FECHA_ENVIO_AREA] = ahora; v[C.NOTIF_AREA] = ahora; v[C.ESTADO] = "Respondida - Cerrada"; return v; })());
      _traza(x.f[C.CODIGO - 1], "Felicitación entregada al área", resp.area + " (resumen de reconocimientos)");
      enviadas++;
    });
  });
  return { ok: true, enviadas: enviadas, areas: areas.length, sinArea: sinArea,
           mensaje: enviadas ? enviadas + " felicitación(es) entregada(s) a " + areas.length + " área(s)." + (sinArea ? " " + sinArea + " sin área clara: direcciónalas a mano." : "")
                             : "No hay felicitaciones pendientes con área identificada." + (sinArea ? " " + sinArea + " sin área clara." : "") };
}

// =====================================================================================
// v8 · REDACCIÓN DE LA RESPUESTA FORMAL AL USUARIO
// =====================================================================================
/*
 * Toma lo que respondió el área (o un borrador) y lo convierte en una respuesta institucional:
 * saludo con el nombre, referencia al radicado, fecha y servicio, el contenido del área limpio
 * (sin citas del correo, firmas internas, saludos al SIAU ni MAYÚSCULAS SOSTENIDAS), cierre
 * según el tipo de PQRS y datos de contacto. No usa servicios externos: los datos del usuario
 * no salen de la cuenta del SIAU. El SIAU revisa y ajusta antes de enviar.
 */
function _oracion_(t) {
  t = String(t || "");
  var letras = t.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, "");
  var mayus = t.replace(/[^A-ZÁÉÍÓÚÑ]/g, "");
  if (letras.length > 20 && mayus.length / letras.length > 0.7) {
    t = t.toLowerCase().replace(/(^\s*|[.!?]\s+|\n\s*)([a-záéíóúñ])/g, function (m, a, b) { return a + b.toUpperCase(); });
    t = t.replace(/\b(siau|eps|ips|uci|mired|pqrs|nna|sede)\b/gi, function (x) { return x.toUpperCase() === "MIRED" ? "MiRed" : x.toUpperCase(); });
  }
  return t;
}
function _limpiarRespuestaArea_(t) {
  t = _sinCitas_(String(t || "")).replace(/\r/g, "");
  var lineas = t.split("\n"), out = [];
  var cortar = /^\s*(cordialmente|atentamente|saludos|quedo atent|quedamos atent|gracias|--|__|enviado desde|sent from)/i;
  for (var i = 0; i < lineas.length; i++) {
    var l = lineas[i];
    if (i > 0 && cortar.test(l)) break;                                   // firma interna
    if (/^\s*(buen(os|as)? (dias|días|tardes|noches)|hola|cordial saludo|estimad[oa]s?|apreciad[oa]s?|señores|senores)\b.{0,60}(siau|atencion al usuario|atención al usuario|compañer|equipo|,|:)?\s*$/i.test(l) && out.join("").trim() === "") continue;
    out.push(l);
  }
  t = out.join("\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  t = _oracion_(t);
  // quitar referencias internas dirigidas al SIAU
  t = t.replace(/\b(le|les) (informo|informamos|comento|comentamos) (al siau|a atención al usuario|a atencion al usuario) que\s*/gi, "")
       .replace(/\bse le (informa|comunica) al (usuario|paciente)\b/gi, "le informamos");
  if (t && !/[.!?]$/.test(t)) t += ".";
  return t;
}
function apiRedactarRespuesta_(codigo, borrador) {
  var fila = _filaDe(codigo);
  if (fila < 0) return { ok: false, mensaje: "Radicado no encontrado." };
  var f = _h(CFG.HOJA_DATOS).getRange(fila, 1, 1, CFG.NCOL).getValues()[0];
  var tipo = String(f[C.TIPO_PQRS - 1] || "solicitud"), tn = _norm(tipo);
  var base = String(borrador || f[C.RTA_AREA - 1] || "").trim();
  if (!base) return { ok: false, mensaje: "Aún no hay respuesta del área. Regístrala o escribe un borrador para redactarlo." };
  var nombre = String(f[C.NOMBRE_SOL - 1] || "").trim();
  nombre = nombre && !/@/.test(nombre) && !/eps|salud|secretar|super|juzgado|contralor|procurad|personer|defensor/i.test(nombre)
    ? nombre.toLowerCase().replace(/(^|\s)([a-záéíóúñ])/g, function (m, a, b) { return a + b.toUpperCase(); }) : "";
  var institucional = /eps|salud|secretar|super|juzgado|contralor|procurad|personer|defensor/i.test(String(f[C.NOMBRE_SOL - 1] || ""));
  var saludo = institucional ? "Respetados señores:" : (nombre ? "Apreciado(a) " + nombre + ":" : "Apreciado(a) usuario(a):");
  var art = /peticion|queja|felicitacion|sugerencia|denuncia|tutela/.test(tn) ? "su" : "su";
  var ref = "Reciba un cordial saludo de MiRed Barranquilla IPS S.A.S. En atención a " + art + " " + tipo.toLowerCase() +
    " radicada con el número " + f[C.CODIGO - 1] + " el " + _fmt(f[C.FECHA_RADICACION - 1]) +
    (f[C.SERVICIO - 1] ? ", relacionada con el servicio de " + String(f[C.SERVICIO - 1]).toLowerCase() : "") +
    (f[C.SEDE - 1] ? " en la sede " + f[C.SEDE - 1] : "") + ", nos permitimos informarle lo siguiente:";
  var cuerpo = _limpiarRespuestaArea_(base);
  var cierre = /queja|reclamo|denuncia/.test(tn)
    ? "Lamentamos los inconvenientes que esta situación le haya ocasionado. Su manifestación fue analizada con el área responsable y nos permite fortalecer las acciones de mejora en la prestación de nuestros servicios."
    : /sugerencia/.test(tn) ? "Agradecemos su sugerencia: fue compartida con el área responsable y será tenida en cuenta en nuestros planes de mejora."
    : /felicit/.test(tn) ? "Agradecemos sinceramente sus palabras, que ya fueron compartidas con el equipo."
    : "Esperamos haber atendido de fondo su solicitud.";
  var contacto = "Si requiere información adicional, puede comunicarse con la Oficina de Atención al Usuario" +
    (_param(3) ? " al correo " + _param(3) : "") + (_param(4) ? ", al teléfono " + _param(4) : "") + (_param(5) ? " o por WhatsApp al " + _param(5) : "") + ".";
  var texto = [saludo, ref, cuerpo, cierre, contacto, "Atentamente,\n\nOficina de Atención al Usuario (SIAU)\nMiRed Barranquilla IPS S.A.S."].join("\n\n");
  return { ok: true, texto: texto, original: base };
}

// =====================================================================================
// v8 · FORMULARIO QR, CREACIÓN DEL FORMULARIO Y DIAGNÓSTICO
// =====================================================================================
/** Datos para el panel del QR: enlace público del formulario (Config B22 o el formulario vinculado). */
function apiFormularioQR_() {
  var url = String(_param(11) || "").trim(), edit = "", corto = "", titulo = "";
  var id = String(_param(6) || "").trim();
  try {
    var form = id ? FormApp.openById(id) : null;
    if (!form) {
      _ss_().getSheets().forEach(function (sh) {
        try { if (!form && sh.getFormUrl && sh.getFormUrl()) form = FormApp.openByUrl(sh.getFormUrl()); } catch (e) {}
      });
    }
    if (form) {
      titulo = form.getTitle(); edit = form.getEditUrl();
      if (!url) url = form.getPublishedUrl();
      try { corto = form.shortenFormUrl(form.getPublishedUrl()); } catch (e) {}
    }
  } catch (e) { Logger.log("QR: " + e); }
  return { ok: true, url: url, corto: corto, edicion: edit, titulo: titulo, plataforma: _urlPlataforma_(""),
           mensaje: url ? "" : "No encontré el formulario. Vincúlalo a este libro, créalo con el botón «Crear formulario» o pega su enlace en Config (B22)." };
}
function _sedesAmigables_() {
  return (_listasConfig_()["SEDE"] || []).filter(function (x) { return !/interprete/i.test(x); }).map(function (x) {
    return String(x).trim().replace(/^C\.\s*/i, "Camino ").replace(/^P\.\s*/i, "Paso ").toLowerCase()
      .replace(/(^|\s)([a-záéíóúñ0-9])/g, function (m, a, b) { return a + b.toUpperCase(); })
      .replace(/\b(De|Del|La|Las|Los|El|Y)\b/g, function (w) { return w.toLowerCase(); }).replace(/^(\w)/, function (c) { return c.toUpperCase(); });
  });
}
/**
 * Crea un formulario QR nuevo (Google Forms) con las preguntas del consolidado, la autorización de
 * tratamiento de datos (Ley 1581 de 2012) y la lista de sedes; lo vincula a este libro y guarda el mapeo.
 * No borra el formulario anterior: se recomienda reemplazar el QR impreso cuando el nuevo esté probado.
 */
function apiCrearFormulario_() {
  var L = _listasConfig_();
  var titulo = "Cuéntenos su experiencia · MiRed IPS (PQRS)";
  var form = FormApp.create(titulo);
  form.setDescription("Oficina de Atención al Usuario (SIAU) · MiRed Barranquilla IPS S.A.S.\n\n" +
    "Registre aquí su petición, queja, reclamo, sugerencia o felicitación. Recibirá en su correo el número de radicado y la fecha límite de respuesta.\n\n" +
    "Si su situación pone en riesgo su vida o la de un menor de edad, además de diligenciar este formulario acérquese al personal de la sede.");
  form.setCollectEmail(false).setAllowResponseEdits(false).setLimitOneResponsePerUser(false).setProgressBar(true);
  var aviso = "Autorizo a MiRed Barranquilla IPS S.A.S. para tratar mis datos personales y de salud con la única finalidad de radicar, gestionar y responder esta solicitud, " +
    "conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015). Sé que los datos de salud son sensibles y que no estoy obligado(a) a entregarlos, " +
    "y que puedo conocer, actualizar, rectificar y suprimir mis datos o revocar esta autorización escribiendo a " + (_param(3) || "siau@miredips.org") + "." +
    (_param(10) ? " Política de tratamiento: " + _param(10) : "");
  var lista = function (t, ops, req) { var it = form.addListItem().setTitle(t).setChoiceValues(ops); it.setRequired(!!req); return it; };
  var opcion = function (t, ops, req) { var it = form.addMultipleChoiceItem().setTitle(t).setChoiceValues(ops); it.setRequired(!!req); return it; };
  form.addMultipleChoiceItem().setTitle("Autorización de tratamiento de datos personales").setHelpText(aviso)
    .setChoiceValues(["Sí autorizo", "No autorizo (radicaré sin datos de contacto)"]).setRequired(true);
  opcion("Tipo de solicitud", ["Felicitación", "Queja", "Reclamo", "Petición", "Sugerencia", "Denuncia"], true);
  opcion("Usted es:", ["Usuario", "Familiar o acompañante", "Colaborador"], true);
  lista("Tipo de documento", L["TIPO DOCUMENTO"] && L["TIPO DOCUMENTO"].length ? L["TIPO DOCUMENTO"] : ["Cédula de ciudadanía", "Tarjeta de identidad", "Registro civil", "Cédula de extranjería", "Permiso por protección temporal", "Pasaporte"], false);
  form.addTextItem().setTitle("Número de identificación").setRequired(false);
  form.addTextItem().setTitle("Nombre completo del paciente").setRequired(false);
  form.addTextItem().setTitle("Edad del paciente").setRequired(false);
  opcion("Sexo", ["Femenino", "Masculino", "Otro"], false);
  form.addTextItem().setTitle("Número de celular").setRequired(false);
  form.addTextItem().setTitle("Correo electrónico (para enviarle el radicado y la respuesta)").setRequired(false);
  form.addTextItem().setTitle("Dirección").setRequired(false);
  lista("Población diferencial (si aplica)", L["POBLACIÓN DIFERENCIAL"] && L["POBLACIÓN DIFERENCIAL"].length ? L["POBLACIÓN DIFERENCIAL"] : ["No aplica", "Gestante", "Discapacidad", "Adulto mayor", "Menor de edad", "Víctima del conflicto", "Migrante", "Étnica", "Otro"], false);
  lista("Seleccione su EPS", (L["EPS / PRESTADOR"] || []).filter(function (x) { return /eps|salud|ser|sanitas|sura|coosalud|famisanar|proteger|particular/i.test(x); }).concat(["Particular", "Otra"]), false);
  opcion("Régimen", ["Subsidiado", "Contributivo", "Otro"], false);
  lista("Sede donde fue atendido (Camino o Paso)", _sedesAmigables_(), true);
  lista("Servicio o área relacionada con su opinión", L["SERVICIO"] && L["SERVICIO"].length ? L["SERVICIO"] : ["Consulta externa", "Urgencias"], true);
  form.addDateItem().setTitle("Fecha en que ocurrieron los hechos").setRequired(false);
  form.addParagraphTextItem().setTitle("Describa su solicitud").setHelpText("Cuéntenos qué pasó, cuándo y con quién. Si es una felicitación, a quién le quiere agradecer.").setRequired(true);
  form.setConfirmationMessage("¡Gracias! Recibimos su mensaje. Si dejó su correo, le enviaremos el número de radicado y la fecha límite de respuesta. " +
    "Oficina de Atención al Usuario · MiRed IPS.");
  var ss = _ss_();
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush();
  var hoja = "";
  ss.getSheets().forEach(function (sh) { try { if (sh.getFormUrl && sh.getFormUrl() && _norm(sh.getFormUrl()).indexOf(_norm(form.getId())) !== -1) hoja = sh.getName(); } catch (e) {} });
  var mapeo = {
    "Tipo de solicitud": "tipoPqrs", "Usted es:": "tipoSolicitante", "Tipo de documento": "tipoDocSolicitante", "Número de identificación": "numDocSolicitante",
    "Nombre completo del paciente": "nombreSolicitante", "Edad del paciente": "edad", "Sexo": "sexo", "Número de celular": "telefono",
    "Correo electrónico (para enviarle el radicado y la respuesta)": "correo", "Dirección": "direccion", "Población diferencial (si aplica)": "poblacion",
    "Seleccione su EPS": "eps", "Régimen": "regimen", "Sede donde fue atendido (Camino o Paso)": "sede", "Servicio o área relacionada con su opinión": "servicio",
    "Fecha en que ocurrieron los hechos": "fechaPqrs", "Describa su solicitud": "descripcion", "Autorización de tratamiento de datos personales": "autorizacionDatos",
  };
  apiGuardarMapeo_(mapeo, form.getId(), hoja);
  _setParam(11, form.getPublishedUrl());
  if (!_param(9)) _setParam(9, new Date());
  _traza("—", "Formulario QR creado", titulo + " · " + form.getPublishedUrl());
  var r = apiFormularioQR_();
  r.creado = true;
  r.mensaje = "Formulario creado y vinculado a la hoja «" + (hoja || "Respuestas") + "». Instala los disparadores (menú PQRS) si aún no lo hiciste.";
  return r;
}
function crearFormularioPQRS() {   // menú de la hoja
  SpreadsheetApp.getUi();
  var r = apiCrearFormulario_();
  SpreadsheetApp.getUi().alert(r.mensaje + "\n\nEnlace para el QR:\n" + (r.corto || r.url) + "\n\nEdición:\n" + r.edicion);
}

/** Diagnóstico de la puesta en marcha (lo que suele impedir que los técnicos entren o que lleguen los avisos). */
function apiDiagnostico_() {
  var d = [], ok = function (bien, titulo, detalle, solucion) { d.push({ ok: !!bien, titulo: titulo, detalle: detalle || "", solucion: bien ? "" : (solucion || "") }); };
  var enl = _enlaceAcceso_();
  ok(enl.url && !enl.prueba, "Enlace de la plataforma (/exec)", enl.url || "Sin implementación",
     "Implementar ▸ Nueva implementación ▸ Aplicación web ▸ Ejecutar como: Yo ▸ Quién tiene acceso: Cualquier persona. Comparte la URL que termina en /exec.");
  ok(/siau/i.test(enl.cuenta || ""), "Cuenta dueña", enl.cuenta || "desconocida",
     "La plataforma debe implementarse con la cuenta del SIAU para que los correos salgan de allí y el consolidado quede en su Drive.");
  var trig = []; try { trig = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); }); } catch (e) {}
  ["alEnviarFormulario", "procesarCorreoEntrante", "revisarAlertas", "rutinaDiaria"].forEach(function (n) {
    ok(trig.indexOf(n) !== -1, "Disparador " + n, trig.indexOf(n) !== -1 ? "instalado" : "falta", "Hoja ▸ menú PQRS ▸ Instalar disparadores (con la cuenta del SIAU).");
  });
  var admins = _usuarios_().filter(function (u) { return u.activo && u.rol === "Administrador"; }).length;
  var tecnicos = _usuarios_().filter(function (u) { return u.activo && u.rol === "Técnico"; }).length;
  ok(admins > 0, "Administradores activos", String(admins), "Crea el primer administrador en la pantalla de ingreso.");
  ok(tecnicos > 0, "Técnicos de sede", String(tecnicos), "Usuarios y sedes ▸ Nuevo usuario ▸ rol Técnico ▸ sus sedes ▸ Invitar.");
  var form = apiEstadoFormulario_();
  ok(form.vinculado, "Formulario QR vinculado", form.vinculado ? (form.hoja + " · " + form.respuestas + " respuestas") : "no vinculado",
     "Configuración ▸ Formulario QR ▸ Crear formulario, o en el Form: Respuestas ▸ Vincular a Hojas de cálculo.");
  var resp = apiResponsables_().filter(function (r) { return r.activo; });
  var sinCorreo = resp.filter(function (r) { return !_correoOk(r.correo); }).length;
  ok(!sinCorreo, "Directorio de áreas", resp.length + " áreas · " + sinCorreo + " sin correo", "Áreas responsables ▸ completa el correo de cada área.");
  var a = _ajustes_();
  ok(!!a.webhookChat || !!a.avisarA || a.avisosSede, "Avisos fuera de la plataforma", a.webhookChat ? "Google Chat configurado" : "solo correo",
     "Configuración ▸ Automatización ▸ webhook de Google Chat (llega al celular con sonido).");
  ok(PropertiesService.getScriptProperties().getProperty("ESQUEMA") === ESQUEMA, "Estructura del consolidado", "versión " + (PropertiesService.getScriptProperties().getProperty("ESQUEMA") || "?"),
     "Abre la plataforma una vez como administrador o usa PQRS ▸ Reparar fechas y fórmulas.");
  ok(!!_param(9), "Fecha de corte del formulario", _param(9) ? _fmtHora_(new Date(_param(9)).getTime()) : "sin fijar", "Se fija sola en la primera importación.");
  return { ok: true, items: d, bien: d.filter(function (x) { return x.ok; }).length, total: d.length };
}
function diagnosticoPlataforma() {   // menú de la hoja
  SpreadsheetApp.getUi();
  var r = apiDiagnostico_();
  SpreadsheetApp.getUi().alert("Diagnóstico: " + r.bien + " de " + r.total + " en orden\n\n" + r.items.map(function (x) {
    return (x.ok ? "✔ " : "✖ ") + x.titulo + ": " + x.detalle + (x.solucion ? "\n    → " + x.solucion : ""); }).join("\n"));
}
