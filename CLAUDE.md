# CLAUDE.md · Sistema de Gestión de PQRS · MiRed Barranquilla IPS

Aplicación web en **Google Apps Script** (también publicable como portal estático que llama a `doPost`) que opera sobre un **Google Sheets** (el "consolidado") de la cuenta del SIAU (Oficina de Atención al Usuario). Unifica en un solo lugar las PQRS (peticiones, quejas, reclamos, sugerencias, felicitaciones, denuncias y tutelas) que llegan por formulario QR, correo institucional (EPS y entes de control) y atención presencial en cada sede. La plataforma **radica**, calcula términos legales y semáforo, **direcciona** al área responsable, registra la respuesta del área, **responde** al usuario y deja **trazabilidad** de todo.

Versión actual: **8.9** (8.9: pulido visual: avisos compactos, indicadores en cuadrícula pareja, lectura más cómoda y movimiento fino · 8.8: WhatsApp (accesos y avisos a técnicos) y Excel por plantilla · 8.7: temas claro/oscuro/monocromático/cálido, pantalla de inicio y animaciones de carga, ajustes para iPhone, Android y tabletas, fondo sin franja blanca y aviso de «sin conexión» · 8.6: aviso 5 días antes del vencimiento, encuesta de satisfacción NPS en la respuesta final y portal instalable como app (PWA) · 8.5: motivo específico (derecho vulnerado) en lugar de tipología, ficha del formulario para técnicos, clave predeterminada con correo de bienvenida y mascota en el ingreso · 8.4: seguridad: política escrita en `docs/SEGURIDAD.md`, contraseñas de 10 caracteres, auditoría, sesión de 12 h, protección contra inyección de fórmulas y CSP en el portal · 8.2: radicación rápida, Excel y respaldo en Drive · 8.3: EPS y entes sin correos automáticos con análisis detallado, revisión cada 3 min, push con ntfy, correos e ingreso rediseñados, logos nuevos del SIAU). Historia, requisitos y decisiones: `docs/CONTEXTO.md`. Mapa del código: `docs/ARQUITECTURA.md`. Instalación y despliegue: `docs/DESPLIEGUE.md`. Pendientes y riesgos: `docs/PENDIENTES.md` (léelo antes de cambiar algo grande).

## Con quién trabajas

- **River**: Profesional de Gestión de Calidad de MiRed Barranquilla IPS S.A.S. No es programador de oficio, pero construye y despliega el sistema.
- Responde **en español**, directo, sin saludos ni despedidas. Usa negritas y tablas para escanear rápido. No hagas preguntas si hay una interpretación profesional razonable: decide, dilo y ejecuta.
- Él prefiere que **entregues el resultado hecho** (código listo para pegar o desplegar), no instrucciones para que él programe.
- Cuando entregues código para producción, dile exactamente qué pegar dónde y qué pasos de despliegue siguen (ver `docs/DESPLIEGUE.md`).

## Estructura

