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
function M(id, de, asunto, cuerpo) {
  const m = { getId: () => id, getFrom: () => de, getSubject: () => asunto, getPlainBody: () => cuerpo, getDate: () => new Date(Date.now() - 60000),
    getAttachments: () => [], getThread: () => m.hilo.t,
    reply() { m.hilo.msgs.push(M("r" + Math.random(), "SIAU <siau@miredips.org>", "Re: " + asunto, MARCA)); }, forward() {} };
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
assert(boot.migracion.hecho && G.__props.ESQUEMA === "8.1", "migración a la versión 8: " + boot.migracion.mensaje);
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
assert(Object.keys(libro.hojas).filter(k => k !== "Hoja 1").sort().join() === "Consolidado,Resumen", "el Excel solo lleva Consolidado y Resumen (nunca la hoja Usuarios)");
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
assert(G.RUTAS.apiExportarExcel[1] === "admin" && G.RUTAS.apiRespaldarAhora[1] === "admin", "solo el administrador exporta y respalda");

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
