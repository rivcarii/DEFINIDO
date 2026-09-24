# v7.1 · notificaciones, confidencialidad, felicitaciones (se aplica sobre Codigo_v7.gs)
import os
D = os.path.dirname(os.path.abspath(__file__)) + "/"
s = open(D + "Codigo_v7.gs", encoding="utf-8").read()
def _cortar(s, ini, fin):
    i = s.index(ini); j = s.index(fin, i)
    return s[:i] + s[j:]
s = _cortar(s, "function _plantilla(o) {", "function _enviar(para, asunto, texto, html) {")
s = _cortar(s, "function _correoHilo_(o) {", "function _html_(t)")
def R(a, b):
    global s
    assert a in s, "NO ENCONTRADO: " + a[:90]
    s = s.replace(a, b, 1)
R('  try { return Session.getActiveUser().getEmail() || "sistema"; } catch (e) { return "sistema"; }',
  '  return "Sistema PQRS (automático)";   // v7.1: nunca el correo de la cuenta de Google')
R('    var op = { name: CFG.REMITENTE, replyTo: (_param(3) || "siau@miredips.org") };',
  '    var op = { name: CFG.REMITENTE, replyTo: (_param(3) || "siau@miredips.org") };\n    if (_remitenteAlias_()) op.from = _remitenteAlias_();')
R('  var o = { name: CFG.REMITENTE, inlineImages:',
  '  var o = { name: CFG.REMITENTE, from: _remitenteAlias_() || undefined, inlineImages:')
R('  Object.keys(extra || {}).forEach(function (k) { if (extra[k] !== undefined && extra[k] !== null && extra[k] !== "") o[k] = extra[k]; });',
  '  if (!o.from) delete o.from;\n  Object.keys(extra || {}).forEach(function (k) { if (extra[k] !== undefined && extra[k] !== null && extra[k] !== "") o[k] = extra[k]; });')
R('      ? "Recibimos su mensaje y lo haremos llegar al equipo del área que usted reconoce. Gracias por tomarse el tiempo de escribirnos."',
  '      ? "Gracias por tomarse el tiempo de escribirnos. Su mensaje quedó registrado y lo compartiremos con el equipo" +\n'
  '        (base.servicio ? " de <b>" + _html_(base.servicio) + "</b>" : "") + (base.sede ? " en <b>" + _html_(base.sede) + "</b>" : "") +\n'
  '        ".<br><br>El reconocimiento de nuestros usuarios motiva a quienes le atienden cada día y nos ayuda a mantener una atención humanizada."')
R('''  var r1 = _enviar(resp.correo, "[SOLICITUD INTERNA · PQRS " + codigo + "] " + (f[C.TIPO_PQRS - 1] || "") + " – " +
    (base.servicio || "") + (base.fechaMax ? " · vence " + base.fechaMax : ""),
    "Solicitud interna de gestión — PQRS " + codigo + ".", htmlArea);''',
'''  var feliArea = _esFeli(f[C.TIPO_PQRS - 1]);
  if (feliArea) htmlArea = _plantilla({ interno: true, reconocimiento: true, codigo: codigo, tipo: f[C.TIPO_PQRS - 1], sinProgreso: true,
    sede: base.sede, servicio: base.servicio, fechaRadicacion: base.fechaRadicacion, responsable: base.responsable,
    titulo: "Un usuario reconoce la labor de su equipo",
    mensaje: "La Oficina de Atención al Usuario comparte con ustedes esta felicitación. Gracias por su compromiso con una atención humanizada, segura y cercana." +
      "<br><br>No requiere gestión ni respuesta. Si desean enviar unas palabras al usuario, respondan a este correo y el SIAU se las hará llegar." +
      (nota ? "<br><br><b>Nota del SIAU:</b> " + _html_(nota) : ""),
    descripcion: f[C.DESCRIPCION - 1] });
  var r1 = _enviar(resp.correo, feliArea
      ? "[RECONOCIMIENTO · PQRS " + codigo + "] Felicitación para " + (base.servicio || resp.area)
      : "[SOLICITUD INTERNA · PQRS " + codigo + "] " + (f[C.TIPO_PQRS - 1] || "") + " – " + (base.servicio || "") + (base.fechaMax ? " · vence " + base.fechaMax : ""),
    (feliArea ? "Reconocimiento de un usuario — PQRS " : "Solicitud interna de gestión — PQRS ") + codigo + ".", htmlArea);''')
