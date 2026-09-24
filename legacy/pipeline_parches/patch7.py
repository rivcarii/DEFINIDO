import re
D = "/tmp/claude-0/-home-claude/29bf6603-03e9-5788-bc53-fdc069215d8b/scratchpad/pqrs_build/v7/"
s = open(D + "Codigo_v7.gs", encoding="utf-8").read()
leer = lambda n: open(D + n, encoding="utf-8").read()

def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, (n, old[:100])
    s = s.replace(old, new)

# ---------- menú y disparadores (funciones públicas con nombre propio)
rep('''    .addItem("Importar respuestas del formulario", "apiImportarRespuestasForm")''',
    '''    .addItem("Importar respuestas del formulario", "importarFormulario")
    .addItem("Procesar correo ahora", "procesarCorreoEntrante")''')
rep('''  ScriptApp.newTrigger("onFormSubmit_").forSpreadsheet(ss).onFormSubmit().create();
  ScriptApp.newTrigger("rutinaDiaria").timeBased().atHour(7).everyDays(1).create();
  SpreadsheetApp.getUi().alert("Listo:\\n• Al enviar el formulario → radica automáticamente\\n• Todos los días 7:00 a.m. → alerta de vencidas");''',
'''  ScriptApp.newTrigger("alEnviarFormulario").forSpreadsheet(ss).onFormSubmit().create();
  ScriptApp.newTrigger("rutinaDiaria").timeBased().atHour(7).everyDays(1).create();
  ScriptApp.newTrigger("procesarCorreoEntrante").timeBased().everyMinutes(5).create();
  ScriptApp.newTrigger("revisarAlertas").timeBased().everyHours(1).create();
  SpreadsheetApp.getUi().alert("Listo:\\n• Formulario QR → radica al enviarse\\n• Correo → se revisa cada 5 minutos (EPS, entes de control y usuarios)\\n" +
    "• Cada hora → alerta de tutelas y derechos de petición sin direccionar\\n• 7:00 a.m. → control diario de vencidas");''')
rep('''function onFormSubmit_(e) {
  try { apiImportarRespuestasForm(); } catch (err) { Logger.log(err); }
}''', '''function onFormSubmit_(e) { alEnviarFormulario(e); }
function alEnviarFormulario(e) {
  try { apiImportarRespuestasForm(); } catch (err) { Logger.log(err); }
}
function importarFormulario() {
  SpreadsheetApp.getUi();   // solo desde el menú de la hoja
  var r = apiImportarRespuestasForm();
  SpreadsheetApp.getUi().alert(r.mensaje || "Listo");
}''')

# ---------- mantenimiento solo desde el menú de la hoja
rep('''function instalarDisparadores() {
  ScriptApp.getProjectTriggers()''', '''function instalarDisparadores() {
  SpreadsheetApp.getUi();   // no se puede ejecutar desde la aplicación web
  ScriptApp.getProjectTriggers()''')
rep('''function repararFechasYFormulas() {   // también disponible en el menú PQRS
  var r = _migrar_(true);''', '''function repararFechasYFormulas() {   // también disponible en el menú PQRS
  SpreadsheetApp.getUi();
  var r = _migrar_(true);''')

# ---------- quién hizo cada acción
rep('''function _usuario() {
  try { return Session.getActiveUser().getEmail() || "sistema"; } catch (e) { return "sistema"; }
}''', '''function _usuario() {
  if (SESION) return SESION.nombre + " <" + SESION.usuario + ">";
  try { return Session.getActiveUser().getEmail() || "sistema"; } catch (e) { return "sistema"; }
}''')

# ---------- visibilidad por sede (bandeja, tablero, inicio, panel mensual)
rep('''    if (!f[C.CODIGO - 1]) return;''', '''    if (!f[C.CODIGO - 1] || !_filaVisible_(f)) return;''', 4)
rep('''    if (!f[C.CODIGO - 1]) continue;''', '''    if (!f[C.CODIGO - 1] || !_filaVisible_(f)) continue;''')

