const { Hoja, crear, Utilities } = require("./harness");
const fs = require("fs");
fs.mkdirSync(__dirname + "/salida", { recursive: true });
const TZ = process.env.SHEET_TZ || "America/Bogota";
const assert = (c, m) => { if (!c) { console.log("FALLA:", m); process.exitCode = 1; } else console.log("ok  ", m); };
const medianoche = s => Utilities.parseDate(s, TZ, "yyyy-MM-dd");

// ---------- libro simulado ----------
const H = ["CÓDIGO DE RADICACIÓN","CANAL DE RECEPCIÓN","FECHA DE LA PQRS","FECHA DE RECEPCIÓN","FECHA DE RADICACIÓN","MARCA TEMPORAL",
 "TIPO SOLICITANTE","TIPO DOC SOLICITANTE","N° DOC SOLICITANTE","NOMBRE SOLICITANTE","TELÉFONO","CORREO ELECTRÓNICO","DIRECCIÓN",
 "TIPO DOC AFILIADO","N° DOC AFILIADO","NOMBRE AFILIADO","EDAD","SEXO","POBLACIÓN DIFERENCIAL","EPS / PRESTADOR","RÉGIMEN",
 "SEDE","SERVICIO DONDE OCURRE","SERVICIO ESPECÍFICO","MODALIDAD DE ATENCIÓN","DEPARTAMENTO","TIPO DE PQRS","CLASIFICACIÓN INTERNA","TIPOLOGÍA","DESCRIPCIÓN",
 "ENTIDAD PRESENTADA","TÉRMINO (días)","TIPO DE DÍA","FECHA MÁXIMA DE RESPUESTA","SEMÁFORO","DÍAS TRANSCURRIDOS",
 "ESTADO","RESPONSABLE ASIGNADO","CORREO RESPONSABLE","FECHA ENVÍO AL ÁREA","REDIRECCIONAMIENTOS","RESPUESTA DEL RESPONSABLE","FECHA RESPUESTA DEL RESPONSABLE",
 "RESPUESTA ENVIADA AL USUARIO","FECHA DE RESPUESTA AL USUARIO","ESTADO DE OPORTUNIDAD","FECHA NOTIF. RECEPCIÓN","FECHA NOTIF. AL ÁREA","FECHA NOTIF. EN GESTIÓN",
 "FECHA NOTIF. CIERRE","OBSERVACIONES","ID CORREO","REGISTRADO POR"];
const cons = new Hoja("Consolidado_PQRS"); cons.poner(4, 1, ""); H.forEach((h, i) => cons.poner(4, i + 1, h));
const sedes = ["Camino Bosque de María","Camino La Playa","Camino Luz Chinita","Paso Ciudadela"];
const tipos = ["Queja","Petición","Reclamo","Sugerencia","Felicitación","Queja","Queja","Tutela"];
const sems = ["🔴 Vencida","🟡 Próxima a vencer","🟢 En término","✅ Cerrada","⭐ Felicitación","⚠ Revisar término"];
let n = 0;
for (let y of [2025, 2026]) for (let m = 1; m <= 12; m++) {
  if (y === 2026 && m > 9) break;
  for (let k = 0; k < (m % 3) + 1; k++) {
    const r = 5 + n; n++;
    const dia = String(3 + k).padStart(2, "0"), mm = String(m).padStart(2, "0");
    // fechas "desplazadas" como las que dejó la versión anterior: 22:00 del día previo (hora de Bogotá)
    const f = new Date(medianoche(`${y}-${mm}-${dia}`).getTime() - 2 * 3600000);
    const t = tipos[n % tipos.length], sem = sems[n % sems.length];
    const fila = { 1: `SIAU-${y}-${mm}-${String(3174 + n).padStart(4, "0")}`, 2: n % 2 ? "QR - Formulario" : "Presencial", 3: f, 4: f, 5: f, 6: f,
      10: "Usuario " + n, 12: n % 4 ? `u${n}@correo.com` : "", 22: sedes[(n * 7) % 4], 23: n % 2 ? "Urgencias" : "Consulta externa", 27: t, 30: "Descripción " + n,
      31: n % 5 === 0 ? "SEDE MIRED" : "SEDE", 32: n % 5 === 0 ? "⚠" : 15, 33: "Hábiles", 34: new Date(f.getTime() + 21 * 86400000), 35: sem, 36: 0.0833333333284827 + n,
      37: sem.indexOf("✅") === 0 ? "Respondida - Cerrada" : (n % 3 ? "En gestión" : "Recibida"), 38: n % 3 ? "Urgencias · Ana" : "", 39: n % 3 ? "urg@miredips.org" : "",
      45: sem.indexOf("✅") === 0 ? new Date(f.getTime() + 5 * 86400000) : "", 46: sem.indexOf("✅") === 0 ? "A tiempo" : "" };
    Object.keys(fila).forEach(c => cons.poner(r, +c, fila[c]));
  }
}
for (let r = 5 + n; r <= 404; r++) cons.poner(r, 53, "");
const traza = new Hoja("Trazabilidad"); traza.poner(4, 1, "FECHA Y HORA");
const resp = new Hoja("Responsables"); resp.poner(4, 1, "ID");
[[1, "Urgencias", "Ana", "Coord", "urg@miredips.org", "", "SI"], [2, "Calidad", "Luis", "Líder", "calidad@miredips.org", "", "SI"], [3, "Facturación", "", "", "", "", "SI"]]
  .forEach((f, i) => f.forEach((v, j) => resp.poner(5 + i, j + 1, v)));