```
apps-script/        ← lo que se sube a Apps Script (clasp rootDir)
  Codigo.gs         ← TODO el backend (fuente de verdad, ~4.700 líneas; secciones v8 al final)
  Index.html        ← GENERADO desde frontend/ con `npm run ensamblar` (no editar a mano)
  appsscript.json   ← manifiesto (zona America/Bogota, V8, webapp como USER_DEPLOYING / ANYONE_ANONYMOUS)
frontend/           ← fuente de la interfaz, se concatena en orden alfabético
  1_head_estilos.html                     CSS, fuentes, Chart.js (CDN 4.4.1)
  2_cuerpo.html                           HTML: acceso, barra lateral, vistas v-*, iconos SVG
  3a_nucleo_inicio_bandeja_correo.html    utilidades, llamadas al servidor, inicio, bandeja, módulo de correo
  3b_detalle_tablero_responsables.html    detalle y gestión de una PQRS, tablero (gráficos), áreas
  3bz_v8_prioritarias_qr.html             v8: prioritarias, banda de riesgo, áreas sugeridas, redactor, QR y afiche, diagnóstico, confeti y alarma
  vendor/                                 qrcode-generator.js (MIT) e imagenes.js (mascota, generada por tools/imagenes.py); se incrustan con <!-- VENDOR x -->
  3c_acceso_usuarios_ajustes.html         ingreso/sesión, sonido y avisos, usuarios, configuración, arranque
tests/
  harness.js            simula SpreadsheetApp, GmailApp, DriveApp, CacheService… en Node (vm)
  pruebas_backend.js    110 verificaciones del backend real (escribe muestras en tests/salida/)
  pruebas_v8.js         v8: 450+ filas, series SIAU/FEL, corte del formulario, priorización, alertas 8 h, directorio, felicitaciones, redactor, entes, doPost
  e2e_portal.js         la interfaz publicada como portal habla con el backend real por doPost
  mock_browser.js       backend real + servicios simulados DENTRO del navegador (para la vista previa)
  e2e_plataforma.js     Playwright: recorre la plataforma en 1600/1366/820/390 px (admin y técnico)
  render_correos.js     captura PNG de cada correo de muestra
tools/  ensamblar.mjs · lint.mjs · pruebas.mjs · construir_preview.mjs · construir_portal.mjs · imagenes.py · migrar_historico.py
portal/ index.html (generado) + config.js (URL /exec) · .github/workflows/portal.yml publica en GitHub Pages
assets/ logo y mascota del SIAU (fuente de las imágenes incrustadas)
plantilla_libro/PQRS_BaseDatos_plantilla.xlsx   estructura real del consolidado SIN datos personales
docs/   CONTEXTO · ARQUITECTURA · DESPLIEGUE · PENDIENTES · requisitos/ (documento de automatización del correo)
legacy/ cómo se generó hasta v7.3 (parches sobre base_v4). Solo referencia: NO lo uses para construir.
```

## Comandos

```bash
npm install                 # PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 si ya tienes Chromium; si no: npx playwright install chromium
npm run ensamblar           # frontend/*.html → apps-script/Index.html
npm run lint                # ESLint (no-undef, claves duplicadas, etc.) sobre Codigo.gs y los <script> del frontend
npm test                    # Index al día + pruebas del backend con separador de fórmulas «,» y «;»
npm run preview             # tests/salida/Vista_Previa_Plataforma.html (funciona sin Google; usuarios demo: siau.admin / tecnico.playa / consulta · clave Demo2026)
npm run e2e                 # vista previa + recorrido Playwright (PW_CHROMIUM=/ruta/chrome para usar un Chromium propio)
npm run correos             # genera y captura los correos de muestra en tests/salida/
npm run verificar           # todo lo anterior
npm run portal              # portal/index.html para publicar fuera de Apps Script
npm run migrar -- --historico X.xlsx --formulario Y.xlsx --salida migracion_salida   # histórico → consolidado v8 (fuera del repo)
npm run push                # ensamblar + lint + test + clasp push (requiere .clasp.json, ver docs/DESPLIEGUE.md)
```

**Definición de terminado:** `npm run lint`, `npm test` y `npm run e2e` sin errores, y una prueba nueva en `tests/pruebas_backend.js` (y en `e2e_plataforma.js` si cambia la interfaz) por cada comportamiento nuevo. Revisa las capturas de `tests/salida/capturas/` cuando toques diseño.

## Reglas que no se pueden romper

