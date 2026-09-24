import re, io
D = "/tmp/claude-0/-home-claude/29bf6603-03e9-5788-bc53-fdc069215d8b/scratchpad/pqrs_build/v7/"
s = open(D + "base_v4.gs", encoding="utf-8").read()

def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, (n, old[:90])
    s = s.replace(old, new)

def bloque(ini, fin, nuevo):
    """Reemplaza desde 'ini' (incluido) hasta 'fin' (excluido)."""
    global s
    a = s.index(ini); b = s.index(fin, a)
    s = s[:a] + nuevo.rstrip() + "\n\n" + s[b:]

leer = lambda n: open(D + n, encoding="utf-8").read()

# ---- encabezado
rep("Backend v4", "Backend v7")

# ---- menú
rep('''    .addItem("Instalar disparadores", "instalarDisparadores")''',
    '''    .addItem("Instalar disparadores", "instalarDisparadores")
    .addItem("Reparar fechas y fórmulas de días", "repararFechasYFormulas")''')

# ---- fechas en zona horaria de la hoja
rep('''  return Utilities.formatDate(d, Session.getScriptTimeZone() || "America/Bogota", "dd/MM/yyyy");
}''', '''  return Utilities.formatDate(d, _tz_(), "dd/MM/yyyy");
}''')
bloque("function _fechaDeTexto(s) {", "function _param(i)",
       "function _fechaDeTexto(s) { return _soloFecha_(s); }")

# ---- radicado: año y mes según la zona de la hoja
rep('''  return pref + "-" + d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0000" + n).slice(-4);''',
    '''  return pref + "-" + Utilities.formatDate(d, _tz_(), "yyyy-MM") + "-" + ("0000" + n).slice(-4);''')

# ---- correos: plantilla y progreso nuevos
bloque("function _progreso(estado) {", "function _enviar(", leer("correo_bloque.gs"))

# ---- arranque: migración automática
rep('''function appBootstrap() {
  var cfg = _h(CFG.HOJA_CONFIG);''', '''function appBootstrap() {
  var migracion = { hecho: false, mensaje: "" };
  try { migracion = _migrar_(false); } catch (e) { migracion = { hecho: false, mensaje: "No se pudo actualizar el consolidado: " + (e.message || e) }; }
  if (!migracion.hecho) {
    try { var salud = _saludFormulas_(); if (salud.reparado || !salud.ok) migracion = { hecho: !!salud.reparado, mensaje: salud.mensaje || "" }; }
    catch (e) { migracion = { hecho: false, mensaje: "No se pudieron revisar las fórmulas: " + (e.message || e) }; }
  }
  var cfg = _h(CFG.HOJA_CONFIG);''')
rep('''    formVinculado: { id: _param(6), hoja: _param(7) },
  };''', '''    formVinculado: { id: _param(6), hoja: _param(7) },
    migracion: migracion,
    zonaHoraria: _tz_(),
    ahora: Date.now(),
  };''')

# ---- radicar: fechas sin hora
rep('''  var fRecepcion = _fechaDeTexto(d.fechaRecepcion);
  var fPqrs = _fechaDeTexto(d.fechaPqrs) || fRecepcion;
  var fRadicacion = _fechaDeTexto(d.fechaRadicacion) || new Date();
  fRadicacion.setHours(0, 0, 0, 0);''', '''  var fRecepcion = _soloFecha_(d.fechaRecepcion);
  var fPqrs = _soloFecha_(d.fechaPqrs) || fRecepcion;
  var fRadicacion = _soloFecha_(d.fechaRadicacion) || _soloFecha_(new Date());
  if (!fRecepcion) return { ok: false, mensaje: "La fecha de recepción no es válida." };''')

# ---- bandeja / detalle: días enteros y término legible
rep('''      dias: f[C.DIAS - 1],
    };''', '''      dias: _dias_(f[C.DIAS - 1]),
    };''')
rep('''  d.dias = f[C.DIAS - 1];''', '''  d.dias = _dias_(f[C.DIAS - 1]);
  d.terminoTexto = _terminoTexto_(d.termino, d.tipoDia, f[C.ENTIDAD - 1]);
  d.semaforoTexto = _limpiarSimbolo_(d.semaforo);''')