const cfg = new Hoja("Config");
[["SEDE", 15, "Hábiles"], ["SUPER SALUD", 1, "Calendario"], ["SECRETARIA DE SALUD", 3, "Calendario"]].forEach((f, i) => f.forEach((v, j) => cfg.poner(6 + i, j + 1, v)));
[3174, 3, "SIAU", "siau@miredips.org", "605 000 0000", "300 000 0000", "", ""].forEach((v, i) => cfg.poner(11 + i, 2, v));
const listas = { "SEDE": sedes, "SERVICIO": ["Urgencias","Consulta externa"], "EPS / PRESTADOR": ["X"], "CANAL": ["Presencial","QR - Formulario","Correo electrónico"],
  "TIPO DE PQRS": ["Petición","Queja","Reclamo","Sugerencia","Felicitación","Denuncia","Tutela"], "TIPO SOLICITANTE": ["Usuario"], "TIPO DOCUMENTO": ["CC"],
  "ENTIDAD PRESENTADA": ["SEDE MIRED","SUPER SALUD","SECRETARIA DE SALUD"], "ESTADO": ["Recibida","En gestión","Respondida - Cerrada"] };
Object.keys(listas).forEach((k, j) => { cfg.poner(43, j + 1, k); listas[k].forEach((v, i) => cfg.poner(44 + i, j + 1, v)); });
const mapeo = new Hoja("Mapeo_Formulario");

// ---------- correo simulado (hilos, adjuntos, responder y reenviar) ----------
const enviadosHilo = [];
function Att(nombre, tipo, n) { const bytes = Buffer.alloc(n || 1200, 7); return { getName: () => nombre, getContentType: () => tipo, getSize: () => bytes.length, getBytes: () => bytes, copyBlob: () => ({ getBytes: () => bytes, getName: () => nombre }) }; }
let seq = 0;
function M(id, de, asunto, cuerpo, fecha, adj) {
  const m = { hilo: null, getId: () => id, getFrom: () => de, getSubject: () => asunto, getPlainBody: () => cuerpo, getDate: () => fecha || new Date(Date.now() - 3600000),
    getAttachments: () => adj || [], getThread: () => m.hilo.t,
    reply(body, op) { enviadosHilo.push({ tipo: "reply", a: de, cc: op && op.cc, html: op && op.htmlBody, adj: (op && op.attachments || []).length, hilo: m.hilo.id });
      m.hilo.msgs.push(M("r" + (++seq), "SIAU <siau@miredips.org>", "Re: " + asunto, "respuesta\n" + MARCA, new Date())); },
    forward(dest, op) { enviadosHilo.push({ tipo: "forward", a: dest, html: op && op.htmlBody, adj: (op && op.attachments || []).length, hilo: m.hilo.id });
      m.hilo.msgs.push(M("f" + (++seq), "SIAU <siau@miredips.org>", "Fwd: " + asunto, "reenvío\n" + MARCA, new Date())); } };
  return m;
}
const MARCA = "Mensaje generado por el Sistema de PQRS de MiRed IPS.";
const cod1 = cons.celda(5 + n - 1, 1), cod2 = cons.celda(5 + n - 2, 1);
const H_ = {};
function Hilo(id, msgs) { const h = { id, msgs, etq: [] }; h.t = { getId: () => id, getMessages: () => h.msgs, getLabels: () => h.etq, getFirstMessageSubject: () => h.msgs[0].getSubject(),
  addLabel: l => h.etq.push({ getName: () => l.getName() }) }; msgs.forEach(m => m.hilo = h); H_[id] = h; return h; }