1. **Seguridad de la API.** En Apps Script, cualquier función global sin `_` al final se puede llamar desde el navegador. Por eso:
   - Todo lo interno termina en `_`. El navegador entra **solo** por `api(token, nombre, args)`, que valida sesión, rol (`_permitido_`) y sede (`"codigo"` / `"sede"` en `RUTAS`).
   - Una API nueva es una función `apiAlgo_` + una entrada en `RUTAS` con su permiso. El frontend la llama con `srv("apiAlgo", …)`; `srvSilencioso` no muestra la animación de carga.
   - Funciones públicas permitidas: `doGet, doPost, onOpen, mostrarUrl, instalarDisparadores, alEnviarFormulario, importarFormulario, rutinaDiaria, repararFechasYFormulas, estadoAcceso, crearPrimerAdministrador, iniciarSesion, cerrarSesion, api, procesarCorreoEntrante, revisarAlertas, identificarPrioritarias, crearFormularioPQRS, diagnosticoPlataforma, verificarCuenta`. `verificarCuenta` solo responde si se ejecuta desde el editor (usuario activo = efectivo). Las de menú llaman `SpreadsheetApp.getUi()` como guarda. `doPost` solo despacha lo que está en `PUERTA_PORTAL` (las mismas funciones públicas de google.script.run). No agregues otras. `doGet` también atiende `?nps=…` (encuesta del correo de respuesta): enlace firmado con `NPS_SECRETO`, pide confirmar y registra un voto por radicado; es la única entrada pública sin sesión.
   - Las funciones internas con sufijo `_` que reciben datos (p. ej. `_estadoFormulario_(datos)`) nunca se exponen en `RUTAS` con esa firma.
2. **Roles (la plataforma es un puente).** El **Técnico** (SIAU de sede) radica o tabula y consulta **solo sus sedes asignadas**. El **Administrador** direcciona a las áreas, responde al usuario, gestiona el correo, los usuarios y la configuración. **Consulta** solo ve. Permisos: `P_LEER`, `P_RADICAR`, `P_GESTION`, `P_CORREO`, `P_ADMIN` en `_permitido_`. Toda lectura se filtra con `_sedeVisible_` / `_filaVisible_`.
3. **Confidencialidad (Ley 1581 de 2012 y reserva de historia clínica).**
   - **A las EPS y entes de control el sistema nunca les escribe de forma automática** (acuse, «en trámite»…): `_esInstitucional_`. Solo el administrador les responde.
   - Los avisos a técnicos, Google Chat, push (ntfy), **WhatsApp** y notificaciones del sistema operativo **nunca** llevan nombre, documento, descripción ni el asunto original: solo radicado, tipo, prioridad, sede y fechas, más un enlace a la plataforma.
   - Todo texto del usuario va escapado (`_html_`, `_parrafos_`, `esc()` en el frontend).
   - **Seguridad (`docs/SEGURIDAD.md`).** Todo texto externo que se escriba en la hoja pasa por `_seguroCelda_` (inyección de fórmulas: `_escribir`, `_traza`, y cada `setValue` de texto que venga de un usuario o de un correo). Los eventos de seguridad se registran con `_auditar_` (sin contraseñas ni datos de casos). Contraseñas: `_claveValida_` (10 caracteres, mayúscula, minúscula y número). El servidor, no la pantalla, exige el cambio de contraseña temporal. Un cambio de seguridad necesita su prueba en `tests/pruebas_v8.js` y su línea en `docs/SEGURIDAD.md`.
   - Nunca pongas datos reales en pruebas, capturas, commits ni ejemplos. Usa nombres ficticios y correos `@correo.com` o `@miredips.org` genéricos. El consolidado real no entra al repo (`.gitignore` bloquea `*.xlsx`).
