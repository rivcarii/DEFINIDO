
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
    try { _TZ = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(); } catch (e) {}
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
var ESQUEMA = "5";

function repararFechasYFormulas() {   // también disponible en el menú PQRS
  var r = _migrar_(true);
  try { SpreadsheetApp.getUi().alert(r.mensaje); } catch (e) {}
  return r;
}

function _migrar_(forzar) {
  var props = PropertiesService.getScriptProperties();
  if (!forzar && props.getProperty("ESQUEMA") === ESQUEMA) return { ok: true, hecho: false, mensaje: "" };

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { ok: false, hecho: false, mensaje: "" };
  try {
    if (!forzar && props.getProperty("ESQUEMA") === ESQUEMA) return { ok: true, hecho: false, mensaje: "" };
    var h = _h(CFG.HOJA_DATOS);
    var enc = h.getRange(CFG.FILA_DATOS - 1, 1, 1, CFG.NCOL).getValues()[0].map(function (x) { return _norm(x); });
    if (enc[C.TERMINO - 1].indexOf("termino") === -1 || enc[C.DIAS - 1].indexOf("dias") === -1) {
      return { ok: false, hecho: false, mensaje: "Los encabezados del consolidado no coinciden con la versión esperada; no se tocaron las fórmulas." };
    }
    var fin = Math.max(CFG.FILA_FIN, h.getLastRow());
    var n = fin - CFG.FILA_DATOS + 1;

    // 1) Fechas sin hora: se lleva cada valor a la medianoche que le corresponde.
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

    // 2) Fórmulas de términos con INT() y búsqueda tolerante de la entidad.
    var ef = _escribirFormulas_(h, fin);
    if (!ef.ok) return { ok: false, hecho: false, mensaje: ef.mensaje };

    props.setProperty("ESQUEMA", ESQUEMA);
    _traza("—", "Actualización v5", "Fechas ajustadas: " + corregidas + " · fórmulas de términos y días reescritas con INT() y búsqueda tolerante de entidad");
    return { ok: true, hecho: true, corregidas: corregidas,
             mensaje: "Consolidado actualizado a la versión 5: días transcurridos en números enteros y término tolerante a la entidad presentada" +
                      (corregidas ? " · " + corregidas + " fecha(s) corregida(s)." : ".") };
  } finally {
    lock.releaseLock();
  }
}