# ---------- arranque con la sesión
rep('''    migracion: migracion,
    zonaHoraria: _tz_(),''', '''    migracion: migracion,
    sesion: SESION ? { usuario: SESION.usuario, nombre: SESION.nombre, rol: SESION.rol, sedes: SESION.todas ? ["TODAS"] : SESION.sedes,
      todas: SESION.todas, gestionaCorreo: SESION.gestionaCorreo, debeCambiar: SESION.debeCambiar,
      puede: { gestion: _permitido_(SESION, P_GESTION), correo: _permitido_(SESION, P_CORREO), admin: _permitido_(SESION, P_ADMIN) } } : null,
    categorias: _categorias_().map(function (c) { return { nombre: c.nombre, prioridad: c.prioridad, tipo: c.tipo }; }),
    zonaHoraria: _tz_(),''')
rep('''  cab.forEach(function (nombre, i) {
    if (!nombre) return;
    listas[String(nombre).trim()] = cuerpo.map(function (r) { return r[i]; }).filter(String);
  });
  return {''', '''  cab.forEach(function (nombre, i) {
    if (!nombre) return;
    listas[String(nombre).trim()] = cuerpo.map(function (r) { return r[i]; }).filter(String);
  });
  if (SESION && !SESION.todas && listas["SEDE"]) listas["SEDE"] = listas["SEDE"].filter(_sedeVisible_);
  return {''')

# ---------- radicación presencial: clasificador (solo sugiere) y aviso
rep('''  var f = _h(CFG.HOJA_DATOS).getRange(fila, 1, 1, CFG.NCOL).getValues()[0];
  var base = _datosCorreo(f);
  var acuse = _acuseRecepcion_(fila);

  return { ok: true, codigo: codigo, fila: fila, fechaMax: base.fechaMax || "No aplica", acuse: acuse };''',
'''  var clas = _aplicarClasificador_(fila, "sugerir");
  SpreadsheetApp.flush();
  var f = _h(CFG.HOJA_DATOS).getRange(fila, 1, 1, CFG.NCOL).getValues()[0];
  var base = _datosCorreo(f);
  var acuse = _acuseRecepcion_(fila);
  try { _avisoNuevoCaso_(fila, {}); } catch (e) { Logger.log(e); }

  return { ok: true, codigo: codigo, fila: fila, fechaMax: base.fechaMax || "No aplica", acuse: acuse,
           sugerido: clas && clas.tipo && _norm(clas.tipo) !== _norm(d.tipoPqrs) && clas.confianza !== "baja" ? clas.tipo : "" };''')

# ---------- formulario QR: reclasifica si el texto lo contradice
rep('''    _traza(codigo, "Radicación", "Importada del formulario QR (" + _fmt(marca) + ")");
''', '''    _traza(codigo, "Radicación", "Importada del formulario QR (" + _fmt(marca) + ")");
    SpreadsheetApp.flush();
    try { _aplicarClasificador_(fila, "auto"); } catch (e) { Logger.log(e); }
    if (marca >= limite) { try { SpreadsheetApp.flush(); _avisoNuevoCaso_(fila, {}); } catch (e) { Logger.log(e); } }
''')

# ---------- radicación desde el correo
rep('''  vals[C.REGISTRADO_POR] = _usuario();
  vals[C.ID_CORREO] = idMsg;''', '''  vals[C.REGISTRADO_POR] = d.automatico ? "Automático (correo)" : _usuario();
  vals[C.ID_CORREO] = idMsg;''')
rep('''  if (hiloId) _guardarHilo_(hiloId, { categoria: "pqrs", estado: "Radicado " + codigo, codigo: codigo, correoUsuario: d.correo || "",
    asunto: msg.getSubject() || "", accion: "Radicada como " + codigo });
  var acuse = _acuseRecepcion_(fila);''', '''  if (hiloId) _guardarHilo_(hiloId, { categoria: d.clasificacion ? "institucional" : "pqrs", estado: "Radicado " + codigo, codigo: codigo,
    correoUsuario: d.correo || "", asunto: msg.getSubject() || "", accion: "Radicada como " + codigo + (d.automatico ? " (automático)" : "") });
  SpreadsheetApp.flush();
  try { _aplicarClasificador_(fila, d.clasificacion ? "sugerir" : "auto"); } catch (e) { Logger.log(e); }
  var acuse = d.sinAcuse ? "en el mismo hilo" : _acuseRecepcion_(fila);
  if (!d.automatico) { try { _avisoNuevoCaso_(fila, {}); } catch (e) { Logger.log(e); } }''')

