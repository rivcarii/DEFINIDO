
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
var ENT_COLS = ["TIPO", "ENTIDAD", "DOMINIOS O CORREOS (separados por ;)", "ENTIDAD PRESENTADA", "PRIORIDAD", "AVISAR A (correos)", "ACTIVA"];
var ENTIDADES_BASE = [
  ["Ente de control", "Secretaría de Salud Distrital de Barranquilla", "@barranquilla.gov.co", "SECRETARIA DE SALUD", "Crítica", "", "SI"],
  ["Ente de control", "Superintendencia Nacional de Salud (Supersalud)", "@supersalud.gov.co", "SUPERSALUD", "Crítica", "", "SI"],
  ["Ente de control", "Contraloría", "@contraloria.gov.co", "SUPERSALUD", "Crítica", "", "SI"],
  ["EPS", "Nueva EPS", "@nuevaeps.com.co", "EPS", "Alta", "", "SI"],
  ["EPS", "Famisanar", "@famisanar.com.co", "EPS", "Alta", "", "SI"],
  ["EPS", "Sura", "@sura.com.co", "EPS", "Alta", "", "SI"],
  ["EPS", "Mutual Ser", "@mutualser.org; @mutualser.com", "EPS", "Alta", "", "SI"],
  ["EPS (BPO)", "Mutual Ser - Affinity (BPO)", "@affinitybpo.com.co", "EPS", "Alta", "", "SI"],
  ["EPS", "Salud Total", "@saludtotal.com.co", "EPS", "Alta", "", "SI"],
  ["EPS", "EPS Familiar de Colombia", "@epsfamiliardecolombia.com", "EPS", "Alta", "", "SI"],
  ["EPS", "EPS Familiar de Colombia - Documental", "documental@miredips.org", "EPS", "Alta", "", "SI"],
  ["EPS", "Proteger EPS", "@protegereps.com", "EPS", "Alta", "", "SI"],
  ["EPS", "Sanitas", "@epssanitas.com", "EPS", "Alta", "", "SI"],
  ["EPS", "Coosalud", "@coosalud.com", "EPS", "Alta", "", "SI"],
];
var CAT_COLS = ["CATEGORÍA", "PALABRAS CLAVE (separadas por ;)", "PRIORIDAD", "DÍAS DE TÉRMINO", "TIPO DE DÍA", "META INTERNA (horas)", "TIPO DE PQRS"];
// Términos: Circular Externa Supersalud 2023151000000010-5 de 2023 (vital 24 h, priorizado 48 h, simple 72 h);
// derecho de petición 15 días hábiles (Ley 1755 de 2015); tutela: el que fije el juez (48 h por defecto).
var CATEGORIAS_BASE = [
  ["TUTELA", "accion de tutela; tutela; fallo de tutela; auto admisorio; desacato; medida provisional; juzgado", "Crítica", 2, "Calendario", 8, "Tutela"],
  ["SUPERSALUD RIESGO VITAL", "riesgo vital", "Crítica", 1, "Calendario", "", ""],
  ["SUPERSALUD RIESGO PRIORIZADO", "riesgo priorizado; priorizado; priorizada", "Alta", 2, "Calendario", "", ""],
  ["SUPERSALUD RIESGO SIMPLE", "riesgo simple", "Media", 3, "Calendario", "", ""],
  ["DERECHO DE PETICIÓN", "derecho de peticion; derecho fundamental de peticion; articulo 23 de la constitucion", "Alta", 15, "Hábiles", 8, "Petición"],
];
var PRIORIDADES = ["Crítica", "Alta", "Media", "Normal"];

