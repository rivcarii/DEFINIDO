/**
 * =====================================================================================
 *  SISTEMA PQRS · MiRed Barranquilla IPS S.A.S. — Backend v4
 *  Libro: PQRS_BaseDatos_v4.xlsx   ·   Interfaz: Index.html (aplicación web)
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
  FILA_FIN: 404,
  NCOL: 53,

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
};

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
};

const LOGO_BASE64 = "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";

// ---------------------------------------------------------------------------
// APLICACIÓN WEB
// ---------------------------------------------------------------------------
function doGet(e) {
  return HtmlService.createTemplateFromFile("Index").evaluate()
    .setTitle("Sistema PQRS · MiRed IPS")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu("PQRS")
    .addItem("Abrir plataforma", "mostrarUrl")
    .addItem("Importar respuestas del formulario", "apiImportarRespuestasForm")
    .addItem("Revisar vencimientos y alertar", "rutinaDiaria")
    .addItem("Instalar disparadores", "instalarDisparadores")
    .addToUi();
}

function mostrarUrl() {
  var u = "";
  try { u = ScriptApp.getService().getUrl(); } catch (err) {}
  SpreadsheetApp.getUi().alert(u ? "Plataforma PQRS:\n\n" + u
    : "Publica primero: Implementar ▸ Nueva implementación ▸ Aplicación web.");
}

function instalarDisparadores() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.newTrigger("onFormSubmit_").forSpreadsheet(ss).onFormSubmit().create();
  ScriptApp.newTrigger("rutinaDiaria").timeBased().atHour(7).everyDays(1).create();
  SpreadsheetApp.getUi().alert("Listo:\n• Al enviar el formulario → radica automáticamente\n• Todos los días 7:00 a.m. → alerta de vencidas");
}

// ---------------------------------------------------------------------------
// UTILIDADES
// ---------------------------------------------------------------------------
function _h(n) { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(n); }
function _norm(s) { return (s || "").toString().trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
function _esFeli(t) { return _norm(t).indexOf("felicita") === 0; }
function _correoOk(c) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((c || "").toString().trim()); }
function _usuario() {
  try { return Session.getActiveUser().getEmail() || "sistema"; } catch (e) { return "sistema"; }
}
function _fmt(f) {
  if (!f) return "";
  var d = (f instanceof Date) ? f : new Date(f);
  if (isNaN(d.getTime())) return "";
  return Utilities.formatDate(d, Session.getScriptTimeZone() || "America/Bogota", "dd/MM/yyyy");
}
function _fechaDeTexto(s) {
  if (!s) return null;
  if (s instanceof Date) return s;
  var p = s.toString().split("-");           // yyyy-mm-dd del input date
  if (p.length === 3) {
    var d = new Date(parseInt(p[0],10), parseInt(p[1],10)-1, parseInt(p[2],10));
    return isNaN(d.getTime()) ? null : d;
  }
  var d2 = new Date(s);
  return isNaN(d2.getTime()) ? null : d2;
}
function _param(i) {   // i = 0 -> B11
  return _h(CFG.HOJA_CONFIG).getRange(CFG.CFG_PARAM_INI + i, 2).getValue();
}
function _setParam(i, v) {
  _h(CFG.HOJA_CONFIG).getRange(CFG.CFG_PARAM_INI + i, 2).setValue(v);
}

function _proximaFila() {
  var h = _h(CFG.HOJA_DATOS);
  var n = CFG.FILA_FIN - CFG.FILA_DATOS + 1;
  var col = h.getRange(CFG.FILA_DATOS, C.FECHA_RADICACION, n, 1).getValues();
  for (var i = 0; i < col.length; i++) if (col[i][0] === "" || col[i][0] === null) return CFG.FILA_DATOS + i;
  var nueva = CFG.FILA_FIN + 1;
  h.getRange(CFG.FILA_FIN, 1, 1, CFG.NCOL).copyTo(h.getRange(nueva, 1, 1, CFG.NCOL));
  h.getRange(nueva, 1, 1, CFG.NCOL).clearContent();
  CFG.FILA_FIN = nueva;
  return nueva;
}

function _escribir(fila, vals) {
  var h = _h(CFG.HOJA_DATOS);
  Object.keys(vals).forEach(function (k) {
    if (vals[k] !== undefined) h.getRange(fila, parseInt(k, 10)).setValue(vals[k]);
  });
}

function _filaDe(codigo) {
  var h = _h(CFG.HOJA_DATOS);
  var n = CFG.FILA_FIN - CFG.FILA_DATOS + 1;
  var cods = h.getRange(CFG.FILA_DATOS, C.CODIGO, n, 1).getValues();
  var buscado = (codigo || "").toString().trim().toUpperCase();
  for (var i = 0; i < cods.length; i++) {
    if ((cods[i][0] || "").toString().trim().toUpperCase() === buscado) return CFG.FILA_DATOS + i;
  }
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

function _siguienteConsecutivo() {
  var base = parseInt(_param(0), 10); if (isNaN(base)) base = 3174;
  var h = _h(CFG.HOJA_DATOS);
  var n = CFG.FILA_FIN - CFG.FILA_DATOS + 1;
  var cods = h.getRange(CFG.FILA_DATOS, C.CODIGO, n, 1).getValues();
  var max = base;
  cods.forEach(function (c) {
    var m = RE_RAD.exec((c[0] || "").toString().trim());
    if (m) { var v = parseInt(m[4], 10); if (v > max) max = v; }
  });
  return max + 1;
}

function _nuevoCodigo(fecha) {
  var pref = (_param(2) || "SIAU").toString().trim();
  var d = (fecha instanceof Date && !isNaN(fecha)) ? fecha : new Date();
  var n = _siguienteConsecutivo();
  return pref + "-" + d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0000" + n).slice(-4);
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

function _progreso(estado) {
  var idx = _idxEtapa(estado), out = [];
  ETAPAS.forEach(function (et, i) {
    var on = i <= idx, col = on ? "#006081" : "#D9E2E6", tx = on ? "#006081" : "#9AA5AA";
    out.push('<td align="center" style="width:' + (i === 1 ? "38%" : "31%") + ';">' +
      '<div style="width:26px;height:26px;line-height:26px;border-radius:50%;background:' + col +
      ';color:#fff;font:bold 12px Arial,sans-serif;margin:0 auto;">' + (i + 1) + '</div>' +
      '<div style="font:' + (i === idx ? "bold" : "normal") + ' 11px Arial,sans-serif;color:' + tx +
      ';margin-top:6px;">' + et + '</div></td>');
    if (i < 2) out.push('<td style="padding:0 4px;"><div style="height:3px;background:' +
      (i < idx ? "#006081" : "#D9E2E6") + ';margin-top:13px;"></div></td>');
  });
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;"><tr>' + out.join("") + '</tr></table>';
}

function _plantilla(o) {
  var dato = function (k, v) {
    return v ? '<tr><td style="padding:5px 12px 5px 0;color:#667;font:12px Arial,sans-serif;white-space:nowrap;">' + k +
      '</td><td style="padding:5px 0;color:#222;font:bold 12px Arial,sans-serif;">' + v + '</td></tr>' : "";
  };
  var caja = function (t, c, borde) {
    return c ? '<div style="margin-top:14px;"><div style="font:bold 12px Arial,sans-serif;color:#004A63;margin-bottom:5px;">' + t +
      '</div><div style="font:13px/1.6 Arial,sans-serif;color:#333;background:#F7FAFB;border-left:3px solid ' + borde +
      ';padding:10px 12px;border-radius:4px;white-space:pre-wrap;">' + c + '</div></div>' : "";
  };
  return '' +
  '<div style="background:#EEF2F4;padding:24px 12px;font-family:Arial,sans-serif;">' +
   '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E1E8EB;">' +
     '<tr><td style="background:#ffffff;padding:20px 26px 14px 26px;"><img src="cid:logoNiRed" width="130" alt="MiRed IPS" style="display:block;border:0;"/></td></tr>' +
     '<tr><td style="height:4px;background:' + (o.interno ? '#9A6200' : '#006081') + ';font-size:0;line-height:0;">&nbsp;</td></tr>' +
     (o.interno ? '<tr><td style="background:#FBEFD5;padding:9px 26px;font:bold 11px Arial,sans-serif;color:#9A6200;letter-spacing:.06em;">COMUNICACIÓN INTERNA · GESTIÓN DE PQRS — no reenviar al usuario</td></tr>' : '') +
     '<tr><td style="padding:24px 28px 8px 28px;">' +
      '<div style="font:bold 19px Arial,sans-serif;color:#004A63;margin-bottom:6px;">' + o.titulo + '</div>' +
      '<div style="font:12px Arial,sans-serif;color:#667;">Radicado: <b style="color:#006081;">' + o.codigo +
        '</b>' + (o.tipo ? ' &nbsp;·&nbsp; Tipo: <b>' + o.tipo + '</b>' : '') + '</div>' +
      (o.sinProgreso ? "" : _progreso(o.estado)) +
      '<div style="font:13px/1.6 Arial,sans-serif;color:#333;margin:14px 0;">' + o.mensaje + '</div>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7FAFB;border-radius:8px;">' +
        dato("Estado", o.estado) + dato("Sede", o.sede) + dato("Servicio", o.servicio) +
        dato("Fecha de radicación", o.fechaRadicacion) + dato("Término de respuesta", o.fechaMax) +
        (o.interno ? dato("Solicitante", o.solicitante) + dato("Documento", o.documento) +
                     dato("Contacto", o.contacto) + dato("Área responsable", o.responsable) : "") +
      '</table>' +
      caja("Descripción de la PQRS", o.descripcion, "#9AA5AA") +
      caja("Gestión del área", o.gestion, "#F5A623") +
      caja("Respuesta de la institución", o.respuesta, "#006081") +
     '</td></tr>' +
     '<tr><td style="padding:18px 28px 22px 28px;border-top:1px solid #eee;">' +
      '<div style="font:11px/1.6 Arial,sans-serif;color:#888;">' +
      (o.interno
        ? 'Mensaje generado por el Sistema de PQRS · Oficina de Atención al Usuario (SIAU)<br/>Responda a este correo con la gestión realizada; el SIAU redactará la respuesta al usuario.'
        : 'Oficina de Atención al Usuario (SIAU) · MiRed Barranquilla IPS S.A.S.<br/>' +
          (_param(3) || "siau@miredips.org") + ' &nbsp;·&nbsp; ' + (_param(4) || "") + ' &nbsp;·&nbsp; WhatsApp ' + (_param(5) || "")) +
      '</div>' +
     '</td></tr></table></td></tr></table></div>';
}

function _enviar(para, asunto, texto, html) {
  try {
    var op = { name: CFG.REMITENTE, replyTo: (_param(3) || "siau@miredips.org") };
    if (html) {
      op.htmlBody = html;
      op.inlineImages = { logoNiRed: Utilities.newBlob(Utilities.base64Decode(LOGO_BASE64), "image/png", "logo.png") };
    }
    GmailApp.sendEmail(para, asunto, texto, op);
    return { ok: true };
  } catch (err) {
    Logger.log("Error correo %s: %s", para, err);
    return { ok: false, error: err.message || String(err) };
  }
}

function _datosCorreo(f) {   // f = arreglo de la fila
  return {
    codigo: f[C.CODIGO - 1], tipo: f[C.TIPO_PQRS - 1], estado: f[C.ESTADO - 1] || "Recibida",
    sede: f[C.SEDE - 1], servicio: f[C.SERVICIO - 1],
    fechaRadicacion: _fmt(f[C.FECHA_RADICACION - 1]),
    fechaMax: _esFeli(f[C.TIPO_PQRS - 1]) ? "" : _fmt(f[C.FECHA_MAX - 1]),
    responsable: f[C.RESPONSABLE - 1],
  };
}

// ---------------------------------------------------------------------------
// API · ARRANQUE
// ---------------------------------------------------------------------------
function appBootstrap() {
  var cfg = _h(CFG.HOJA_CONFIG);
  var L = _filaEncabezadoListas_(cfg);
  var cab = cfg.getRange(L, 1, 1, 14).getValues()[0];
  var cuerpo = cfg.getRange(L + 1, 1, 50, 14).getValues();
  var listas = {};
  cab.forEach(function (nombre, i) {
    if (!nombre) return;
    listas[String(nombre).trim()] = cuerpo.map(function (r) { return r[i]; }).filter(String);
  });
  return {
    listas: listas,
    responsables: apiResponsables(),
    usuario: _usuario(),
    logo: LOGO_BASE64,
    siau: { correo: _param(3), tel: _param(4), wa: _param(5) },
    formVinculado: { id: _param(6), hoja: _param(7) },
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

function apiResponsables() {
  var h = _h(CFG.HOJA_RESP);
  var ultima = h.getLastRow();
  if (ultima < CFG.RESP_FILA) return [];
  var datos = h.getRange(CFG.RESP_FILA, 1, ultima - CFG.RESP_FILA + 1, 7).getValues();
  return datos.filter(function (r) { return r[1]; }).map(function (r, i) {
    return { id: r[0] || (i + 1), area: r[1], nombre: r[2], cargo: r[3], correo: r[4], telefono: r[5],
             activo: _norm(r[6]) !== "no", fila: CFG.RESP_FILA + i };
  });
}

function apiGuardarResponsable(r) {
  var h = _h(CFG.HOJA_RESP);
  if (!r.area) return { ok: false, mensaje: "El área o servicio es obligatorio." };
  if (r.correo && !_correoOk(r.correo)) return { ok: false, mensaje: "El correo no es válido." };

  if (r.fila) {
    h.getRange(r.fila, 2, 1, 6).setValues([[r.area, r.nombre || "", r.cargo || "", r.correo || "",
      r.telefono || "", r.activo === false ? "NO" : "SI"]]);
    _traza("—", "Responsable actualizado", r.area + " · " + (r.nombre || "") + " · " + (r.correo || "sin correo"));
  } else {
    var ultima = h.getLastRow();
    var ids = h.getRange(CFG.RESP_FILA, 1, Math.max(1, ultima - CFG.RESP_FILA + 1), 1).getValues()
               .map(function (x) { return parseInt(x[0], 10) || 0; });
    var nuevoId = Math.max.apply(null, ids.concat([0])) + 1;
    h.appendRow([nuevoId, r.area, r.nombre || "", r.cargo || "", r.correo || "", r.telefono || "",
                 r.activo === false ? "NO" : "SI"]);
    _traza("—", "Responsable creado", r.area + " · " + (r.nombre || "") + " · " + (r.correo || "sin correo"));
  }
  return { ok: true, responsables: apiResponsables() };
}

function apiEliminarResponsable(fila) {
  var h = _h(CFG.HOJA_RESP);
  var area = h.getRange(fila, 2).getValue();
  h.getRange(fila, 7).setValue("NO");
  _traza("—", "Responsable desactivado", area);
  return { ok: true, responsables: apiResponsables() };
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
  var html = _plantilla({
    codigo: codigo, tipo: f[C.TIPO_PQRS - 1], estado: "Recibida", sinProgreso: feli,
    sede: base.sede, servicio: base.servicio, fechaRadicacion: base.fechaRadicacion, fechaMax: base.fechaMax,
    titulo: feli ? "¡Gracias por su felicitación!" : "Recibimos su solicitud",
    mensaje: feli
      ? "Recibimos su mensaje y lo haremos llegar al equipo del área que usted reconoce. Gracias por tomarse el tiempo de escribirnos."
      : "Confirmamos la radicación de su <b>" + (f[C.TIPO_PQRS - 1] || "solicitud") + "</b> con el número que aparece arriba. " +
        "La Oficina de Atención al Usuario la está revisando y le informaremos cada avance." +
        (base.fechaMax ? " Le daremos respuesta a más tardar el <b>" + base.fechaMax + "</b>." : ""),
    descripcion: f[C.DESCRIPCION - 1],
  });
  var r = _enviar(correo,
    (feli ? "Gracias por su felicitación – " : "Radicación de su PQRS – ") + codigo,
    "Radicado " + codigo, html);
  if (!r.ok) return "error: " + r.error;

  h.getRange(fila, C.NOTIF_RECEPCION).setValue(new Date());
  _traza(codigo, "Notificación de recepción", "Acuse enviado a " + correo);
  return "enviado a " + correo;
}

// ---------------------------------------------------------------------------
// API · RADICAR
// ---------------------------------------------------------------------------
function apiRadicar(d) {
  var faltan = [];
  if (!d.descripcion) faltan.push("Descripción");
  if (!d.fechaRecepcion) faltan.push("Fecha de recepción");
  if (!d.tipoPqrs) faltan.push("Tipo de PQRS");
  if (faltan.length) return { ok: false, mensaje: "Faltan: " + faltan.join(", ") };

  var fRecepcion = _fechaDeTexto(d.fechaRecepcion);
  var fPqrs = _fechaDeTexto(d.fechaPqrs) || fRecepcion;
  var fRadicacion = _fechaDeTexto(d.fechaRadicacion) || new Date();
  fRadicacion.setHours(0, 0, 0, 0);

  var fila = _proximaFila();
  var codigo = _nuevoCodigo(fRadicacion);
  var vals = {};
  vals[C.CODIGO] = codigo;
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

  _escribir(fila, vals);
  SpreadsheetApp.flush();
  _traza(codigo, "Radicación", "Canal " + vals[C.CANAL] + " · PQRS del " + _fmt(fPqrs) +
    " · recibida el " + _fmt(fRecepcion));

  var f = _h(CFG.HOJA_DATOS).getRange(fila, 1, 1, CFG.NCOL).getValues()[0];
  var base = _datosCorreo(f);
  var acuse = _acuseRecepcion_(fila);

  return { ok: true, codigo: codigo, fila: fila, fechaMax: base.fechaMax || "No aplica", acuse: acuse };
}

// ---------------------------------------------------------------------------
// API · BANDEJA Y DETALLE
// ---------------------------------------------------------------------------
function apiBandeja(filtros) {
  filtros = filtros || {};
  var h = _h(CFG.HOJA_DATOS);
  var n = CFG.FILA_FIN - CFG.FILA_DATOS + 1;
  var datos = h.getRange(CFG.FILA_DATOS, 1, n, CFG.NCOL).getValues();
  var texto = _norm(filtros.texto);
  var out = [];

  datos.forEach(function (f, i) {
    if (!f[C.CODIGO - 1]) return;
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
      dias: f[C.DIAS - 1],
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
      if (!pasa) return;
    }
    if (filtros.estado && _norm(filtros.estado) !== _norm(item.estado)) return;
    if (filtros.semaforo && (item.semaforo || "").indexOf(filtros.semaforo) !== 0) return;
    if (filtros.canal && _norm(filtros.canal) !== _norm(item.canal)) return;
    if (texto) {
      var blob = _norm([item.codigo, item.solicitante, item.sede, item.servicio, item.tipo,
                        f[C.DESCRIPCION - 1], f[C.NUM_DOC_SOL - 1]].join(" "));
      if (blob.indexOf(texto) === -1) return;
    }
    out.push(item);
  });
  out.reverse();
  return out;
}

function apiDetalle(codigo) {
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
  d.dias = f[C.DIAS - 1];
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
  return d;
}

function _trazaDe(codigo) {
  var h = _h(CFG.HOJA_TRAZA);
  var ultima = h.getLastRow();
  if (ultima < CFG.TRAZA_FILA) return [];
  var datos = h.getRange(CFG.TRAZA_FILA, 1, ultima - CFG.TRAZA_FILA + 1, 5).getValues();
  return datos.filter(function (r) { return (r[1] || "").toString().trim() === codigo; })
    .map(function (r) {
      return { fecha: Utilities.formatDate(new Date(r[0]), Session.getScriptTimeZone() || "America/Bogota", "dd/MM/yyyy HH:mm"),
               accion: r[2], detalle: r[3], usuario: r[4] };
    }).reverse();
}

function apiActualizarDatos(codigo, campos) {
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
  return apiDetalle(codigo);
}

// ---------------------------------------------------------------------------
// API · GESTIÓN (enviar al área, redireccionar, responder, cerrar)
// ---------------------------------------------------------------------------
function _responsablePorId(id) {
  var lista = apiResponsables();
  for (var i = 0; i < lista.length; i++) if (String(lista[i].id) === String(id)) return lista[i];
  return null;
}

/** Envía la PQRS al área responsable y avisa al usuario que pasó a gestión. */
function apiEnviarAlArea(codigo, idResponsable, nota) {
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
    fechaMax: base.fechaMax, responsable: base.responsable,
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
  var r1 = _enviar(resp.correo, "[SOLICITUD INTERNA · PQRS " + codigo + "] " + (f[C.TIPO_PQRS - 1] || "") + " – " +
    (base.servicio || "") + (base.fechaMax ? " · vence " + base.fechaMax : ""),
    "Solicitud interna de gestión — PQRS " + codigo + ".", htmlArea);
  if (!r1.ok) return { ok: false, mensaje: "No se pudo enviar al área: " + r1.error };

  h.getRange(fila, C.RESPONSABLE).setValue(base.responsable);
  h.getRange(fila, C.CORREO_RESP).setValue(resp.correo);
  h.getRange(fila, C.FECHA_ENVIO_AREA).setValue(new Date());
  h.getRange(fila, C.NOTIF_AREA).setValue(new Date());
  h.getRange(fila, C.ESTADO).setValue("En gestión");
  SpreadsheetApp.flush();
  _traza(codigo, "Enviada al área", resp.area + " (" + resp.correo + ")" + (nota ? " · Nota: " + nota : ""));

  // Aviso al usuario de que su PQRS está en gestión
  var avisoUsuario = "el usuario no dejó correo";
  var correoUsr = f[C.CORREO - 1];
  if (_correoOk(correoUsr)) {
    var htmlUsr = _plantilla({
      codigo: codigo, tipo: f[C.TIPO_PQRS - 1], estado: "En gestión",
      sede: base.sede, servicio: base.servicio, fechaRadicacion: base.fechaRadicacion,
      fechaMax: base.fechaMax,
      titulo: "Su solicitud está en trámite",
      mensaje: "Le informamos que su <b>" + (f[C.TIPO_PQRS - 1] || "solicitud") + "</b> fue revisada por la Oficina de " +
        "Atención al Usuario y se encuentra en trámite con el área encargada." +
        (base.fechaMax ? " Recibirá nuestra respuesta a más tardar el <b>" + base.fechaMax + "</b>." : "") +
        "<br><br>No requiere hacer nada: le escribiremos apenas tengamos la respuesta.",
    });
    var r2 = _enviar(correoUsr, "Su PQRS " + codigo + " está en trámite", "Su PQRS " + codigo + " está en trámite.", htmlUsr);
    if (r2.ok) {
      h.getRange(fila, C.NOTIF_GESTION).setValue(new Date());
      avisoUsuario = "enviado a " + correoUsr;
      _traza(codigo, "Notificación al usuario", "Aviso de «en gestión» enviado a " + correoUsr);
    } else { avisoUsuario = "error: " + r2.error; }
  }

  var det = apiDetalle(codigo);
  det.aviso = { area: "enviado a " + resp.correo, usuario: avisoUsuario };
  return det;
}