# ---------- plantilla de correo: fechas de hechos, recepción y vencimiento
rep('''        dato("Fecha de radicación", o.fechaRadicacion) + dato("Fecha límite de respuesta", o.fechaMax) +''',
    '''        dato("Fecha de los hechos", o.fechaHechos || fx.hechos) + dato("Fecha de recepción", o.fechaRecepcion || fx.recepcion) +
        dato("Fecha de radicación", o.fechaRadicacion || fx.radicacion) + dato("Fecha límite de respuesta", o.fechaMax || fx.max) +''')
rep('''  var acento = o.interno ? "#B98A00" : "#006081";''', '''  var acento = o.interno ? "#B98A00" : "#006081";
  var fx = _fechasDe_(o.codigo);''')

# ---------- bandeja: prioridad, categoría y sugerencias del clasificador
rep('''      dias: _dias_(f[C.DIAS - 1]),
    };''', '''      dias: _dias_(f[C.DIAS - 1]),
      clasificacion: f[C.CLASIF_INTERNA - 1],
      prioridad: _prioridadDe_(f[C.CLASIF_INTERNA - 1], f[C.ENTIDAD - 1], CATS_CACHE || (CATS_CACHE = _categorias_())),
      etiquetas: _etiquetasObs_(f[C.OBSERVACIONES - 1]),
      remitente: (/Remitente institucional: ([^(·]+)/.exec(String(f[C.OBSERVACIONES - 1] || "")) || [])[1] || "",
    };''')
rep('''  out.reverse();
  return out;''', '''  out.reverse();
  if (filtros.etapa !== "cerradas") {
    var rango = { "Crítica": 0, "Alta": 1, "Media": 2, "Normal": 3 };
    out = out.map(function (x, i) { x._i = i; return x; }).sort(function (a, b) {
      return (rango[a.prioridad] - rango[b.prioridad]) || (a._i - b._i); });
  }
  return out;''')

# ---------- detalle
rep('''  d.traza = _trazaDe(d.codigo);
  return d;''', '''  d.traza = _trazaDe(d.codigo);
  d.clasificacionInterna = f[C.CLASIF_INTERNA - 1];
  d.prioridad = _prioridadDe_(f[C.CLASIF_INTERNA - 1], f[C.ENTIDAD - 1]);
  d.etiquetas = _etiquetasObs_(f[C.OBSERVACIONES - 1]);
  d.recepcionHora = f[C.MARCA - 1] instanceof Date ? Utilities.formatDate(f[C.MARCA - 1], _tz_(), "dd/MM/yyyy HH:mm") : "";
  d.hiloId = "";
  if (f[C.ID_CORREO - 1]) { try { d.hiloId = GmailApp.getMessageById(f[C.ID_CORREO - 1]).getThread().getId(); } catch (e) {} }
  return d;''')

# ---------- inicio: correo solo con permiso, distribución por sede y prioritarias
rep('''  try { var c = apiCorreos(true); r.correo = c.resumen; r.correosPendientes = c.resumen.relevantes; }
  catch (e) { r.correosPendientes = -1; }''', '''  if (!SESION || _permitido_(SESION, P_CORREO)) {
    try { var c = apiCorreos(true); r.correo = c.resumen; r.correosPendientes = c.resumen.relevantes; }
    catch (e) { r.correosPendientes = -1; }
  } else { r.correosPendientes = -1; r.sinCorreo = true; }
  r.porSede = {}; r.prioritarias = [];
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
    if (!cerrada && (pr === "Crítica" || pr === "Alta")) r.prioritarias.push({ codigo: f[C.CODIGO - 1], prioridad: pr,
      clasificacion: f[C.CLASIF_INTERNA - 1], tipo: f[C.TIPO_PQRS - 1], remitente: (/Remitente institucional: ([^(·]+)/.exec(String(f[C.OBSERVACIONES - 1] || "")) || [])[1] || f[C.EPS - 1] || "",
      fechaMax: _fmt(f[C.FECHA_MAX - 1]), semaforo: sem, conArea: !!f[C.CORREO_RESP - 1], orden: pr === "Crítica" ? 0 : 1 });
  });
  r.prioritarias.sort(function (a, b) { return a.orden - b.orden; });
  r.prioritarias = r.prioritarias.slice(0, 8);''')

# ---------- novedades: solo de las sedes visibles, con prioridad
rep('''      if (acc === "Radicación") {
        if (!datos) {''', '''      if (acc === "Radicación" || acc === "Respuesta del área registrada") {
        if (!datos) {''')