rep('''      return { fecha: Utilities.formatDate(new Date(r[0]), Session.getScriptTimeZone() || "America/Bogota", "dd/MM/yyyy HH:mm"),''',
    '''      return { fecha: Utilities.formatDate(new Date(r[0]), _tz_(), "dd/MM/yyyy HH:mm"),''')

# ---- correos internos con días transcurridos (enteros)
rep('''    fechaMax: base.fechaMax, responsable: base.responsable,
    solicitante: f[C.NOMBRE_SOL - 1], documento: f[C.NUM_DOC_SOL - 1],''',
    '''    fechaMax: base.fechaMax, responsable: base.responsable, dias: base.dias,
    solicitante: f[C.NOMBRE_SOL - 1], documento: f[C.NUM_DOC_SOL - 1],''')
rep('''    responsable: f[C.RESPONSABLE - 1],
  };
}''', '''    responsable: f[C.RESPONSABLE - 1],
    dias: _dias_(f[C.DIAS - 1]),
  };
}''')
rep('''    fechaMax: base.fechaMax, responsable: nuevo.area,''', '''    fechaMax: base.fechaMax, responsable: nuevo.area, dias: base.dias,''')
rep('''      responsable: f[C.RESPONSABLE - 1],
      solicitante: f[C.NOMBRE_SOL - 1],''', '''      responsable: f[C.RESPONSABLE - 1], dias: base.dias,
      solicitante: f[C.NOMBRE_SOL - 1],''')
rep('''    gestion: nota || "",''', '''    gestion: nota || "",''')

# ---- respuestas: fechas sin hora
rep('''  h.getRange(fila, C.FECHA_RTA_AREA).setValue(_fechaDeTexto(fecha) || new Date());''',
    '''  h.getRange(fila, C.FECHA_RTA_AREA).setValue(_soloFecha_(fecha) || _soloFecha_(new Date()));''')
rep('''    h.getRange(fila, C.FECHA_RTA_USUARIO).setValue(new Date());''',
    '''    h.getRange(fila, C.FECHA_RTA_USUARIO).setValue(_soloFecha_(new Date()));''', 1)
rep('''  h.getRange(fila, C.FECHA_RTA_USUARIO).setValue(new Date());''',
    '''  h.getRange(fila, C.FECHA_RTA_USUARIO).setValue(_soloFecha_(new Date()));''', 1)

# ---- tablero
bloque("function apiDashboard(filtros) {", "// ---------------------------------------------------------------------------\n// API · GOOGLE FORM", leer("tablero_bloque.gs"))

# ---- importación del formulario
rep('''    var soloFecha = new Date(marca.getFullYear(), marca.getMonth(), marca.getDate());
    var fila = _proximaFila();''', '''    if (isNaN(marca.getTime())) continue;
    var soloFecha = _soloFecha_(marca);
    var fila = _proximaFila();''')
rep('''    vals[C.FECHA_PQRS] = _fechaDeTexto(d.fechaPqrs) || soloFecha;
    vals[C.FECHA_RECEPCION] = soloFecha;
    vals[C.FECHA_RADICACION] = soloFecha;
    vals[C.ESTADO] = "Recibida";
    vals[C.REDIRECCIONES] = 0;
    vals[C.DEPARTAMENTO] = "ATLÁNTICO";
    vals[C.REGISTRADO_POR] = "Formulario QR";''', '''    vals[C.FECHA_PQRS] = _soloFecha_(d.fechaPqrs) || soloFecha;
    vals[C.FECHA_RECEPCION] = soloFecha;
    vals[C.FECHA_RADICACION] = soloFecha;
    vals[C.ESTADO] = "Recibida";
    vals[C.REDIRECCIONES] = 0;
    vals[C.DEPARTAMENTO] = "ATLÁNTICO";
    vals[C.REGISTRADO_POR] = "Formulario QR";''')

# ---- rutina diaria e inicio
bloque("function rutinaDiaria() {", "// =====================================================================================\n// INICIO", leer("rutina_bloque.gs"))
bloque("function apiResumenHoy() {", "// =====================================================================================\n// CANAL CORREO", leer("inicio_bloque.gs"))

