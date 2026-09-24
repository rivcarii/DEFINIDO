
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
  SpreadsheetApp.flush();
  _traza(codigo, "Tipo de PQRS ajustado", (antes || "—") + " → " + tipo);
  return apiDetalle_(codigo);
}
function _etiquetasObs_(obs) {
  obs = String(obs || "");
  var s = /\[Tipo sugerido: ([^\]]+)\]/.exec(obs), r = /\[Reclasificada: ([^\]]+)\]/.exec(obs), d = /\[Datos incompletos: ([^\]]+)\]/.exec(obs);
  return { sugerido: s ? s[1] : "", reclasificada: r ? r[1] : "", datosFaltantes: d ? d[1] : "" };
}