rep('''          if (datos[i][C.CODIGO - 1] === r[1]) {
            ev.tipo = datos[i][C.TIPO_PQRS - 1]; ev.canal = datos[i][C.CANAL - 1]; ev.sede = datos[i][C.SEDE - 1];
            break;
          }''', '''          if (datos[i][C.CODIGO - 1] === r[1]) {
            ev.tipo = datos[i][C.TIPO_PQRS - 1]; ev.canal = datos[i][C.CANAL - 1]; ev.sede = datos[i][C.SEDE - 1];
            ev.visible = _filaVisible_(datos[i]);
            ev.prioridad = _prioridadDe_(datos[i][C.CLASIF_INTERNA - 1], datos[i][C.ENTIDAD - 1]);
            ev.clasificacion = datos[i][C.CLASIF_INTERNA - 1];
            break;
          }''')
rep('''      out.eventos.push(ev);''', '''      if (ev.visible === false) return;
      out.eventos.push(ev);''')
rep('''  if (conCorreo) {''', '''  if (conCorreo && (!SESION || _permitido_(SESION, P_CORREO))) {''')

# ---------- correo por conversaciones: EPS y entes de control como categoría prioritaria
rep('''    if (info && info.estado && !codigo) {''', '''    var entHilo = solicitante ? _entidadDe_(solicitante.correo, ENT_CACHE || (ENT_CACHE = _entidades_())) : null;
    var cerradoSinNovedad = info && /atendid|cerrad/i.test(info.estado || "") && !(ultimoExt && ultimoExt.getDate().getTime() > (info.fecha || 0));
    if (entHilo && !codigo && cerradoSinNovedad) {
      return;
    } else if (entHilo && !codigo) {
      cat = "institucional";
    } else if (info && info.estado && !codigo) {''')
rep('''    var it = _itemCorreo_(hilo, ult.m, cat, codigo, ctx, info, solicitante, msgs.length);''',
    '''    var it = _itemCorreo_(hilo, ult.m, cat, codigo, ctx, info, solicitante, msgs.length);
    if (entHilo) {
      var catC = _categoriaCorreo_(asunto0, ult.m.getPlainBody() || "", CATS_CACHE || (CATS_CACHE = _categorias_()));
      it.entidad = entHilo.entidad; it.tipoEntidad = entHilo.tipo; it.categoriaCorreo = catC ? catC.nombre : "";
      it.prioridad = catC ? catC.prioridad : entHilo.prioridad;
    }''')
rep('''  var items = [], res = { pqrs: 0, cita: 0, curso: 0, area: 0, usuario: 0, rebote: 0, otro: 0, sistema: 0 };''',
    '''  var items = [], res = { institucional: 0, pqrs: 0, cita: 0, curso: 0, area: 0, usuario: 0, rebote: 0, otro: 0, sistema: 0 };''')
rep('''  res.relevantes = res.pqrs + res.cita + res.curso + res.area + res.usuario + res.rebote;''',
    '''  res.relevantes = res.institucional + res.pqrs + res.cita + res.curso + res.area + res.usuario + res.rebote;
  var rangoP = { "Crítica": 0, "Alta": 1, "Media": 2 };
  items.sort(function (a, b) { return ((rangoP[a.prioridad] !== undefined ? rangoP[a.prioridad] : 3) - (rangoP[b.prioridad] !== undefined ? rangoP[b.prioridad] : 3)) || (b.ts - a.ts); });''')
rep('''  return { ok: true, hiloId: hiloId, asunto: primero.asunto || "", codigo: codigo, info: info,''',
    '''  var entH = solicitante ? _entidadDe_(solicitante.correo) : null, catH = entH ? _categoriaCorreo_(primero.asunto || "", textoUsuario.join("\\n")) : null;
  return { ok: true, hiloId: hiloId, asunto: primero.asunto || "", codigo: codigo, info: info,
           entidad: entH ? { nombre: entH.entidad, tipo: entH.tipo, presentada: entH.presentada, eps: _epsDeEntidad_(entH.entidad), prioridad: entH.prioridad } : null,
           categoriaCorreo: catH ? catH.nombre : "", categorias: _categorias_().map(function (c) { return { nombre: c.nombre, prioridad: c.prioridad, tipo: c.tipo }; }),''')

