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
  var ss = SpreadsheetApp.getActiveSpreadsheet();
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
  apiResponsables().forEach(function (r) { if (r.correo) correosAreas[r.correo.toString().trim().toLowerCase()] = r.area; });
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

function apiCorreos(soloResumen) {
  _etiqueta_(CFG.GMAIL_PROCESADO);
  _etiqueta_(CFG.GMAIL_DESCARTADO);
  var etiqueta = GmailApp.getUserLabelByName(CFG.GMAIL_LABEL);
  var ctx = _contexto_();

  var hilos = [], vistos = {};
  var agregar = function (t) { if (!vistos[t.getId()]) { vistos[t.getId()] = true; hilos.push(t); } };
  if (etiqueta) etiqueta.getThreads(0, 30).forEach(agregar);
  GmailApp.search('in:inbox newer_than:45d -label:"' + CFG.GMAIL_DESCARTADO + '" -category:promotions -category:social', 0, 60).forEach(agregar);

  var items = [], res = { pqrs: 0, cita: 0, curso: 0, area: 0, usuario: 0, rebote: 0, otro: 0, sistema: 0 };

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

    if (info && info.estado && !codigo) {
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
    it.nuevo = !!(info && ultimoExt && ultimoExt.getDate().getTime() > (info.fecha || 0));
    it.ultimoRol = rolUltimo;
    it.pendientes = pendientes.length;
    items.push(it);
  });

  items.sort(function (a, b) { return b.ts - a.ts; });
  res.relevantes = res.pqrs + res.cita + res.curso + res.area + res.usuario + res.rebote;
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
function apiHilo(hiloId) {
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
  return { ok: true, hiloId: hiloId, asunto: primero.asunto || "", codigo: codigo, info: info,
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
function apiAdjunto(msgId, idx) {
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
function apiGuardarAdjuntoDrive(msgId, idx, codigo) {
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
function _correoHilo_(o) {
  var lista = (o.lista && o.lista.length)
    ? '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 14px;">' + o.lista.map(function (x) {
        return '<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#006081;font-family:' + FF + ';font-size:14px;">&#9679;</td>' +
               '<td style="padding:4px 0;font-family:' + FF + ';font-size:14px;color:#2B3A42;">' + _html_(x) + '</td></tr>';
      }).join("") + '</table>' : "";
  var cita = o.cita ? '<div style="margin-top:14px;border-left:3px solid #94A3AB;background:#F6F9FA;padding:10px 14px;border-radius:0 8px 8px 0;' +
      'font-family:' + FF + ';font-size:12.5px;line-height:1.6;color:#4C626D;white-space:pre-wrap;"><b>' + _html_(o.citaTitulo || "Mensaje original") + '</b><br/>' + _html_(o.cita) + '</div>' : "";
  return '<div style="background:#EDF2F4;padding:22px 10px;font-family:' + FF + ';">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #DDE6EA;">' +
    '<tr><td style="padding:18px 26px 12px;"><img src="cid:logoNiRed" width="112" alt="MiRed IPS" style="display:block;border:0;"/></td></tr>' +
    '<tr><td style="font-size:0;line-height:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
      '<td style="height:4px;background:' + (o.interno ? "#B98A00" : "#006081") + ';width:70%;"></td><td style="height:4px;background:#E20A31;width:10%;"></td>' +
      '<td style="height:4px;background:#FEDC00;width:10%;"></td><td style="height:4px;background:#009C4D;width:10%;"></td></tr></table></td></tr>' +
    (o.interno ? '<tr><td style="background:#FBF3DC;padding:8px 26px;font-family:' + FF + ';font-weight:700;font-size:11px;color:#8A6400;letter-spacing:.05em;">' + _html_(o.interno) + '</td></tr>' : '') +
    '<tr><td style="padding:22px 26px 8px;">' +
      (o.titulo ? '<div style="font-family:' + FT + ';font-weight:900;font-size:19px;color:#00475F;margin-bottom:10px;">' + _html_(o.titulo) + '</div>' : '') +
      '<div style="font-family:' + FF + ';font-size:14px;line-height:1.65;color:#2B3A42;white-space:pre-wrap;">' + _html_(o.mensaje || "") + '</div>' +
      lista + (o.cierre ? '<div style="font-family:' + FF + ';font-size:14px;line-height:1.65;color:#2B3A42;white-space:pre-wrap;">' + _html_(o.cierre) + '</div>' : '') +
      cita +
    '</td></tr>' +
    '<tr><td style="padding:16px 26px 20px;"><div style="border-top:1px solid #E6EDF0;padding-top:12px;font-family:' + FF + ';font-size:11px;line-height:1.7;color:#8398A3;">' +
      'Oficina de Atención al Usuario (SIAU) · MiRed Barranquilla IPS S.A.S.<br/>' + MARCA_SISTEMA + '.</div></td></tr>' +
    '</table></td></tr></table></div>';
}
function _html_(t) { return (t || "").toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function _opcionesCorreo_(extra) {
  var o = { name: CFG.REMITENTE, inlineImages: { logoNiRed: Utilities.newBlob(Utilities.base64Decode(LOGO_BASE64), "image/png", "logo.png") } };
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
function apiSolicitarDatos(hiloId, o) {
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
function apiDireccionarHilo(hiloId, o) {
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
function apiResponderHilo(hiloId, o) {
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
function apiEscribirArea(hiloId, o) {
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
function apiCerrarHilo(hiloId, nota) {
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