R('''      titulo: "Su solicitud está en trámite",''', '''      titulo: _esFeli(f[C.TIPO_PQRS - 1]) ? "Entregamos su felicitación al equipo" : "Su solicitud está en trámite",''')
R('''      mensaje: "Le informamos que su <b>" + (f[C.TIPO_PQRS - 1] || "solicitud") + "</b> fue revisada por la Oficina de " +''',
  '''      mensaje: _esFeli(f[C.TIPO_PQRS - 1])
        ? "Su mensaje de reconocimiento ya llegó a <b>" + _html_(resp.area) + "</b>. Gracias por destacar el trabajo de nuestro equipo: palabras como las suyas nos impulsan a seguir mejorando."
        : "Le informamos que su <b>" + (f[C.TIPO_PQRS - 1] || "solicitud") + "</b> fue revisada por la Oficina de " +''')
R('''    var r2 = _enviar(correoUsr, "Su PQRS " + codigo + " está en trámite", "Su PQRS " + codigo + " está en trámite.", htmlUsr);''',
  '''    var r2 = _enviar(correoUsr, _esFeli(f[C.TIPO_PQRS - 1]) ? "Entregamos su felicitación – " + codigo : "Su PQRS " + codigo + " está en trámite",
      "Su PQRS " + codigo + " está en trámite.", htmlUsr);''')
R('''    titulo: "Respuesta a su solicitud",
    mensaje: "Damos respuesta a su <b>" + (f[C.TIPO_PQRS - 1] || "solicitud") + "</b> radicada el " +
      base.fechaRadicacion + ".",''',
  '''    titulo: _esFeli(f[C.TIPO_PQRS - 1]) ? "Gracias por su felicitación" : "Respuesta a su solicitud",
    mensaje: _esFeli(f[C.TIPO_PQRS - 1])
      ? "Queremos contarle que su mensaje, radicado el " + base.fechaRadicacion + ", fue compartido con nuestro equipo."
      : "Damos respuesta a su <b>" + (f[C.TIPO_PQRS - 1] || "solicitud") + "</b> radicada el " + base.fechaRadicacion + ".",''')
R('''  var r = _enviar(correoUsr, "Respuesta a su PQRS " + codigo, textoFinal, html);''',
  '''  var r = _enviar(correoUsr, (_esFeli(f[C.TIPO_PQRS - 1]) ? "Gracias por su felicitación – " : "Respuesta a su PQRS ") + codigo, textoFinal, html);''')
R('''    '<div style="border-top:1px solid #E6EDF0;margin-top:20px;padding-top:14px;font-family:' + FF + ';font-size:11px;color:#8398A3;">' + MARCA_SISTEMA + '.</div>' +''',
  '''    (_urlPlataforma_("") ? '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 4px;"><tr><td style="background:#006081;border-radius:10px;">' +
      '<a href="' + _urlPlataforma_("") + '" style="display:inline-block;padding:11px 20px;font-family:' + FF + ';font-size:13px;font-weight:700;color:#fff;text-decoration:none;">Abrir la plataforma &rarr;</a></td></tr></table>' : '') +
    '<div style="margin-top:18px;background:#FFF8E6;border:1px solid #F1DFA8;border-radius:10px;padding:11px 14px;font-family:' + FF + ';font-size:11px;line-height:1.6;color:#6B5415;">&#128274; ' + _textoConfidencial_(true) + '</div>' +
    '<div style="margin-top:14px;font-family:' + FF + ';font-size:11px;color:#8398A3;">' + MARCA_SISTEMA + '.</div>' +''')
R("""  SpreadsheetApp.getUi().alert(u ? "Plataforma PQRS:\\n\\n" + u
    : "Publica primero: Implementar ▸ Nueva implementación ▸ Aplicación web.");""",
  """  var ui = SpreadsheetApp.getUi();
  if (!u) { ui.alert("Publica primero: Implementar ▸ Nueva implementación ▸ Aplicación web."); return; }
  ui.alert(/\\/dev(\\?|$)/.test(u)
    ? "Este es el enlace de PRUEBA (/dev): solo lo abren los editores del proyecto.\\n\\nPara los técnicos usa el de Implementar ▸ Administrar implementaciones ▸ «URL de la aplicación web» (termina en /exec)."
    : "Enlace para los técnicos (no necesitan cuenta de Google, entran con su usuario):\\n\\n" + u +
      "\\n\\nLa implementación debe estar en «Ejecutar como: Yo» y «Quién tiene acceso: Cualquier persona».");""")
s = s.rstrip() + "\n" + open(D + "notificaciones.gs", encoding="utf-8").read()
open(D + "Codigo_v7.gs", "w", encoding="utf-8").write(s)
print("ok71", len(s))