# ---------- términos: la categoría del correo manda sobre la entidad
rep('''  return {
    bloque: [
      '=IF($AA' + r + '="","",IF(' + FELI + ',"N/A",IF(' + AE + '="","",' + busca(2, '"⚠"') + ')))',
      '=IF($AA' + r + '="","",IF(' + FELI + ',"N/A",IF(' + AE + '="","",' + busca(3, '""') + ')))',''',
'''  var CAT = "Categorias_Correo!$A$2:$E$60", AB = "UPPER(TRIM($AB" + r + "))";
  return {
    bloque: [
      '=IF($AA' + r + '="","",IF(' + FELI + ',"N/A",IFERROR(VLOOKUP(' + AB + ',' + CAT + ',4,FALSE),IF(' + AE + '="","",' + busca(2, '"⚠"') + '))))',
      '=IF($AA' + r + '="","",IF(' + FELI + ',"N/A",IFERROR(VLOOKUP(' + AB + ',' + CAT + ',5,FALSE),IF(' + AE + '="","",' + busca(3, '""') + '))))',''')
rep('''function _escribirFormulas_(h, fin) {
  var n = fin - CFG.FILA_DATOS + 1;''', '''function _escribirFormulas_(h, fin) {
  _hojaCategorias_();   // la tabla de categorías debe existir antes de referenciarla
  var n = fin - CFG.FILA_DATOS + 1;''')
rep('''var ESQUEMA = "5";''', '''var ESQUEMA = "7";''')
rep('''      var m = /\\$E(\\d+)/.exec(f || "");''', '''      var m = /\\$E(\\d+)/.exec(f || "");
      if (f && f.indexOf("Categorias_Correo") === -1 && r === CFG.FILA_DATOS && h.getRange(r, C.TERMINO).getFormula().indexOf("Categorias_Correo") === -1) problema = "fórmulas sin la tabla de categorías";''')

# ---------- funciones internas: sufijo «_» (no se pueden llamar desde el navegador)
s = re.sub(r"\b(api[A-Z]\w*|appBootstrap)\b(?!_)", lambda m: m.group(1) + "_", s)
s = s.replace('"alEnviarFormulario"', '"alEnviarFormulario"')

s = s.rstrip() + "\nvar CATS_CACHE = null, ENT_CACHE = null;\n" + leer("usuarios.gs") + "\n" + leer("clasificador.gs") + "\n" + leer("correo_auto.gs") + "\n" + leer("fechas.gs")
_a = '  for (i = 0; i < lista.length; i++) if (_norm(lista[i]) === n) return { valor: lista[i], reconocido: true };\n'
assert _a in s
s = s.replace(_a, _a + '  var compacto = n.replace(/[^a-z0-9ñ]/g, "");   // v7: «SUPERSALUD» = «SUPER SALUD»\n  for (i = 0; i < lista.length; i++) if (compacto && _norm(lista[i]).replace(/[^a-z0-9ñ]/g, "") === compacto) return { valor: lista[i], reconocido: true };\n', 1)
_a = '  d.terminoTexto = _terminoTexto_(d.termino, d.tipoDia, f[C.ENTIDAD - 1]);\n'
assert _a in s
s = s.replace(_a, _a + """  if (typeof d.termino !== "number" && f[C.CLASIF_INTERNA - 1]) {   // v7: la categoría del correo manda sobre la entidad
    var catD = (CATS_CACHE || (CATS_CACHE = _categorias_())).filter(function (c) { return _norm(c.nombre) === _norm(f[C.CLASIF_INTERNA - 1]); })[0];
    if (catD && catD.dias) d.terminoTexto = catD.dias + (catD.dias == 1 ? " día " : " días ") + String(catD.tipoDia || "calendario").toLowerCase() + " · " + catD.nombre;
  }
""", 1)
s = s.replace('"Consolidado actualizado a la versión 5: días transcurridos en números enteros y término tolerante a la entidad presentada"', '"Consolidado actualizado a la versión 7: términos por categoría del correo (Supersalud, tutela, derecho de petición), días enteros y entidad tolerante"', 1)
s = s.replace('_traza("—", "Actualización v5",', '_traza("—", "Actualización v7",', 1)
open(D + "Codigo_v7.gs", "w", encoding="utf-8").write(s)
print("ok", len(s))