4. **No muevas la hoja.** `Consolidado_PQRS` tiene 57 columnas fijas (mapa `C`; v8 agregó BB:BE al final), encabezados en la fila 4 y datos desde la fila 5 **sin tope**: el final lo calcula `_finDatos_()` (`CFG.FILA_FIN` es una propiedad calculada) y `_proximaFila` siempre agrega al final. Lee todo con `_datos_()` y busca radicados con `_filaDe` (usa `_codigos_()` en memoria). `Config` se lee **por posición**: términos A6:D9 (fila 9 = EPS), parámetros B11:B22 (`_param(i)` = B(11+i); 8 prefijo FEL, 9 corte del formulario, 10 política de datos, 11 enlace del QR), listas con encabezados en la fila 43 (hasta 150 valores). Festivos en la hoja **Festivos** (se completa sola). Si cambias la estructura, sube `ESQUEMA` (hoy "8.1") y agrega el paso en `_migrar_` / `_estructuraV8_` (idempotente).
   - **Una sola estructura de radicado (v8.1, pedido explícito de River):** `SIAU-AAAA-MM-NNNN` para todos los tipos y canales, con un único consecutivo que continúa el histórico (base en Config B11; `_siguienteConsecutivo` toma el mayor). No crees series paralelas. `_unificarRadicados_` (migración 8.1) convierte cualquier otro prefijo y deja el anterior en OBSERVACIONES.
   - **Acceso al consolidado:** siempre con `_ss_()` (nunca `SpreadsheetApp.getActiveSpreadsheet()` directo): usa la hoja vinculada o `CONSOLIDADO_ID` y, si Google niega el permiso, `_explicarError_` dice con qué cuenta se está ejecutando.
5. **Fechas y fórmulas.**
   - Las fechas se guardan sin hora con `_soloFecha_`, en la zona de la hoja. Los días se muestran siempre enteros (`_dias_`, `INT()`).
   - Las fórmulas se escriben **solo** con `_escribirFormulas_`: detecta si la hoja usa «,» o «;» (configuración regional de Colombia) leyendo `getDisplayValues`, y `_saludFormulas_` repara las que se dañen. Nunca `setFormula` con separadores fijos.
6. **Priorización.** El riesgo lo decide `_evaluarRiesgo_` (señales + población de especial protección + barrera de acceso) y lo aplica `_evaluarPrioridadFila_` en `_postRadicacion_` (todos los canales). Nunca baja una categoría, respeta las legales (tutela, derecho de petición, requerimiento) y `[Riesgo manual: …]`. Horas por nivel en `HORAS_NIVEL`; alertas en `revisarAlertas` (alcance «Responder» = aviso a la mitad y al final). Cualquier cambio de señales necesita su caso en `tests/pruebas_v8.js`, incluido un falso positivo.
7. **Correos.** Todos salen de `_correoDiseno_` (a través de `_plantilla` para radicados y `_correoHilo_` para los hilos de Gmail). Convierte el texto con `_parrafos_`: Gmail y Outlook ignoran `white-space:pre-wrap` y los párrafos se pegan. Las felicitaciones tienen diseño propio (sin términos ni vencimiento). Los correos internos llevan la advertencia de confidencialidad. Se envían con `_enviar` / `_opcionesCorreo_`, que respetan el alias "Enviar como" configurado.
8. **Frontend en el iframe de Apps Script o como portal.**
   - Nada de `location.reload()`: deja la página en blanco. El cierre de sesión se hace en sitio (`salir()` / `limpiarApp()`).
   - `localStorage` solo guarda el token, la preferencia de sonido, el tema (`pqrs_tema`) y, en el portal, la dirección del servidor (`pqrs_api`).
   - **Temas y dispositivo:** `html[data-tema]` (claro · oscuro · mono · calido), `data-so` (ios · android · escritorio) y `data-form` (movil · tablet · escritorio) los pone el script del `<head>`. Los temas solo cambian variables CSS (`frontend/1b_temas_dispositivos.html`); no pongas colores fijos nuevos en componentes: usa `var(--surface)`, `var(--ink)`, `--panel`, etc. El fondo va en `html::before` (fijo): no vuelvas a pintarlo en `body`.
   - Cada respuesta del servidor se descarta si cambió la sesión (`llamar()` compara el token).
   - Las notificaciones del escritorio pueden estar bloqueadas; el aviso externo confiable es Google Chat.
   - Fuera de Apps Script, el bloque «v8 · PORTAL» al inicio de 3a crea un `google.script.run` equivalente con `fetch` a `window.PQRS_API` (portal/config.js o `?api=`). No uses otras APIs de `google.script` sin agregarlas ahí.
   - Sonidos (`sonar`): "Vital" sirena, "Ente" toques graves, "Felicitación" arpegio + `celebrar()`; `alarmaVisual()` para riesgo vital. Respetan `prefers-reduced-motion`.