# ---- correo: la función antigua delega en la nueva clasificación
bloque("function apiCorreosPendientes(soloContar) {", "function _detectarTipo_(texto) {",
'''function apiCorreosPendientes(soloContar) {   // compatibilidad: solo lo relevante
  var r = apiCorreos(!!soloContar);
  if (soloContar) { var a = []; for (var i = 0; i < r.resumen.relevantes; i++) a.push(1); return a; }
  return r.items.filter(function (x) { return x.categoria !== "otro"; });
}''')
rep('''  var fecha = _fechaDeTexto(d.fechaRecepcion) || msg.getDate();
  var soloFecha = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());''',
    '''  var soloFecha = _soloFecha_(d.fechaRecepcion) || _soloFecha_(msg.getDate());''')
rep('''    vals[C.FECHA_PQRS] = _fechaDeTexto(d.fechaPqrs) || soloFecha;''', '''    vals[C.FECHA_PQRS] = _soloFecha_(d.fechaPqrs) || soloFecha;''', 0) if False else None
rep('''  vals[C.FECHA_PQRS] = _fechaDeTexto(d.fechaPqrs) || soloFecha;''', '''  vals[C.FECHA_PQRS] = _soloFecha_(d.fechaPqrs) || soloFecha;''')


# ---- consecutivo: nunca reutiliza un radicado que ya figure en la trazabilidad
rep("""    if (m) { var v = parseInt(m[4], 10); if (v > max) max = v; }
  });
  return max + 1;""", """    if (m) { var v = parseInt(m[4], 10); if (v > max) max = v; }
  });
  var ht = _h(CFG.HOJA_TRAZA), ut = ht.getLastRow();
  if (ut >= CFG.TRAZA_FILA) ht.getRange(CFG.TRAZA_FILA, 2, ut - CFG.TRAZA_FILA + 1, 1).getValues().forEach(function (c) {
    var m = RE_RAD.exec((c[0] || "").toString().trim());
    if (m) { var v = parseInt(m[4], 10); if (v > max) max = v; }
  });
  return max + 1;""")

# ---- radicar desde el correo: todos los datos del usuario, hilo y adjuntos
rep("""  ["tipoPqrs","descripcion","nombreSolicitante","correo","telefono","sede","servicio",
   "tipoSolicitante","numDocSolicitante","tipoDocSolicitante","eps","regimen"].forEach(function (k) {
    if (d[k]) vals[CAMPOS[k]] = d[k];
  });""", """  Object.keys(CAMPOS).forEach(function (k) {
    if (["canal","fechaPqrs","fechaRecepcion","fechaRadicacion","entidad"].indexOf(k) !== -1) return;
    if (d[k] !== undefined && d[k] !== null && d[k] !== "") vals[CAMPOS[k]] = d[k];
  });
  if (d.observaciones) vals[C.OBSERVACIONES] = d.observaciones + " · Radicado desde correo: " + (msg.getSubject() || "");""")
rep("""  try { msg.getThread().addLabel(_etiqueta_(CFG.GMAIL_PROCESADO)); } catch (e) {}
  var acuse = _acuseRecepcion_(fila);

  return { ok: true, codigo: codigo, acuse: acuse };""", """  try { msg.getThread().addLabel(_etiqueta_(CFG.GMAIL_PROCESADO)); } catch (e) {}
  var hiloId = "";
  try { hiloId = msg.getThread().getId(); } catch (e) {}
  var adjuntos = "";
  if (d.guardarAdjuntos && hiloId) {
    try { adjuntos = _guardarAdjuntosHilo_(hiloId, codigo, fila); } catch (e) { adjuntos = "no se pudieron guardar: " + (e.message || e); }
  }
  if (hiloId) _guardarHilo_(hiloId, { categoria: "pqrs", estado: "Radicado " + codigo, codigo: codigo, correoUsuario: d.correo || "",
    asunto: msg.getSubject() || "", accion: "Radicada como " + codigo });
  var acuse = _acuseRecepcion_(fila);

  return { ok: true, codigo: codigo, acuse: acuse, adjuntos: adjuntos };""")

# ---- funciones nuevas al final
s = s.rstrip() + "\n" + leer("nuevas.gs") + "\n" + leer("correo_v6.gs")
open(D + "Codigo_v7.gs", "w", encoding="utf-8").write(s)
print("ok", len(s))