Hilo("t0", [M("m1", "Pedro <pedro@gmail.com>", "Queja por mala atención", "Quiero poner una queja porque no me atendieron.")]);
Hilo("t1", [M("m2a", "SIAU <siau@miredips.org>", "[SOLICITUD INTERNA · PQRS " + cod1 + "] Queja", "…"), M("m2", "Ana <urg@miredips.org>", "RE: [SOLICITUD INTERNA · PQRS " + cod1 + "] Queja", "Se habló con el médico y se reprogramó la cita.\n\nEl lun, 21 sept 2026 escribió:\n> texto viejo")]);
Hilo("t2", [M("m3", "SIAU <siau@miredips.org>", "Radicación de su PQRS – " + cod2, MARCA)]);
Hilo("t3", [M("m4", "Mail Delivery Subsystem <mailer-daemon@googlemail.com>", "Delivery Status Notification (Failure)", "No se pudo entregar a u@x.com")]);
Hilo("t4", [M("m5", "Marta <marta@gmail.com>", "Re: Radicación de su PQRS – " + cod2, "Gracias, quedo atenta.\n\nOn Mon wrote:\n> ...")]);
Hilo("t5", [M("m6", "Boletín <news@empresa.com>", "Novedades del mes", "Descuentos")]);
Hilo("t6", [M("m7", "Luisa Gómez <luisa@gmail.com>", "Solicitud de cita con ortopedia", "Buenas tardes, quiero agendar una cita con ortopedia en la sede Camino La Playa. Mi cédula es 1.045.678.901 y mi celular 300 123 4567.", null, [Att("orden_medica.pdf", "application/pdf", 3000), Att("carnet.jpg", "image/jpeg", 2000)])]);
Hilo("t8", [M("e1", "Radicación PQRD <pqrd@nuevaeps.com.co>", "PQRD 2026-555 RIESGO VITAL paciente sin insulina", "Se traslada PQRD de riesgo vital: usuaria con diabetes sin entrega de insulina.", null, [Att("pqrd.pdf", "application/pdf", 900)])]);
Hilo("t9", [M("e2", "Gestión <gestion@affinitybpo.com.co>", "Remisión de caso usuario", "Remitimos caso de usuario para su gestión.")]);
Hilo("t10", [M("e3", "Juzgado <j05civil@cendoj.ramajudicial.gov.co>", "Notificación acción de tutela 2026-001", "Se notifica auto admisorio de acción de tutela.")]);
Hilo("t11", [M("e4", "Lucía Pérez <lucia.p@gmail.com>", "Queja por maltrato en urgencias", "Presento una queja porque la enfermera fue grosera y me trató con falta de respeto.")]);
Hilo("t7", [M("m8", "Jorge <jorge@gmail.com>", "Queja: no me asignan la cita", "Presento una queja porque llevo un mes sin que me asignen la cita.")]);
const gmail = {
  getUserLabelByName: () => null, createLabel: n => ({ getName: () => n }), getAliases: () => [],
  search: () => Object.values(H_).map(h => h.t),
  getThreadById: id => H_[id] ? H_[id].t : null,
  getMessageById: id => { for (const h of Object.values(H_)) for (const m of h.msgs) if (m.getId() === id) return m; throw new Error("no"); },
};
const G = crear({ "Consolidado_PQRS": cons, "Trazabilidad": traza, "Responsables": resp, "Config": cfg, "Mapeo_Formulario": mapeo }, gmail);

// ---------- pruebas ----------
const boot = G.appBootstrap_();
assert(boot.migracion && boot.migracion.hecho, "migración ejecutada al arrancar: " + boot.migracion.mensaje);
const fr = cons.celda(5, 5);
assert(Utilities.formatDate(fr, TZ, "HH:mm") === "00:00" && Utilities.formatDate(fr, TZ, "dd") === "03", "fecha desplazada corregida a medianoche del día correcto (" + Utilities.formatDate(fr, TZ, "yyyy-MM-dd HH:mm") + ")");
const finDatos = 4 + n;   // último registro del libro de prueba
assert(Object.keys(cons.formulas).length === (finDatos + 200 - 4) * 6, "fórmulas hasta el último registro + 200 filas de colchón: " + Object.keys(cons.formulas).length);
assert(G.__props.ESQUEMA === "8.5", "versión de esquema guardada");
assert(cons.formulas["5:34"].indexOf("Festivos!$A$2:$A$400") !== -1, "fecha máxima con la hoja de festivos");
assert(G.appBootstrap_().migracion.hecho === false, "la migración no se repite");
fs.writeFileSync(__dirname + "/salida/formulas_muestra.json", JSON.stringify({ AF: cons.formulas["5:32"], AG: cons.formulas["5:33"], AH: cons.formulas["5:34"], AI: cons.formulas["5:35"], AJ: cons.formulas["5:36"], AT: cons.formulas["5:46"] }, null, 1));

const d1 = G.apiDashboard_({ anio: "2026", mes: "0", sede: "", servicio: "" });
assert(d1.total > 0 && d1.anios.join() === "2026,2025", "tablero 2026: " + d1.total + " PQRS, años " + d1.anios);
assert(Object.keys(d1.porMesTipo).every(k => k.indexOf("2026-") === 0), "tendencia mensual solo del año elegido");
const d2 = G.apiDashboard_({ anio: "2026", mes: "3" });
assert(d2.total > 0 && d2.total < d1.total, "filtro por mes (marzo): " + d2.total);
assert(Object.keys(d2.porMes).length > 1, "con mes elegido la tendencia conserva los 12 meses");
const d3 = G.apiDashboard_({ anio: "", mes: 0 });
assert(d3.total === n, "histórico completo = " + n);
assert(d1.criticas.every(c => Number.isInteger(c.dias)), "días enteros en críticas");
assert(G.apiDashboard_().total === n, "rutina (sin filtros) usa histórico");

const rm = G.apiResumenMensual_(2025);
assert(rm.meses.length === 12 && rm.anual.total === rm.meses.reduce((s, m) => s + m.total, 0), "resumen mensual 2025 cuadra: " + rm.anual.total);
const conSede = rm.meses.find(m => m.total);
assert(Object.keys(conSede.sedes).length > 0 && conSede.sedes[Object.keys(conSede.sedes)[0]].servicios, "detalle por sede con servicios");
assert(G.apiResumenMensual_().anio === +Utilities.formatDate(new Date(), TZ, "yyyy"), "año por defecto = actual");