/** Fórmulas (sintaxis en inglés) de una fila del consolidado: AF..AJ y AT. */
function _formulasFila_(r) {
  var T = "Config!$A$6:$D$9", FEST = "Config!$F$6:$F$39", UMB = "Config!$B$12";
  var AE = "$AE" + r, E = "$E" + r, AS = "$AS" + r, AH = "$AH" + r, AF = "$AF" + r, AG = "$AG" + r;
  var FELI = 'LEFT(UPPER(TRIM($AA' + r + ')),8)="FELICITA"';
  var U = "UPPER(TRIM(" + AE + "))";
  var KEY = 'IF(LEFT(' + U + ',5)="SUPER","SUPER SALUD",IF(LEFT(' + U + ',8)="SECRETAR","SECRETARIA DE SALUD",' +
            'IF(LEFT(' + U + ',4)="SEDE","SEDE",' + U + ')))';
  var busca = function (col, falla) {
    return 'IFERROR(VLOOKUP(' + U + ',' + T + ',' + col + ',FALSE),IFERROR(VLOOKUP(' + KEY + ',' + T + ',' + col + ',FALSE),' + falla + '))';
  };
  return {
    bloque: [
      '=IF($AA' + r + '="","",IF(' + FELI + ',"N/A",IF(' + AE + '="","",' + busca(2, '"⚠"') + ')))',
      '=IF($AA' + r + '="","",IF(' + FELI + ',"N/A",IF(' + AE + '="","",' + busca(3, '""') + ')))',
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
  var f1 = [], f2 = [];
  for (var r = CFG.FILA_DATOS; r <= fin; r++) {
    var fr = _formulasFila_(r);
    f1.push(sep === ";" ? fr.bloque.map(_conPuntoYComa_) : fr.bloque);
    f2.push([sep === ";" ? _conPuntoYComa_(fr.oportunidad) : fr.oportunidad]);
  }
  h.getRange(CFG.FILA_DATOS, C.TERMINO, n, 5).setFormulas(f1);
  h.getRange(CFG.FILA_DATOS, C.OPORTUNIDAD, n, 1).setFormulas(f2);
  h.getRange(CFG.FILA_DATOS, C.DIAS, n, 1).setNumberFormat("0");
  h.getRange(CFG.FILA_DATOS, C.TERMINO, n, 1).setNumberFormat("0");
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
  var fin = Math.max(CFG.FILA_FIN, h.getLastRow());
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
      if (!f) problema = "fila " + r + " sin fórmula";
      else if (!m || parseInt(m[1], 10) !== r) problema = "la fila " + r + " apuntaba a la fila " + (m ? m[1] : "?");
    });
  }
  if (!problema) return { ok: true, reparado: false };
  var ef = _escribirFormulas_(h, fin);
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
function apiResumenMensual(anio) {
  var h = _h(CFG.HOJA_DATOS);
  var n = CFG.FILA_FIN - CFG.FILA_DATOS + 1;
  var datos = h.getRange(CFG.FILA_DATOS, 1, n, CFG.NCOL).getValues();
  var tz = _tz_();
  var hoy = new Date();
  var anioActual = parseInt(Utilities.formatDate(hoy, tz, "yyyy"), 10);
  anio = parseInt(anio, 10) || anioActual;

  var anios = {}, meses = [], anual = _nuevoAgregado_();
  for (var m = 0; m < 12; m++) meses.push(_nuevoAgregado_());

  datos.forEach(function (f) {
    if (!f[C.CODIGO - 1]) return;
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
function apiNovedades(desde, conCorreo) {
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
      if (["Radicación", "Respuesta del área registrada"].indexOf(acc) === -1) return;
      var ev = { ts: f.getTime(), codigo: r[1], accion: acc, detalle: (r[3] || "").toString().substring(0, 140), usuario: r[4] };
      if (acc === "Radicación") {
        if (!datos) {
          var hd = _h(CFG.HOJA_DATOS);
          datos = hd.getRange(CFG.FILA_DATOS, 1, CFG.FILA_FIN - CFG.FILA_DATOS + 1, CFG.NCOL).getValues();
        }
        for (var i = datos.length - 1; i >= 0; i--) {
          if (datos[i][C.CODIGO - 1] === r[1]) {
            ev.tipo = datos[i][C.TIPO_PQRS - 1]; ev.canal = datos[i][C.CANAL - 1]; ev.sede = datos[i][C.SEDE - 1];
            break;
          }
        }
      }
      out.eventos.push(ev);
    });
  }
  if (conCorreo) {
    try {
      var c = apiCorreos(true);
      out.correo = c.resumen;
    } catch (e) { out.correo = { error: String(e.message || e) }; }
  }
  return out;
}

// =====================================================================================
// CORREO: SEPARAR LO RELEVANTE DE LAS NOTIFICACIONES DE ESTA PLATAFORMA
// =====================================================================================
var MARCA_SISTEMA = "Mensaje generado por el Sistema de PQRS de MiRed IPS";
var RE_ASUNTO_SISTEMA = /^(radicaci[oó]n de su pqrs|gracias por su felicitaci[oó]n|su pqrs .+ est[aá] en tr[aá]mite|respuesta a su pqrs|estado de su pqrs|control pqrs|\[solicitud interna|\[interno)/i;
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
function apiRegistrarRespuestaDesdeCorreo(idMsg, codigo, texto) {
  var msg;
  try { msg = GmailApp.getMessageById(idMsg); } catch (e) { return { ok: false, mensaje: "No pude abrir ese correo." }; }
  if (_filaDe(codigo) < 0) return { ok: false, mensaje: "No encontré el radicado " + codigo + "." };
  var t = (texto || _sinCitas_(msg.getPlainBody())).toString().trim();
  if (!t) return { ok: false, mensaje: "El correo no tiene texto para registrar." };
  var det = apiRegistrarRespuestaArea(codigo, t, msg.getDate());
  _marcarAtendido_(idMsg);
  _traza(codigo, "Correo del área vinculado", "De " + msg.getFrom() + " · " + (msg.getSubject() || ""));
  return { ok: true, codigo: codigo, detalle: det };
}

/** Marca un correo de seguimiento como revisado (deja constancia en la trazabilidad si tiene radicado). */
function apiMarcarCorreoAtendido(idMsg, codigo, nota) {
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