/** Corrige un direccionamiento equivocado: notifica al área correcta y deja el registro. */
function apiRedireccionar(codigo, idResponsable, motivo) {
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
    fechaMax: base.fechaMax, responsable: nuevo.area,
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
  return apiDetalle(codigo);
}

/** Guarda la respuesta que el área envió por correo interno. */
function apiRegistrarRespuestaArea(codigo, texto, fecha) {
  var fila = _filaDe(codigo);
  if (fila < 0) return { ok: false, mensaje: "Radicado no encontrado." };
  if (!texto) return { ok: false, mensaje: "Pega la respuesta que envió el área." };
  var h = _h(CFG.HOJA_DATOS);
  h.getRange(fila, C.RTA_AREA).setValue(texto);
  h.getRange(fila, C.FECHA_RTA_AREA).setValue(_fechaDeTexto(fecha) || new Date());
  SpreadsheetApp.flush();
  _traza(codigo, "Respuesta del área registrada", texto.substring(0, 300));
  return apiDetalle(codigo);
}

/** Envía al usuario la respuesta final ajustada por el SIAU y cierra la PQRS. */
function apiResponderUsuario(codigo, textoFinal, cerrar) {
  var fila = _filaDe(codigo);
  if (fila < 0) return { ok: false, mensaje: "Radicado no encontrado." };
  if (!textoFinal) return { ok: false, mensaje: "Escribe la respuesta para el usuario." };

  var h = _h(CFG.HOJA_DATOS);
  var f = h.getRange(fila, 1, 1, CFG.NCOL).getValues()[0];
  var correoUsr = f[C.CORREO - 1];
  if (!_correoOk(correoUsr)) {
    h.getRange(fila, C.RTA_USUARIO).setValue(textoFinal);
    h.getRange(fila, C.FECHA_RTA_USUARIO).setValue(new Date());
    if (cerrar !== false) h.getRange(fila, C.ESTADO).setValue("Respondida - Cerrada");
    SpreadsheetApp.flush();
    _traza(codigo, "Respuesta al usuario", "Registrada sin envío: el usuario no tiene correo. Entregar por otro medio.");
    var det0 = apiDetalle(codigo);
    det0.aviso = { usuario: "sin correo: entrega la respuesta por teléfono o físicamente" };
    return det0;
  }

  var base = _datosCorreo(f);
  var html = _plantilla({
    codigo: codigo, tipo: f[C.TIPO_PQRS - 1], estado: "Respondida - Cerrada",
    sede: base.sede, servicio: base.servicio, fechaRadicacion: base.fechaRadicacion,
    fechaMax: base.fechaMax, responsable: f[C.RESPONSABLE - 1],
    titulo: "Respuesta a su solicitud",
    mensaje: "Damos respuesta a su <b>" + (f[C.TIPO_PQRS - 1] || "solicitud") + "</b> radicada el " +
      base.fechaRadicacion + ".",
    respuesta: textoFinal,
  });
  var r = _enviar(correoUsr, "Respuesta a su PQRS " + codigo, textoFinal, html);
  if (!r.ok) return { ok: false, mensaje: "No se pudo enviar: " + r.error };

  h.getRange(fila, C.RTA_USUARIO).setValue(textoFinal);
  h.getRange(fila, C.FECHA_RTA_USUARIO).setValue(new Date());
  h.getRange(fila, C.NOTIF_CIERRE).setValue(new Date());
  if (cerrar !== false) h.getRange(fila, C.ESTADO).setValue("Respondida - Cerrada");
  SpreadsheetApp.flush();
  _traza(codigo, "Respuesta enviada al usuario", "A " + correoUsr + " · " + textoFinal.substring(0, 250));

  var det = apiDetalle(codigo);
  det.aviso = { usuario: "enviado a " + correoUsr };
  return det;
}