const hoy = G.apiResumenHoy_();
assert(typeof hoy.radicadasMes === "number" && hoy.correo && hoy.correo.sistema >= 1, "inicio: resumen + correo (sistema ocultos: " + hoy.correo.sistema + ")");

const c = G.apiCorreos_(false);
const cat = id => (c.items.find(x => x.id === id) || {}).categoria;
assert(cat("m1") === "pqrs", "correo de usuario → posible PQRS");
assert(cat("m2") === "area" && c.items.find(x => x.id === "m2").respuesta === "Se habló con el médico y se reprogramó la cita.", "respuesta del área detectada y sin citas");
assert(cat("m3") === undefined && cat("m2a") === undefined && c.resumen.sistema === 2, "notificaciones propias ocultas (" + c.resumen.sistema + ")");
assert(cat("m7") === "cita", "solicitud de cita separada de las PQRS");
assert(cat("m8") === "pqrs", "queja que menciona una cita sigue siendo PQRS");
assert(cat("m4") === "rebote", "rebote detectado");
assert(cat("m5") === "usuario" && c.items.find(x => x.id === "m5").codigo === cod2, "usuario responde sobre su radicado");
assert(cat("m6") === "otro", "otros correos separados");
assert(c.resumen.relevantes >= 6, "relevantes = " + c.resumen.relevantes);

const rad = G.apiRadicar_({ descripcion: "Prueba", fechaRecepcion: "2026-09-22", fechaRadicacion: "2026-09-22", tipoPqrs: "Queja", sede: sedes[0], correo: "p@x.com", entidad: "SEDE MIRED" });
assert(rad.ok && /^SIAU-2026-09-\d{4}$/.test(rad.codigo), "radicación presencial: " + rad.codigo);
const filaR = G._filaDe(rad.codigo);
assert(Utilities.formatDate(cons.celda(filaR, 5), TZ, "yyyy-MM-dd HH:mm") === "2026-09-22 00:00", "fecha de radicación a medianoche en zona de la hoja");
const html = G.__enviados[G.__enviados.length - 1].html;
assert(html.indexOf("Volkswagen Serial") !== -1 && html.indexOf("Mensaje generado por el Sistema de PQRS de MiRed IPS") !== -1, "correo con tipografía VW y marca del sistema");

cons.poner(filaR, 36, 2.0833333);   // simula el valor de la fórmula
cons.poner(filaR, 32, "⚠");
const det = G.apiDetalle_(rad.codigo);
assert(det.dias === 2, "detalle: días enteros (" + det.dias + ")");
assert(/Revisar la entidad/.test(det.terminoTexto), "detalle: término legible → " + det.terminoTexto);