9. **Estilo del código.** ES5 (`var`, `function`), comentarios y textos en español. Textos de la interfaz en español de Colombia: el técnico se trata de "tú" y el usuario ciudadano de "usted" en los correos. Paleta por tipo (no cambiar):

   | Tipo | Color |
   |---|---|
   | Queja | `#E20A31` (rojo) |
   | Reclamo | `#F29D00` (amarillo-naranja) |
   | Sugerencia | `#1F6FD1` (azul) |
   | Felicitación | `#009C4D` (verde) |
   | Petición | `#7B4FB8` |
   | Tutela | `#374151` |
   | Denuncia | `#B4531A` |

   Los cuatro primeros son los del logo de MiRed y los fijó River; se aplican en TODO el sistema (interfaz, correos, ficha, gráficos). Fuente única en `COLOR_TIPO`/`FONDO_TIPO` (Codigo.gs), `TIPO_COLOR` (3a) y `--t-*` (CSS). No uses violeta para felicitaciones ni verde para sugerencias.

   Marca MiRed: teal `#006081` / `#00475F` y franja rojo `#E20A31`, amarillo `#FEDC00` y verde `#009C4D`. **Tipografía (regla de la institución):** cuerpo de cualquier apartado e imagen = **Volkswagen Serial**; títulos = **Volkswagen Serial Black**. Van primero en la pila (`--sans`, `--display`, `FF`, `FT`, ficha) y solo si no están instaladas cae a Barlow / Barlow Semi Condensed (lo más parecido libre). No uses otras fuentes. Mascotas: ingreso y ficha usan `IMG_MASCOTA_SIAU` (camiseta SIAU con megáfono), sin deformarla.
10. **Despliegue.** `clasp push` solo actualiza el código (el enlace /dev). Para que los técnicos vean el cambio hay que ir a **Implementar ▸ Administrar implementaciones ▸ lápiz ▸ Nueva versión** en la misma implementación (el enlace /exec no cambia). La implementación debe estar en **Ejecutar como: Yo (cuenta SIAU)** y **Quién tiene acceso: Cualquier persona**.

## Glosario rápido

| Término | Significado |
|---|---|
| PQRS | Petición, Queja, Reclamo, Sugerencia (más Felicitación, Denuncia y Tutela) |
| SIAU | Oficina de Atención al Usuario; también se les dice "siaus" a los técnicos de sede |
| Radicar / tabular | Registrar la PQRS en el consolidado con código `SIAU-AAAA-MM-NNNN` |
| Sede | Punto de atención (Camino La Playa, Paso Soledad…) |
| Direccionar | Enviar al área responsable; redireccionar corrige un envío equivocado |
| Entidad presentada | Ante quién se presentó (SEDE MIRED, SUPER SALUD, SECRETARIA DE SALUD, EPS). Define el término |
| Clasificación interna | Categoría de riesgo o legal (hoja Categorias_Correo): RIESGO VITAL NNA · 8 H, RIESGO VITAL · 24 H, RIESGO PRIORIZADO · 48 H, SUPERSALUD RIESGO …, TUTELA, DERECHO DE PETICIÓN, REQUERIMIENTO ENTE DE CONTROL. Manda sobre el término de la entidad presentada |
| NNA | Niñas, niños y adolescentes (Circular Supersalud 2026151000000007-5: riesgo vital en 8 horas) |
| Directorio | Hoja Responsables con reglas de direccionamiento (servicios, sedes, palabras clave, copias) |
| Semáforo / oportunidad | Estado frente al término (en término, por vencer, vencida) y si se respondió a tiempo |
