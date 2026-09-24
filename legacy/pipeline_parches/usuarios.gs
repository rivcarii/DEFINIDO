
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
  var ss = SpreadsheetApp.getActiveSpreadsheet();
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
  return "La plataforma se está ejecutando con " + (cuenta ? "la cuenta «" + cuenta + "»" : "la cuenta de quien abre el enlace") +
    ", que no tiene acceso al consolidado. El administrador debe entrar a Implementar ▸ Administrar implementaciones ▸ lápiz, " +
    "poner «Ejecutar como: Yo (siau@miredips.org)», «Quién tiene acceso: Cualquier persona», elegir «Nueva versión» e Implementar.";
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

  apiRadicar: [apiRadicar_, P_RADICAR, "sede"], apiActualizarDatos: [apiActualizarDatos_, P_RADICAR, "codigo"],
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
  apiAjustes: [apiAjustes_, P_ADMIN], apiGuardarAjustes: [apiGuardarAjustes_, P_ADMIN],
  apiGuardarEntidad: [apiGuardarEntidad_, P_ADMIN], apiGuardarCategoria: [apiGuardarCategoria_, P_ADMIN], apiProbarAvisoExterno: [apiProbarAvisoExterno_, P_ADMIN],
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
  var url = "", cuenta = "";
  try { url = ScriptApp.getService().getUrl() || ""; } catch (e) {}
  try { cuenta = Session.getEffectiveUser().getEmail() || ""; } catch (e) {}
  return { url: url, prueba: /\/dev(\?|$)/.test(url), cuenta: cuenta };
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
