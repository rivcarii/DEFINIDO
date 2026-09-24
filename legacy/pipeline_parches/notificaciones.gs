
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
  try {
    var u = ScriptApp.getService().getUrl();
    return u ? u + (codigo ? "?pqrs=" + encodeURIComponent(codigo) : "") : "";
  } catch (e) { return ""; }
}

function _textoConfidencial_(interno) {
  var siau = _param(3) || "siau@miredips.org";
  return interno
    ? "<b>Información confidencial.</b> Este mensaje contiene datos personales y de salud protegidos por la Ley 1581 de 2012 y por la reserva " +
      "de la historia clínica (Ley 23 de 1981 y Resolución 1995 de 1999). Úselo solo para gestionar esta PQRS: no lo reenvíe, no lo imprima " +
      "ni lo comparta fuera del proceso. Si lo recibió por error, avise a " + siau + " y elimínelo."
    : "Este mensaje es exclusivo para el titular de la solicitud y puede contener datos personales protegidos por la Ley 1581 de 2012. " +
      "Si lo recibió por error, avísenos respondiendo a este correo y elimínelo. MiRed IPS nunca le pedirá contraseñas ni pagos por este medio.";
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
  var icono = feliz
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
  var detalles = [["Estado", feli && !o.interno ? "" : o.estado], ["Sede", o.sede], ["Servicio", o.servicio]];
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