const env = G.apiEnviarAlArea_(rad.codigo, 1, "Revisar");
assert(env.ok && G.__enviados.some(e => /^\[SOLICITUD INTERNA/.test(e.asunto)) && G.__enviados.some(e => /está en trámite/.test(e.asunto)), "solicitud interna y aviso al usuario por separado");
const interno = G.__enviados.find(e => /^\[SOLICITUD INTERNA/.test(e.asunto)).html;
assert(interno.indexOf("Días transcurridos") !== -1 && interno.indexOf(">2<") !== -1, "correo interno muestra días enteros");

const reg = G.apiRegistrarRespuestaDesdeCorreo_("m2", cod1, "");
assert(reg.ok && cons.celda(G._filaDe(cod1), 42) === "Se habló con el médico y se reprogramó la cita.", "respuesta del área registrada desde el correo");
assert(G.apiCorreos_(false).items.every(x => x.id !== "m2"), "el correo registrado ya no aparece");
assert(G.apiMarcarCorreoAtendido_("m5", cod2).ok, "correo del usuario marcado y anotado");

const nov = G.apiNovedades_(Date.now() - 60000, true);
assert(nov.eventos.some(e => e.codigo === rad.codigo && e.tipo === "Queja"), "novedades: radicación reciente con tipo (" + nov.eventos.length + " eventos)");
assert(nov.correo && typeof nov.correo.relevantes === "number", "novedades: resumen de correo");
G.rutinaDiaria();
assert(G.__enviados.some(e => /^Control PQRS/.test(e.asunto)), "control diario enviado");
console.log("enviados:", G.__enviados.map(e => e.asunto).join(" | "));
fs.writeFileSync(__dirname + "/salida/muestra_interno.html", interno);

// ======== v6: fórmulas y conversaciones de correo ========
cons.formulas = {};
for (let r = 5; r <= 404; r++) cons.formulas[r + ":36"] = "=IF(OR($E" + (r + 13) + "=\"\",1),\"\",1)";   // filas desplazadas, como en el libro del usuario
const salud = G._saludFormulas_();
const finS = G._finDatos_();
assert(salud.reparado && cons.formulas["5:36"].indexOf("$E5") !== -1 && cons.formulas[finS + ":36"].indexOf("$E" + finS) !== -1, "fórmulas desplazadas reparadas: " + salud.mensaje);
assert(G._saludFormulas_().reparado === false, "segunda revisión: sin cambios");
assert(G._conPuntoYComa_('=IF(A1="a,b",1,2)') === '=IF(A1="a,b";1;2)', "cambio de separador respeta los textos");

const h6 = G.apiHilo_("t6");
assert(h6.ok && h6.mensajes[0].adjuntos.length === 2, "conversación con 2 adjuntos");
assert(h6.datos.numDocSolicitante === "1045678901" && h6.datos.telefono === "3001234567", "datos leídos del correo: doc " + h6.datos.numDocSolicitante + " · tel " + h6.datos.telefono);
assert(h6.datos.sede === "Camino La Playa" || h6.datos.sede === sedes[1], "sede detectada: " + h6.datos.sede);
const ad = G.apiAdjunto_("m7", 0);
assert(ad.ok && ad.base64.length > 100 && ad.tipo === "application/pdf", "adjunto disponible para ver");
const sd = G.apiSolicitarDatos_("t6", { items: ["Número de documento", "Foto de la orden médica"], categoria: "cita" });
assert(sd.ok && enviadosHilo[enviadosHilo.length - 1].tipo === "reply" && enviadosHilo[enviadosHilo.length - 1].a.indexOf("luisa") !== -1, "solicitud de datos en el mismo hilo: " + sd.mensaje);
const c2 = G.apiCorreos_(false);
assert(c2.items.find(x => x.hiloId === "t6").categoria === "curso", "la conversación pasa a «en conversación»");
const dir = G.apiDireccionarHilo_("t6", { idResponsable: 1, modo: "reenviar", avisarUsuario: true, categoria: "cita", nota: "Agendar con ortopedia",
  adjuntos: [{ msgId: "m7", idx: 0 }], archivos: [{ nombre: "nota.txt", tipo: "text/plain", base64: Buffer.from("hola").toString("base64") }] });
const fw = enviadosHilo.filter(e => e.tipo === "forward").pop();
assert(dir.ok && fw && fw.a === "urg@miredips.org" && fw.adj === 1, "reenviado al área con el archivo subido (los adjuntos del mensaje viajan con el reenvío): " + dir.mensaje);
assert(/Agendar con ortopedia/.test(fw.html) && /quiero agendar/.test(fw.html), "el reenvío lleva la nota y el mensaje del usuario");
H_.t6.msgs.push(M("m9", "Ana <urg@miredips.org>", "Re: Fwd: Solicitud de cita con ortopedia", "Cita asignada para el 30/09 a las 8:00 a. m.", new Date(Date.now() - 500)));
const h6b = G.apiHilo_("t6");
assert(h6b.mensajes.some(x => x.rol === "area") && h6b.mensajes.some(x => x.rol === "siau"), "usuario, área y SIAU en la misma conversación");
const cp = G.apiDireccionarHilo_("t0", { idResponsable: 1, modo: "copia", nota: "" });
assert(cp.ok && enviadosHilo.filter(e => e.tipo === "reply").pop().cc === "urg@miredips.org", "respuesta al usuario con copia al área");
const rh = G.apiResponderHilo_("t6", { mensaje: "Su cita quedó para el 30/09.", copiaArea: true, cerrar: true });
assert(rh.ok, "respuesta final al usuario");
assert(!G.apiCorreos_(false).items.some(x => x.hiloId === "t6"), "conversación atendida sale de la bandeja");
const rc = G.apiRadicarCorreo_("m8", { tipoPqrs: "Queja", descripcion: "No asignan cita", numDocSolicitante: "123456", telefono: "3009998877", eps: "X", guardarAdjuntos: true, correo: "jorge@gmail.com" });
const fr8 = G._filaDe(rc.codigo);
assert(rc.ok && cons.celda(fr8, 9) === "123456" && cons.celda(fr8, 11) === "3009998877" && cons.celda(fr8, 20) === "X", "radicación desde el correo con todos los datos del usuario");
const drv = G.apiGuardarAdjuntoDrive_("m7", 1, rc.codigo);
assert(drv.ok && /drive/.test(drv.url), "adjunto guardado en Drive");
const cons3 = G._siguienteConsecutivo();
G.apiRadicar_({ descripcion: "x", fechaRecepcion: "2026-09-22", fechaRadicacion: "2026-09-22", tipoPqrs: "Queja" });
assert(G._siguienteConsecutivo() === cons3 + 1, "consecutivo avanza");
fs.writeFileSync(__dirname + "/salida/muestra_reenvio.html", fw.html);
fs.writeFileSync(__dirname + "/salida/muestra_solicitud.html", enviadosHilo.find(e => /Necesitamos completar/.test(e.html || "")).html);
fs.writeFileSync(__dirname + "/salida/muestra_usuario.html", G.__enviados.find(e => /está en trámite/.test(e.asunto)).html);

// ======================= v7 =======================
console.log("---- v7: usuarios, sedes, clasificador, correo automático ----");
assert(G.estadoAcceso().hayUsuarios === false, "sin usuarios: se ofrece crear el primer administrador");
assert(G.crearPrimerAdministrador({ usuario: "ad", clave: "corta" }).ok === false, "contraseña débil rechazada");
const adm = G.crearPrimerAdministrador({ usuario: "admin.pruebas", nombre: "Admin Pruebas", clave: "Calidad2026", correo: "admin.pruebas@miredips.org" });
assert(adm.ok && adm.token, "primer administrador creado e ingresado");
assert(G.crearPrimerAdministrador({ usuario: "otro", clave: "Calidad2026" }).ok === false, "no se puede crear otro administrador inicial");
const T = adm.token;
const b0 = G.api(T, "appBootstrap", []);
assert(b0.sesion && b0.sesion.rol === "Administrador" && b0.sesion.puede.admin, "arranque con la sesión del administrador");
assert(G.api("token-falso", "apiBandeja", [{}]).__sesion === false, "sin sesión válida no hay acceso");
const nu = G.api(T, "apiGuardarUsuario", [{ usuario: "tecnico1", nombre: "Técnica La Playa", rol: "Técnico", sedes: [sedes[1]], clave: "Tecnico2026", avisos: true, correo: "tec1@miredips.org" }]);
assert(nu.ok && nu.usuarios.length === 2, "administrador crea un técnico con sede asignada");
const lt = G.iniciarSesion("tecnico1", "Tecnico2026");
assert(lt.ok && lt.usuario.debeCambiar, "el técnico ingresa (debe cambiar la contraseña temporal)");
const t1 = lt.token;
assert(G.api(t1, "apiBandeja", [{ etapa: "todas" }]).__cambiarClave === true, "con contraseña temporal el servidor solo deja cambiarla");
assert(G.api(t1, "apiCambiarMiClave", ["Tecnico2026", "tecnico1Clave2026"]).ok === false, "la contraseña no puede contener el usuario");
assert(G.api(t1, "apiCambiarMiClave", ["Tecnico2026", "corta1A"]).ok === false && G.api(t1, "apiCambiarMiClave", ["Tecnico2026", "sinmayuscula2026"]).ok === false, "política: mínimo 10 caracteres con mayúscula, minúscula y número");
assert(G.api(t1, "apiCambiarMiClave", ["Tecnico2026", "Tecnico2026"]).ok === false, "la nueva contraseña debe ser distinta de la actual");
assert(G.api(t1, "apiCambiarMiClave", ["Tecnico2026", "NuevaClave99x"]).ok, "el técnico cambia su contraseña temporal");
const band = G.api(t1, "apiBandeja", [{ etapa: "todas" }]);
assert(band.length > 0 && band.every(x => x.sede === sedes[1]), "el técnico solo ve su sede (" + band.length + " PQRS)");
const ajena = cons.celda(5, 1), sedeAjena = cons.celda(5, 22);
if (sedeAjena !== sedes[1]) assert(G.api(t1, "apiDetalle", [ajena]).ok === false, "no puede abrir PQRS de otra sede");
assert(G.api(t1, "apiRadicar", [{ descripcion: "x", fechaRecepcion: "2026-09-22", fechaRadicacion: "2026-09-22", tipoPqrs: "Queja", sede: sedes[2] }]).ok === false, "no puede radicar en otra sede");
const rt = G.api(t1, "apiRadicar", [{ descripcion: "Quiero felicitar al médico, pero la recepcionista fue grosera y me trató con falta de respeto. Pésima atención.", fechaRecepcion: "2026-09-22", fechaRadicacion: "2026-09-22", tipoPqrs: "Felicitación", sede: sedes[1] }]);
assert(rt.ok && rt.sugerido === "Queja", "radicación del técnico: el clasificador sugiere «Queja» para una «felicitación» negativa");
assert(/Técnica La Playa/.test(cons.celda(G._filaDe(rt.codigo), 53)), "queda registrado quién tabuló");
assert(G.api(t1, "apiCorreos", [false]).__permiso === false, "sin permiso de correo no ve el buzón");
assert(G.api(t1, "apiUsuarios", []).__permiso === false, "un técnico no administra usuarios");
{ const cod1 = band[0].codigo;
  assert(G.api(t1, "apiEnviarAlArea", [cod1, 1, ""]).__permiso === false && G.api(t1, "apiResponderUsuario", [cod1, "x", true]).__permiso === false,
    "puente: el técnico no direcciona ni responde (lo hace el administrador)");
  assert(G.api(t1, "apiCorreos", [false]).__permiso === false, "el técnico no gestiona el correo institucional");
  const bt = G.api(t1, "appBootstrap", []);
  assert(bt.sesion.puede.radicar === true && bt.sesion.puede.gestion === false, "permisos del técnico: radica sí, gestiona no"); }
const dash = G.api(t1, "apiDashboard", [{ anio: "", mes: 0 }]);
assert(dash.total === G.api(t1, "apiBandeja", [{ etapa: "todas" }]).length, "tablero del técnico = sus sedes (" + dash.total + ")");
const hoyT = G.api(t1, "apiResumenHoy", []);
assert(Object.keys(hoyT.porSede).length === 1 && hoyT.sinCorreo, "inicio del técnico: distribución de su sede, sin correo");
assert(G.api(t1, "apiCambiarMiClave", ["NuevaClave99x", "OtraClave2026x"]).ok, "el técnico vuelve a cambiar su contraseña");
for (let i = 0; i < 5; i++) G.iniciarSesion("tecnico1", "mala");
assert(/Demasiados intentos/.test(G.iniciarSesion("tecnico1", "OtraClave2026x").mensaje), "bloqueo tras 5 intentos fallidos");
G.api(T, "apiRestablecerClave", ["tecnico1", "Temporal2026"]);
G.api(T, "apiGuardarUsuario", [{ usuario: "tecnico1", editar: true, nombre: "Técnica La Playa", rol: "Técnico", sedes: [sedes[1]], activo: false }]);
assert(/inactivo/.test(G.iniciarSesion("tecnico1", "Temporal2026").mensaje), "usuario inactivado no puede ingresar");
assert(G.api(t1, "apiBandeja", [{}]).__sesion === false, "al inactivarlo, su sesión deja de valer");
assert(G.api(T, "apiGuardarUsuario", [{ usuario: "admin.pruebas", editar: true, rol: "Técnico", sedes: ["TODAS"] }]).ok === false, "no se puede quitar el último administrador");

// clasificador
const k = (t, d) => G._clasificarTipo_(t, d || "");
assert(k("Quiero felicitar a la jefe de enfermería por la excelente atención y la calidez con mi mamá").tipo === "Felicitación", "felicitación real");
assert(k("Solicito copia de mi historia clínica y certificado de incapacidad").tipo === "Petición", "petición");
assert(k("Sugiero que habiliten más sillas, sería bueno mejorar la sala").tipo === "Sugerencia", "sugerencia");
assert(k("No me entregaron el medicamento y no autorizaron la orden, exijo solución").tipo === "Reclamo", "reclamo");
const fq = k("Felicito pero no fue una buena atención: el médico fue grosero y hubo mucha demora", "Felicitación");
assert(fq.tipo === "Queja" && fq.confianza === "alta", "«felicitación» con contenido negativo → Queja (confianza " + fq.confianza + ")");

// fórmulas con categorías del correo
assert(G._formulasFila_(5).bloque[0].indexOf("Categorias_Correo") !== -1, "el término toma primero la categoría del correo");

// correo automático
G.__props.AJUSTES = JSON.stringify({ desde: 1, webhookChat: "https://chat.googleapis.com/v1/spaces/X/messages?key=k", avisarA: "siau.lider@miredips.org" });
G.SESION = null;
const antes = enviadosHilo.length;
const pr = G.procesarCorreoEntrante();
console.log("   " + pr.mensaje);
const fe1 = G._filaDe(pr.codigos.find(c => { const f = G._filaDe(c); return cons.celda(f, 52) === "e1"; }) || "x");
assert(fe1 > 0 && cons.celda(fe1, 28) === "SUPERSALUD RIESGO VITAL" && cons.celda(fe1, 31) === "EPS" && cons.celda(fe1, 20) === "X" || (fe1 > 0 && cons.celda(fe1, 28) === "SUPERSALUD RIESGO VITAL"), "Nueva EPS · riesgo vital radicada con su categoría");
assert(!enviadosHilo.slice(antes).some(e => e.tipo === "reply"), "a las EPS y entes de control NO se les responde ni se les envía nada de forma automática");
assert(!G.__enviados.some(e => /@(nuevaeps|famisanar|sura|mutualser|affinitybpo|procuraduria|supersalud)\./.test(e.para || "")), "ningún correo del sistema sale hacia dominios de EPS o entes");
assert(G.UrlFetchApp.llamadas.some(l => /CRÍTICA/.test(l.texto)), "aviso a Google Chat con prioridad crítica");
assert(G._hilos_()["t9"] && G._hilos_()["t9"].estado === "Por clasificar", "Affinity (Mutual Ser) sin categoría → «Por clasificar»");
const fe4 = pr.codigos.map(c => G._filaDe(c)).find(f => cons.celda(f, 52) === "e4");
assert(fe4 && cons.celda(fe4, 27) === "Queja" && /Datos incompletos/.test(cons.celda(fe4, 51)), "queja de usuario radicada sola, marcada con datos incompletos");
assert(!pr.codigos.some(c => cons.celda(G._filaDe(c), 52) === "m7"), "la solicitud de cita no se radica como PQRS");
const pr2 = G.procesarCorreoEntrante();
assert(pr2.radicadas === 0, "segunda pasada: no duplica");
const ci = G.apiCorreos_(false);
assert(ci.items[0].categoria === "institucional" && ci.items[0].entidad, "en Correo, lo de EPS/entes va primero (" + ci.items[0].entidad + ")");

// alerta de meta interna (tutela sin direccionar a las 9 h)
const ft = G._filaDe(pr.codigos[0]);
cons.poner(ft, 28, "TUTELA"); cons.poner(ft, 6, new Date(Date.now() - 9 * 3600000)); cons.poner(ft, 39, "");
const al = G.revisarAlertas();
assert(al.alertas >= 1 && G.UrlFetchApp.llamadas.some(l => /ALERTA/.test(l.texto)), "alerta de tutela sin direccionar tras 8 h");
assert(G.revisarAlertas().alertas === 0, "la alerta no se repite");
const cartaUsr = G.__enviados.map(e => e.html || "").find(h => /Fecha de los hechos/.test(h));
assert(!!cartaUsr, "las notificaciones incluyen fecha de los hechos, recepción y vencimiento");

// ---------------- v7.1 · notificaciones confidenciales, párrafos y felicitaciones ----------------
console.log("---- v7.1: notificaciones ----");
assert(G.UrlFetchApp.llamadas.every(l => !/insulina|diabetes|grosera|Lucía|maltrato/i.test(l.texto)), "Google Chat sin descripción ni datos del usuario");
const avisosTec = G.__enviados.filter(e => /^\[PQRS/.test(e.asunto));
assert(avisosTec.length > 0 && avisosTec.every(e => !/insulina|diabetes|grosera|Lucía|maltrato|paciente sin/i.test(e.html + e.asunto)), "avisos a técnicos sin descripción, nombres ni asunto original");
assert(avisosTec.every(e => /Información confidencial/.test(e.html)), "avisos internos con advertencia de confidencialidad");
assert(G._usuario().indexOf("@") === -1, "sin sesión, la traza dice «Sistema» y no un correo: " + G._usuario());
const p1 = G._parrafos_("Cordial saludo.\n\nPrimer párrafo\ncon salto.\n\n\nSegundo <b>x</b>");
assert((p1.match(/<p /g) || []).length === 3 && /con salto/.test(p1) && /<br\/>con salto/.test(p1) && /&lt;b&gt;/.test(p1), "texto → párrafos reales, saltos y HTML escapado");
G.SESION = { usuario: "siau.admin", nombre: "Admin", rol: "Administrador", todas: true, sedes: ["TODAS"] };
const rf = G.apiRadicar_({ descripcion: "Felicito a la doctora por su calidez.\n\nMuy amable todo el equipo.", fechaRecepcion: "2026-09-22", fechaRadicacion: "2026-09-22",
  tipoPqrs: "Felicitación", sede: sedes[0], servicio: "Urgencias", correo: "feliz@x.com" });
const acF = G.__enviados.filter(e => e.para === "feliz@x.com" || (e.a || "") === "feliz@x.com").pop() || G.__enviados.find(e => /Gracias por su felicitación/.test(e.asunto));
assert(acF && /Gracias por su felicitación/.test(acF.asunto) && /(&#9733;|cid:mascotaSiau)/.test(acF.html) && !/Fecha límite/.test(acF.html) && /Sus palabras/.test(acF.html), "acuse de felicitación con diseño propio y sin vencimiento");
assert((acF.html.match(/Muy amable todo el equipo/g) || []).length === 1 && /<p [^>]*>Muy amable todo el equipo/.test(acF.html), "las palabras del usuario conservan sus párrafos");
const envF = G.apiEnviarAlArea_(rf.codigo, 1, "");
const reco = G.__enviados.find(e => /^\[RECONOCIMIENTO/.test(e.asunto));
assert(reco && /reconoce la labor de su equipo/.test(reco.html) && !/Qué se requiere/.test(reco.html), "a el área le llega un reconocimiento, no una solicitud de gestión");
assert(!G.__enviados.some(e => /^Entregamos su felicitación/.test(e.asunto)), "v8: la felicitación solo lleva el acuse (no se le escribe de nuevo al usuario)");
assert(/cerrada/i.test(envF.estado) && /^SIAU-2026-09-\d{4}$/.test(rf.codigo), "v8.1: felicitación con radicado SIAU y cerrada al entregarse al área: " + rf.codigo + " · " + envF.estado);
G.apiResponderUsuario_(rf.codigo, "Cordial saludo.\n\nGracias por escribirnos.\n\nAtentamente,\nSIAU", true);
const finF = G.__enviados.filter(e => /Gracias por su felicitación/.test(e.asunto)).pop();
assert(/<p [^>]*>Gracias por escribirnos\.<\/p>/.test(finF.html) && /Atentamente,<br\/>SIAU/.test(finF.html), "respuesta final con párrafos separados");
fs.writeFileSync(__dirname + "/salida/muestra_feli_acuse.html", acF.html);
fs.writeFileSync(__dirname + "/salida/muestra_feli_area.html", reco.html);
fs.writeFileSync(__dirname + "/salida/muestra_feli_final.html", finF.html);
fs.writeFileSync(__dirname + "/salida/muestra_aviso_tecnico.html", avisosTec[0].html);
const alertaMail = G.__enviados.find(e => /^\[ALERTA PQRS\]/.test(e.asunto));
if (alertaMail) fs.writeFileSync(__dirname + "/salida/muestra_alerta.html", alertaMail.html);
console.log("fin v7.1");
// v7.2 · diagnóstico cuando la implementación se ejecuta con la cuenta del visitante
{
  const orig = G.SpreadsheetApp.getActiveSpreadsheet, ssAntes = G._SS_;
  G._SS_ = null;   // cada ejecución de Apps Script empieza sin el consolidado en memoria
  G.SpreadsheetApp.getActiveSpreadsheet = () => { throw new Error("No cuentas con el permiso necesario para acceder al documento solicitado."); };
  const ea = G.estadoAcceso(), li = G.iniciarSesion("tecnico1", "x");
  G.SpreadsheetApp.getActiveSpreadsheet = orig; G._SS_ = ssAntes;
  assert(/Ejecutar como: Yo/.test(ea.error) && /siau@miredips.org/.test(ea.error), "estadoAcceso explica cómo corregir la implementación");
  assert(!li.ok && /Ejecutar como: Yo/.test(li.mensaje), "el ingreso explica el error de permisos en vez del mensaje de Google");
}