function _hojaConfigTabla_(nombre, cols, base) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
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
             avisar: String(r[5] || "").split(/\s*[;,]\s*/).filter(_correoOk), activa: r[6] === "" || _si_(r[6]) };
  }).filter(function (e) { return e.entidad && e.patrones.length; });
}
function _categorias_() {
  var h = _hojaCategorias_(), u = h.getLastRow();
  if (u < 2) return [];
  return h.getRange(2, 1, u - 1, CAT_COLS.length).getValues().map(function (r, i) {
    return { fila: i + 2, nombre: String(r[0] || "").trim(), claves: String(r[1] || "").split(/\s*;\s*/).map(_norm).filter(String),
             prioridad: r[2] || "Media", dias: r[3], tipoDia: r[4], meta: parseFloat(r[5]) || 0, tipo: r[6] || "" };
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
                     webhookChat: "", chatModo: "todas", avisarA: "", avisosSede: true, desde: 0, alias: "" };
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
  h.getRange(fila, 1, 1, ENT_COLS.length).setValues([[e.tipo || "EPS", e.entidad, e.patrones, e.presentada || "EPS", e.prioridad || "Alta", e.avisar || "", e.activa === false ? "NO" : "SI"]]);
  _traza("—", "Entidad de correo guardada", e.entidad + " · " + e.patrones);
  return apiAjustes_();
}
function apiGuardarCategoria_(c) {
  var h = _hojaCategorias_();
  if (!c || !c.nombre || !c.claves) return { ok: false, mensaje: "Faltan el nombre y las palabras clave." };
  var fila = c.fila || h.getLastRow() + 1;
  h.getRange(fila, 1, 1, CAT_COLS.length).setValues([[String(c.nombre).toUpperCase(), c.claves, c.prioridad || "Media", c.dias || "", c.tipoDia || "Calendario", c.meta || "", c.tipo || ""]]);
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
  try { return _procesarCorreo_(); } finally { lock.releaseLock(); }
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
  cats.forEach(function (c) { if (c.meta) metas[_norm(c.nombre)] = c.meta; });
  var h = _h(CFG.HOJA_DATOS), n = CFG.FILA_FIN - CFG.FILA_DATOS + 1;
  var datos = h.getRange(CFG.FILA_DATOS, 1, n, CFG.NCOL).getValues();
  var props = PropertiesService.getScriptProperties(), enviados = {};
  try { enviados = JSON.parse(props.getProperty("ALERTAS_META") || "{}"); } catch (e) {}
  var ahora = Date.now(), alertas = [];
  datos.forEach(function (f) {
    var cod = f[C.CODIGO - 1], meta = metas[_norm(f[C.CLASIF_INTERNA - 1])];
    if (!cod || !meta || enviados[cod]) return;
    if (_norm(f[C.ESTADO - 1]).indexOf("cerrada") !== -1 || f[C.CORREO_RESP - 1]) return;   // ya en gestión
    var marca = f[C.MARCA - 1] instanceof Date ? f[C.MARCA - 1].getTime() : 0;
    if (!marca || ahora < marca + meta * 3600000) return;
    alertas.push(f); enviados[cod] = ahora;
  });
  if (!alertas.length) return { alertas: 0 };
  props.setProperty("ALERTAS_META", JSON.stringify(enviados));
  alertas.forEach(function (f) {
    var cod = f[C.CODIGO - 1];
    _traza(cod, "Alerta de meta interna", "Superó " + metas[_norm(f[C.CLASIF_INTERNA - 1])] + " h sin direccionar · " + f[C.CLASIF_INTERNA - 1]);
    _avisoChat_(_lineaChat_("[ALERTA]", cod, [f[C.CLASIF_INTERNA - 1], "más de " + metas[_norm(f[C.CLASIF_INTERNA - 1])] + " h sin direccionar", f[C.SEDE - 1]], "Vence " + _fmt(f[C.FECHA_MAX - 1])));
    var dest = _correosAviso_(f[C.SEDE - 1], []);
    if (dest.length) _enviar(dest.join(","), "[ALERTA PQRS] " + cod + " · " + f[C.CLASIF_INTERNA - 1] + " sin direccionar", cod,
      _correoHilo_({ interno: "ALERTA DE VENCIMIENTO", kicker: f[C.TIPO_PQRS - 1], codigo: cod, titulo: "Requiere atención inmediata",
        mensaje: "Esta " + String(f[C.CLASIF_INTERNA - 1] || "PQRS").toLowerCase() + " superó la meta interna de " + metas[_norm(f[C.CLASIF_INTERNA - 1])] +
          " horas y aún no se ha direccionado al área responsable.",
        fechas: { hechos: _fmt(f[C.FECHA_PQRS - 1]), recepcion: Utilities.formatDate(f[C.MARCA - 1], _tz_(), "dd/MM/yyyy HH:mm"), radicacion: _fmt(f[C.FECHA_RADICACION - 1]), max: _fmt(f[C.FECHA_MAX - 1]) },
        detalles: [["Clasificación", f[C.CLASIF_INTERNA - 1]], ["Sede", f[C.SEDE - 1]]],
        boton: { texto: "Direccionar ahora", url: _urlPlataforma_(cod) } }));
  });
  return { alertas: alertas.length };
}