/** Reenvía una notificación que falló o que el área dice no haber recibido. */
function apiReenviar(codigo, tipo) {
  var fila = _filaDe(codigo);
  if (fila < 0) return { ok: false, mensaje: "Radicado no encontrado." };
  var f = _h(CFG.HOJA_DATOS).getRange(fila, 1, 1, CFG.NCOL).getValues()[0];
  var base = _datosCorreo(f);

  if (tipo === "area") {
    if (!_correoOk(f[C.CORREO_RESP - 1])) return { ok: false, mensaje: "Esta PQRS aún no tiene área asignada." };
    var html = _plantilla({ interno: true, sinProgreso: true,
      codigo: codigo, tipo: f[C.TIPO_PQRS - 1], estado: f[C.ESTADO - 1],
      sede: base.sede, servicio: base.servicio, fechaRadicacion: base.fechaRadicacion, fechaMax: base.fechaMax,
      responsable: f[C.RESPONSABLE - 1],
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
function apiDashboard(filtros) {
  filtros = filtros || {};
  var h = _h(CFG.HOJA_DATOS);
  var n = CFG.FILA_FIN - CFG.FILA_DATOS + 1;
  var datos = h.getRange(CFG.FILA_DATOS, 1, n, CFG.NCOL).getValues();

  var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  var desde = null;
  if (filtros.periodo === "mes") desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  else if (filtros.periodo === "trimestre") desde = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);
  else if (filtros.periodo === "anio") desde = new Date(hoy.getFullYear(), 0, 1);

  var res = {
    total: 0, enTermino: 0, porVencer: 0, vencidas: 0, cerradas: 0, abiertas: 0,
    felicitaciones: 0, porRevisar: 0, sinArea: 0, aTiempo: 0, fueraTermino: 0,
    sumDias: 0, nDias: 0, sumRespArea: 0, nRespArea: 0,
    porEstado: {}, porTipo: {}, porCanal: {}, porSede: {}, porServicio: {},
    porMes: {}, porMesCerradas: {}, porResponsable: {}, porSemaforo: {},
    criticas: [], sedes: [], servicios: [],
  };
  var mas = function (o, k) { if (!k) return; o[k] = (o[k] || 0) + 1; };
  var sedesSet = {}, serviciosSet = {};

  datos.forEach(function (f) {
    if (!f[C.CODIGO - 1]) return;
    var sede = f[C.SEDE - 1], servicio = f[C.SERVICIO - 1];
    if (sede) sedesSet[sede] = true;
    if (servicio) serviciosSet[servicio] = true;

    var fr = f[C.FECHA_RADICACION - 1];
    if (desde && (!(fr instanceof Date) || fr < desde)) return;
    if (filtros.sede && sede !== filtros.sede) return;
    if (filtros.servicio && servicio !== filtros.servicio) return;

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

    var estado = f[C.ESTADO - 1] || "Recibida";
    var cerrada = _norm(estado).indexOf("cerrada") !== -1;
    if (!cerrada) res.abiertas++;
    mas(res.porEstado, estado);
    mas(res.porTipo, f[C.TIPO_PQRS - 1]);
    mas(res.porCanal, f[C.CANAL - 1]);
    mas(res.porSede, sede);
    mas(res.porServicio, servicio);
    if (f[C.RESPONSABLE - 1]) mas(res.porResponsable, f[C.RESPONSABLE - 1].toString().split(" · ")[0]);
    if (!f[C.CORREO_RESP - 1] && !cerrada && !_esFeli(f[C.TIPO_PQRS - 1])) res.sinArea++;

    if (fr instanceof Date && !isNaN(fr)) {
      var k = Utilities.formatDate(fr, Session.getScriptTimeZone() || "America/Bogota", "yyyy-MM");
      mas(res.porMes, k);
      if (cerrada) mas(res.porMesCerradas, k);
    }

    var op = (f[C.OPORTUNIDAD - 1] || "").toString();
    if (op === "A tiempo") res.aTiempo++;
    else if (op === "Fuera de término") res.fueraTermino++;
    if (op && typeof f[C.DIAS - 1] === "number") { res.sumDias += f[C.DIAS - 1]; res.nDias++; }

    var fEnvio = f[C.FECHA_ENVIO_AREA - 1], fRta = f[C.FECHA_RTA_AREA - 1];
    if (fEnvio instanceof Date && fRta instanceof Date) {
      res.sumRespArea += Math.max(0, Math.round((fRta - fEnvio) / 86400000));
      res.nRespArea++;
    }

    if (sem.indexOf("🔴") === 0 || sem.indexOf("🟡") === 0 || sem.indexOf("⚠") === 0) {
      res.criticas.push({
        codigo: f[C.CODIGO - 1], semaforo: etiquetaSem, nivel: sem.indexOf("🔴") === 0 ? "alto" : (sem.indexOf("🟡") === 0 ? "medio" : "dato"),
        tipo: f[C.TIPO_PQRS - 1], sede: sede, servicio: servicio,
        responsable: f[C.RESPONSABLE - 1] || "Sin asignar",
        fechaMax: _fmt(f[C.FECHA_MAX - 1]), dias: f[C.DIAS - 1],
      });
    }
  });

  res.promedioDias = res.nDias ? Math.round(res.sumDias / res.nDias * 10) / 10 : 0;
  res.promedioArea = res.nRespArea ? Math.round(res.sumRespArea / res.nRespArea * 10) / 10 : 0;
  res.cumplimiento = (res.aTiempo + res.fueraTermino)
    ? Math.round(res.aTiempo / (res.aTiempo + res.fueraTermino) * 100) : null;
  res.tasaCierre = res.total ? Math.round((res.total - res.abiertas) / res.total * 100) : 0;
  res.criticas.sort(function (a, b) { return (a.fechaMax || "") < (b.fechaMax || "") ? -1 : 1; });
  res.criticas = res.criticas.slice(0, 30);
  res.sedes = Object.keys(sedesSet).sort();
  res.servicios = Object.keys(serviciosSet).sort();
  return res;
}

// ---------------------------------------------------------------------------
// API · GOOGLE FORM EXISTENTE
// ---------------------------------------------------------------------------
/** Lee las preguntas de un Form ya creado (por URL o ID) o de su hoja de respuestas. */
function apiLeerFormulario(urlOId) {
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
  var ss = SpreadsheetApp.getActiveSpreadsheet();
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

function apiGuardarMapeo(mapa, idForm, hojaRespuestas) {
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
function apiImportarRespuestasForm(opciones) {
  opciones = opciones || {};
  var notificar = (opciones.notificar === false) ? false : true;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
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
    apiGuardarMapeo(mapeo, _param(6) || "", nombreHoja || hr.getName());
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
  var existentes = hd.getRange(CFG.FILA_DATOS, 1, n, CFG.NCOL).getValues();
  var vistos = {};
  existentes.forEach(function (f) {
    if (f[C.CODIGO - 1]) vistos[_clave(f[C.MARCA - 1], f[C.DESCRIPCION - 1])] = true;
  });

  var importadas = 0, acusados = 0, sinCorreo = 0;
  var noReconocidos = [];
  var limite = new Date(); limite.setDate(limite.getDate() - CFG.DIAS_ACUSE);
  for (var i = 1; i < filas.length; i++) {
    var fr = filas[i];
    if (!fr[0]) continue;
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

    var soloFecha = new Date(marca.getFullYear(), marca.getMonth(), marca.getDate());
    var fila = _proximaFila();
    var codigo = _nuevoCodigo(soloFecha);
    var vals = {};
    vals[C.CODIGO] = codigo;
    vals[C.CANAL] = "QR - Formulario";
    vals[C.MARCA] = marca;
    vals[C.FECHA_PQRS] = _fechaDeTexto(d.fechaPqrs) || soloFecha;
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
    _escribir(fila, vals);
    vistos[_clave(marca, d.descripcion)] = true;
    importadas++;
    _traza(codigo, "Radicación", "Importada del formulario QR (" + _fmt(marca) + ")");

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
  var cab = cfg.getRange(L, 1, 1, 14).getValues()[0];
  var cuerpo = cfg.getRange(L + 1, 1, 50, 14).getValues();
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
function apiEstadoFormulario() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
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
      var hd = _h(CFG.HOJA_DATOS);
      var n = CFG.FILA_FIN - CFG.FILA_DATOS + 1;
      var existentes = hd.getRange(CFG.FILA_DATOS, 1, n, CFG.NCOL).getValues();
      var vistos = {};
      existentes.forEach(function (f) {
        if (f[C.CODIGO - 1]) vistos[_clave(f[C.MARCA - 1], f[C.DESCRIPCION - 1])] = true;
      });
      for (var i = 1; i < filas.length; i++) {
        if (!filas[i][0]) continue;
        var m = filas[i][0] instanceof Date ? filas[i][0] : new Date(filas[i][0]);
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

function _clave(marca, desc) {
  var m = (marca instanceof Date) ? marca.getTime() : String(marca);
  return m + "|" + (desc || "").toString().substring(0, 60);
}

function onFormSubmit_(e) {
  try { apiImportarRespuestasForm(); } catch (err) { Logger.log(err); }
}

// ---------------------------------------------------------------------------
// ALERTA DIARIA
// ---------------------------------------------------------------------------
function rutinaDiaria() {
  var d = apiDashboard();
  if (!d.vencidas && !d.porVencer && !d.porRevisar) return;
  var resp = apiResponsables();
  var destino = "";
  resp.forEach(function (r) {
    if (!destino && _norm(r.area).indexOf("calidad") !== -1 && _correoOk(r.correo)) destino = r.correo;
  });
  if (!destino) resp.forEach(function (r) { if (!destino && _correoOk(r.correo)) destino = r.correo; });
  if (!destino) { Logger.log("Sin correo de escalamiento en Responsables."); return; }

  var filas = d.criticas.map(function (v) {
    return '<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;font:bold 12px Arial,sans-serif;color:#006081;">' + v.codigo +
      '</td><td style="padding:6px 10px;border-bottom:1px solid #eee;font:12px Arial,sans-serif;">' + (v.sede || "") + " / " + (v.servicio || "") +
      '</td><td style="padding:6px 10px;border-bottom:1px solid #eee;font:12px Arial,sans-serif;">' + v.responsable +
      '</td><td style="padding:6px 10px;border-bottom:1px solid #eee;font:12px Arial,sans-serif;">' + v.semaforo +
      '</td><td style="padding:6px 10px;border-bottom:1px solid #eee;font:12px Arial,sans-serif;color:#C2183A;">' + (v.fechaMax || "") + '</td></tr>';
  }).join("");

  var html = '<div style="background:#EEF2F4;padding:24px 12px;font-family:Arial,sans-serif;">' +
    '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">' +
    '<table width="680" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E1E8EB;">' +
    '<tr><td style="background:#fff;padding:20px 26px 14px;"><img src="cid:logoNiRed" width="130" alt="MiRed IPS" style="display:block;border:0;"/></td></tr>' +
    '<tr><td style="height:4px;background:#006081;font-size:0;">&nbsp;</td></tr>' +
    '<tr><td style="padding:22px 26px;">' +
    '<div style="font:bold 17px Arial,sans-serif;color:#004A63;">Control diario de PQRS</div>' +
    '<div style="font:12px Arial,sans-serif;color:#667;margin-bottom:14px;">Corte al ' + _fmt(new Date()) + '</div>' +
    '<div style="font:13px Arial,sans-serif;color:#333;margin-bottom:14px;">🔴 ' + d.vencidas + ' vencidas &nbsp;·&nbsp; 🟡 ' +
    d.porVencer + ' por vencer &nbsp;·&nbsp; ⚠ ' + d.porRevisar + ' por corregir &nbsp;·&nbsp; ' +
    d.sinArea + ' sin área asignada</div>' +
    '<table width="100%" style="border-collapse:collapse;"><tr style="background:#F7FAFB;">' +
    '<th align="left" style="padding:6px 10px;font:bold 11px Arial,sans-serif;color:#667;">Radicado</th>' +
    '<th align="left" style="padding:6px 10px;font:bold 11px Arial,sans-serif;color:#667;">Sede / Servicio</th>' +
    '<th align="left" style="padding:6px 10px;font:bold 11px Arial,sans-serif;color:#667;">Responsable</th>' +
    '<th align="left" style="padding:6px 10px;font:bold 11px Arial,sans-serif;color:#667;">Estado</th>' +
    '<th align="left" style="padding:6px 10px;font:bold 11px Arial,sans-serif;color:#667;">Vence</th></tr>' +
    filas + '</table></td></tr></table></td></tr></table></div>';

  _enviar(destino, "Control PQRS – " + d.vencidas + " vencidas, " + d.porVencer + " por vencer (" + _fmt(new Date()) + ")",
    "Vencidas: " + d.vencidas + " · Por vencer: " + d.porVencer, html);
}

// =====================================================================================
// INICIO · QUÉ HAY QUE HACER HOY
// =====================================================================================
function apiResumenHoy() {
  var h = _h(CFG.HOJA_DATOS);
  var n = CFG.FILA_FIN - CFG.FILA_DATOS + 1;
  var datos = h.getRange(CFG.FILA_DATOS, 1, n, CFG.NCOL).getValues();
  var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  var enOchoDias = new Date(hoy.getTime() + 8 * 86400000);

  var r = { sinDireccionar: 0, enGestion: 0, porResponder: 0, vencidas: 0, porVencer: 0,
            cerradasMes: 0, total: 0, correosPendientes: 0, formPendientes: 0, urgentes: [] };

  datos.forEach(function (f) {
    if (!f[C.CODIGO - 1]) return;
    r.total++;
    var est = _norm(f[C.ESTADO - 1]);
    var cerrada = est.indexOf("cerrada") !== -1;
    var conArea = !!f[C.CORREO_RESP - 1];
    var conRta = !!(f[C.RTA_AREA - 1] || "").toString().trim();
    var sem = (f[C.SEMAFORO - 1] || "").toString();
    var fMax = f[C.FECHA_MAX - 1];

    if (cerrada) {
      var fr = f[C.FECHA_RTA_USUARIO - 1] || f[C.FECHA_RESPUESTA_USUARIO - 1];
      if (fr instanceof Date && fr.getMonth() === hoy.getMonth() && fr.getFullYear() === hoy.getFullYear()) r.cerradasMes++;
      return;
    }
    if (!conArea) r.sinDireccionar++;
    else if (!conRta) r.enGestion++;
    if (conRta) r.porResponder++;
    if (sem.indexOf("🔴") === 0) r.vencidas++;
    else if (sem.indexOf("🟡") === 0 || (fMax instanceof Date && fMax <= enOchoDias)) r.porVencer++;

    if (sem.indexOf("🔴") === 0 || sem.indexOf("🟡") === 0) {
      r.urgentes.push({
        codigo: f[C.CODIGO - 1], semaforo: sem, tipo: f[C.TIPO_PQRS - 1],
        sede: f[C.SEDE - 1], servicio: f[C.SERVICIO - 1],
        responsable: f[C.RESPONSABLE - 1] || "Sin asignar",
        fechaMax: _fmt(fMax),
      });
    }
  });

  r.urgentes.sort(function (a, b) { return (a.fechaMax || "") < (b.fechaMax || "") ? -1 : 1; });
  r.urgentes = r.urgentes.slice(0, 8);

  try { r.correosPendientes = apiCorreosPendientes(true).length; } catch (e) { r.correosPendientes = -1; }
  try {
    var est = apiEstadoFormulario();
    r.formPendientes = est.pendientes || 0;
  } catch (e) { r.formPendientes = 0; }

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
function apiCorreosPendientes(soloContar) {
  var procesado = _etiqueta_(CFG.GMAIL_PROCESADO);
  var descartado = _etiqueta_(CFG.GMAIL_DESCARTADO);
  var etiqueta = GmailApp.getUserLabelByName(CFG.GMAIL_LABEL);

  var hilos = [];
  if (etiqueta) hilos = etiqueta.getThreads(0, 40);
  var busqueda = 'in:inbox newer_than:30d -label:"' + CFG.GMAIL_PROCESADO + '" -label:"' + CFG.GMAIL_DESCARTADO + '"';
  GmailApp.search(busqueda, 0, 40).forEach(function (t) {
    var rep = false;
    hilos.forEach(function (x) { if (x.getId() === t.getId()) rep = true; });
    if (!rep) hilos.push(t);
  });

  var yaRadicados = {};
  var h = _h(CFG.HOJA_DATOS);
  var n = CFG.FILA_FIN - CFG.FILA_DATOS + 1;
  h.getRange(CFG.FILA_DATOS, C.ID_CORREO, n, 1).getValues().forEach(function (x) {
    if (x[0]) yaRadicados[x[0]] = true;
  });

  var out = [];
  hilos.forEach(function (hilo) {
    var etiquetas = hilo.getLabels().map(function (l) { return l.getName(); });
    if (etiquetas.indexOf(CFG.GMAIL_PROCESADO) !== -1 || etiquetas.indexOf(CFG.GMAIL_DESCARTADO) !== -1) return;

    hilo.getMessages().forEach(function (msg) {
      var id = msg.getId();
      if (yaRadicados[id]) return;

      var asunto = msg.getSubject() || "";
      var cuerpo = msg.getPlainBody() || "";
      var texto = _norm(asunto + " " + cuerpo);
      var coincide = etiquetas.indexOf(CFG.GMAIL_LABEL) !== -1;
      var claves = [];
      PALABRAS_PQRS.forEach(function (k) {
        if (texto.indexOf(_norm(k)) !== -1 && claves.indexOf(k) === -1) claves.push(k);
      });
      if (!coincide && !claves.length) return;

      if (soloContar) { out.push(1); return; }

      var de = msg.getFrom();
      out.push({
        id: id,
        fecha: Utilities.formatDate(msg.getDate(), Session.getScriptTimeZone() || "America/Bogota", "dd/MM/yyyy HH:mm"),
        fechaISO: Utilities.formatDate(msg.getDate(), Session.getScriptTimeZone() || "America/Bogota", "yyyy-MM-dd"),
        nombre: de.replace(/<.*>/, "").replace(/"/g, "").trim(),
        correo: (de.match(/<(.+)>/) || [null, de])[1],
        asunto: asunto,
        cuerpo: cuerpo.substring(0, 2500),
        claves: claves,
        etiquetado: etiquetas.indexOf(CFG.GMAIL_LABEL) !== -1,
        tipoSugerido: _detectarTipo_(asunto + " " + cuerpo),
      });
    });
  });
  return out;
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
function apiRadicarCorreo(idMsg, d) {
  if (!idMsg) return { ok: false, mensaje: "Falta el identificador del correo." };
  var msg;
  try { msg = GmailApp.getMessageById(idMsg); } catch (e) { return { ok: false, mensaje: "No pude abrir ese correo." }; }
  if (!d.descripcion) return { ok: false, mensaje: "La descripción no puede quedar vacía." };
  if (!d.tipoPqrs) return { ok: false, mensaje: "Indica el tipo de PQRS." };

  var fecha = _fechaDeTexto(d.fechaRecepcion) || msg.getDate();
  var soloFecha = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  var fila = _proximaFila();
  var codigo = _nuevoCodigo(soloFecha);
  var esFeli = _esFeli(d.tipoPqrs);

  var vals = {};
  vals[C.CODIGO] = codigo;
  vals[C.CANAL] = "Correo electrónico";
  vals[C.MARCA] = msg.getDate();
  vals[C.FECHA_PQRS] = _fechaDeTexto(d.fechaPqrs) || soloFecha;
  vals[C.FECHA_RECEPCION] = soloFecha;
  vals[C.FECHA_RADICACION] = soloFecha;
  vals[C.ESTADO] = "Recibida";
  vals[C.REDIRECCIONES] = 0;
  vals[C.DEPARTAMENTO] = "ATLÁNTICO";
  vals[C.REGISTRADO_POR] = _usuario();
  vals[C.ID_CORREO] = idMsg;
  vals[C.ENTIDAD] = esFeli ? "" : (d.entidad || "SEDE");
  vals[C.OBSERVACIONES] = "Radicado desde correo: " + (msg.getSubject() || "");

  ["tipoPqrs","descripcion","nombreSolicitante","correo","telefono","sede","servicio",
   "tipoSolicitante","numDocSolicitante","tipoDocSolicitante","eps","regimen"].forEach(function (k) {
    if (d[k]) vals[CAMPOS[k]] = d[k];
  });

  _escribir(fila, vals);
  SpreadsheetApp.flush();
  _traza(codigo, "Radicación", "Correo de " + (d.correo || "") + " aprobado por " + _usuario() +
    " · asunto: " + (msg.getSubject() || ""));

  try { msg.getThread().addLabel(_etiqueta_(CFG.GMAIL_PROCESADO)); } catch (e) {}
  var acuse = _acuseRecepcion_(fila);

  return { ok: true, codigo: codigo, acuse: acuse };
}

/** Marca un correo como «no es PQRS» para que no vuelva a aparecer. */
function apiDescartarCorreo(idMsg, motivo) {
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
  var ss = SpreadsheetApp.getActiveSpreadsheet();
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

function apiPlantillas() {
  var h = _hojaPlantillas_();
  var ultima = h.getLastRow();
  if (ultima < 2) return [];
  return h.getRange(2, 1, ultima - 1, 3).getValues()
    .filter(function (r) { return r[1] && r[2]; })
    .map(function (r) { return { codigo: r[0], tipologia: r[1], texto: r[2] }; });
}

function apiGuardarPlantilla(tipologia, texto) {
  if (!tipologia || !texto) return { ok: false, mensaje: "Faltan la tipología y el texto." };
  var h = _hojaPlantillas_();
  var n = h.getLastRow();
  h.appendRow(["T" + n, tipologia, texto]);
  _traza("—", "Plantilla creada", tipologia);
  return { ok: true, plantillas: apiPlantillas() };
}
