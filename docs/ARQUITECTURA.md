# Arquitectura

> **v8:** ver la sección «10. Versión 8» al final (rango dinámico, series, priorización, directorio, portal, migración). Las secciones 1–9 describen la base v7.3 y siguen vigentes salvo lo que allí se indica.

## 1. Visión general

```
                    ┌──────────────────── Google Sheets «consolidado» (Drive de la cuenta SIAU) ─────────────────────┐
 Formulario QR ──►  │ Respuestas de formulario 1 ─(alEnviarFormulario / importar + Mapeo_Formulario)─┐               │
 Correo (Gmail) ─►  │ procesarCorreoEntrante (cada 3 min) · módulo Correo en la plataforma ──────────┼─► Consolidado_PQRS
 Presencial ─────►  │ Radicar PQRS (plataforma, técnico de sede) ─────────────────────────────────────┘   (1 fila = 1 PQRS)
                    │ Trazabilidad · Responsables · Config · Plantillas · Usuarios · Entidades_Correo ·            │
                    │ Categorias_Correo · Gestion_Correo · Mapeo_Formulario · LÉEME                                │
                    └──────────────────────────────────────────────────────────────────────────────────────────────┘
        ▲  apps-script/Codigo.gs  (ejecuta como la cuenta SIAU: lee y escribe la hoja, Gmail, Drive y Google Chat)
        │  google.script.run → api(token, "apiX", args)  ·  estadoAcceso / iniciarSesion / cerrarSesion
 Navegador: apps-script/Index.html (aplicación de una sola página, sin frameworks; Chart.js para el tablero)
```

Disparadores (`instalarDisparadores`, menú PQRS de la hoja):

| Disparador | Función | Qué hace |
|---|---|---|
| Al enviar el formulario | `alEnviarFormulario` | Radica la respuesta del QR, aplica el clasificador y envía el acuse |
| Cada 1 min (corre cada ~3 min) | `procesarCorreoEntrante` | Automatización del correo (§5) |
| Cada hora | `revisarAlertas` | Tutela o Derecho de Petición sin direccionar después de la meta interna (8 h). Una sola alerta por radicado |
| Diario 7:00 | `rutinaDiaria` | Correo "Control diario" con vencidas y por vencer |

## 2. Mapa de `apps-script/Codigo.gs` (líneas aproximadas)

| Línea | Sección |
|---|---|
| 40 | Columnas del Consolidado_PQRS (1 = A) |
| 54 | Campo de la plataforma -> columna |
| 69 | APLICACIÓN WEB |
| 113 | UTILIDADES |
| 174 | RADICADO |
| 204 | CORREOS |
| 215 | Tipografía de los correos: Volkswagen Serial si el equipo del lector la tiene instalada; |
| 263 | API · ARRANQUE |
| 300 | API · RESPONSABLES |
| 353 | ACUSE DE RECEPCIÓN AL USUARIO (se usa en los tres canales) |
| 393 | API · RADICAR |
| 444 | API · BANDEJA Y DETALLE |
| 589 | API · GESTIÓN (enviar al área, redireccionar, responder, cerrar) |
| 829 | API · TABLERO |
| 948 | API · GOOGLE FORM EXISTENTE |
| 1198 | NORMALIZACIÓN DE LO QUE LLEGA DEL FORMULARIO |
| 1346 | ALERTA DIARIA |
| 1401 | INICIO · QUÉ HAY QUE HACER HOY |
| 1503 | CANAL CORREO CON VISTO BUENO |
| 1603 | PLANTILLAS DE RESPUESTA |
| 1657 | v5 · FECHAS SIN HORA, MIGRACIÓN Y UTILIDADES DE PRESENTACIÓN |
| 1715 | MIGRACIÓN AUTOMÁTICA (se ejecuta una sola vez al abrir la plataforma) |
| 1884 | PANEL POR MES Y AÑO (tarjetas de indicadores del Inicio) |
| 1943 | NOVEDADES EN SEGUNDO PLANO (avisos emergentes de la plataforma) |
| 1995 | CORREO: SEPARAR LO RELEVANTE DE LAS NOTIFICACIONES DE ESTA PLATAFORMA |
| 2087 | Registro de la gestión de cada conversación (hoja Gestion_Correo) |
| 2120 | Lectura |
| 2301 | Datos del usuario que se pueden leer del texto del correo |
| 2344 | Adjuntos: ver, guardar en Drive y reenviar |
| 2392 | Correo corto en el mismo hilo (misma imagen que las demás notificaciones) |
| 2415 | Acciones sobre la conversación |
| 2554 | v7 · ACCESO POR USUARIO Y CONTRASEÑA, ROLES Y SEDES ASIGNADAS |
| 2606 | Funciones públicas (las únicas que el navegador puede llamar) |
| 2689 | Permisos por función |
| 2763 | Administración de usuarios |
| 2829 | v7 · CLASIFICADOR DEL TIPO DE PQRS SEGÚN LO QUE DICE EL TEXTO |
| 2944 | v7 · AUTOMATIZACIÓN DEL CANAL CORREO (documento «Automatización Canal Correo Electrónico») |
| 2973 | Términos: Circular Externa Supersalud 2023151000000010-5 de 2023 (vital 24 h, priorizado 48 h, simple 72 h); |
| 3065 | Ajustes de la automatización (Configuración ▸ Automatización) |
| 3129 | Avisos fuera de la plataforma: Google Chat y correo |
| 3195 | Proceso automático (disparador cada minuto, trabaja cada ~3) |
| 3321 | Alerta de meta interna (Tutela y Derecho de petición: 8 horas desde la recepción) |
| 3371 | v7.1 · NOTIFICACIONES POR CORREO: diseño único, párrafos reales y confidencialidad |


## 3. Seguridad, sesiones y permisos

- **Ingreso:** `iniciarSesion(usuario, clave)` → hoja `Usuarios`. El hash es `_hash_`: SHA-256 con sal, 150 iteraciones. La sesión es un token aleatorio en `CacheService` (`ses_<token>`, 6 h). Tras 5 intentos fallidos la cuenta se bloquea 15 min (`int_<usuario>`). Con "DEBE CAMBIAR CLAVE" la interfaz obliga a crear una contraseña.
- **Primer ingreso:** si la hoja `Usuarios` está vacía, `crearPrimerAdministrador`.
- **Errores de permiso** ("No cuentas con el permiso…"): `_explicarError_` explica que la implementación no está en "Ejecutar como: Yo".
- **Puerta única:** `api(token, nombre, args)` valida sesión → `RUTAS[nombre]` → `_permitido_(sesión, permiso)`. Luego valida la sede, sea con `"codigo"` (la PQRS debe ser de una sede visible) o con `"sede"` (la sede de la radicación debe estar asignada). `SESION` queda global durante la llamada; los disparadores corren con `SESION = null` y ven todo.
- **Roles:** `_permitido_`

| Permiso | Administrador | Técnico | Consulta |
|---|:-:|:-:|:-:|
| P_LEER | ✔ | ✔ | ✔ |
| P_RADICAR (radicar, corregir datos, reclasificar tipo) | ✔ | ✔ | — |
| P_GESTION (direccionar, redireccionar, respuesta del área, responder, reenviar, plantillas) | ✔ | — | — |
| P_CORREO (módulo Correo y EPS) | ✔ | — | — |
| P_ADMIN (usuarios, áreas, configuración, formulario) | ✔ | — | — |

La columna "GESTIONA CORREO" de `Usuarios` existe por compatibilidad, pero desde v7.3 no da permisos.

### Tabla `RUTAS` (48 funciones expuestas)

| Nombre llamado desde el navegador | Función | Permiso | Validación |
|---|---|---|---|
| `appBootstrap` | `appBootstrap_` | Todos (P_LEER) | — |
| `apiResumenHoy` | `apiResumenHoy_` | Todos (P_LEER) | — |
| `apiResumenMensual` | `apiResumenMensual_` | Todos (P_LEER) | — |
| `apiBandeja` | `apiBandeja_` | Todos (P_LEER) | — |
| `apiDetalle` | `apiDetalle_` | Todos (P_LEER) | codigo |
| `apiDashboard` | `apiDashboard_` | Todos (P_LEER) | — |
| `apiNovedades` | `apiNovedades_` | Todos (P_LEER) | — |
| `apiPlantillas` | `apiPlantillas_` | Todos (P_LEER) | — |
| `apiResponsables` | `apiResponsables_` | Todos (P_LEER) | — |
| `apiCambiarMiClave` | `apiCambiarMiClave_` | Todos (P_LEER) | — |
| `apiSugerirTipo` | `apiSugerirTipo_` | Todos (P_LEER) | — |
| `apiRadicar` | `apiRadicar_` | Técnico + Admin (P_RADICAR) | sede |
| `apiActualizarDatos` | `apiActualizarDatos_` | Técnico + Admin (P_RADICAR) | codigo |
| `apiEnviarAlArea` | `apiEnviarAlArea_` | Admin (P_GESTION) | codigo |
| `apiRedireccionar` | `apiRedireccionar_` | Admin (P_GESTION) | codigo |
| `apiRegistrarRespuestaArea` | `apiRegistrarRespuestaArea_` | Admin (P_GESTION) | codigo |
| `apiResponderUsuario` | `apiResponderUsuario_` | Admin (P_GESTION) | codigo |
| `apiReenviar` | `apiReenviar_` | Admin (P_GESTION) | codigo |
| `apiGuardarPlantilla` | `apiGuardarPlantilla_` | Admin (P_GESTION) | — |
| `apiReclasificar` | `apiReclasificar_` | Técnico + Admin (P_RADICAR) | codigo |
| `apiCorreos` | `apiCorreos_` | Admin (P_CORREO) | — |
| `apiHilo` | `apiHilo_` | Admin (P_CORREO) | — |
| `apiAdjunto` | `apiAdjunto_` | Admin (P_CORREO) | — |
| `apiGuardarAdjuntoDrive` | `apiGuardarAdjuntoDrive_` | Admin (P_CORREO) | — |
| `apiSolicitarDatos` | `apiSolicitarDatos_` | Admin (P_CORREO) | — |
| `apiDireccionarHilo` | `apiDireccionarHilo_` | Admin (P_CORREO) | — |
| `apiResponderHilo` | `apiResponderHilo_` | Admin (P_CORREO) | — |
| `apiEscribirArea` | `apiEscribirArea_` | Admin (P_CORREO) | — |
| `apiCerrarHilo` | `apiCerrarHilo_` | Admin (P_CORREO) | — |
| `apiRadicarCorreo` | `apiRadicarCorreo_` | Admin (P_CORREO) | — |
| `apiDescartarCorreo` | `apiDescartarCorreo_` | Admin (P_CORREO) | — |
| `apiRegistrarRespuestaDesdeCorreo` | `apiRegistrarRespuestaDesdeCorreo_` | Admin (P_CORREO) | — |
| `apiMarcarCorreoAtendido` | `apiMarcarCorreoAtendido_` | Admin (P_CORREO) | — |
| `apiProcesarCorreoAhora` | `apiProcesarCorreoAhora_` | Admin (P_CORREO) | — |
| `apiGuardarResponsable` | `apiGuardarResponsable_` | Admin (P_ADMIN) | — |
| `apiEliminarResponsable` | `apiEliminarResponsable_` | Admin (P_ADMIN) | — |
| `apiLeerFormulario` | `apiLeerFormulario_` | Admin (P_ADMIN) | — |
| `apiGuardarMapeo` | `apiGuardarMapeo_` | Admin (P_ADMIN) | — |
| `apiImportarRespuestasForm` | `apiImportarRespuestasForm_` | Admin (P_ADMIN) | — |
| `apiEstadoFormulario` | `apiEstadoFormulario_` | Admin (P_ADMIN) | — |
| `apiUsuarios` | `apiUsuarios_` | Admin (P_ADMIN) | — |
| `apiGuardarUsuario` | `apiGuardarUsuario_` | Admin (P_ADMIN) | — |
| `apiRestablecerClave` | `apiRestablecerClave_` | Admin (P_ADMIN) | — |
| `apiAjustes` | `apiAjustes_` | Admin (P_ADMIN) | — |
| `apiGuardarAjustes` | `apiGuardarAjustes_` | Admin (P_ADMIN) | — |
| `apiGuardarEntidad` | `apiGuardarEntidad_` | Admin (P_ADMIN) | — |
| `apiGuardarCategoria` | `apiGuardarCategoria_` | Admin (P_ADMIN) | — |
| `apiProbarAvisoExterno` | `apiProbarAvisoExterno_` | Admin (P_ADMIN) | — |

## 4. Hojas del libro

Hay una plantilla sin datos personales en `plantilla_libro/PQRS_BaseDatos_plantilla.xlsx` (incluye fórmulas, validaciones y formatos).

| Hoja | Estructura | La crea |
|---|---|---|
| `Consolidado_PQRS` | Fila 3: grupos. Fila 4: encabezados. Datos desde la fila 5 (`CFG.FILA_DATOS`) hasta `CFG.FILA_FIN` = 404. 53 columnas (mapa `C`) | Plantilla |
| `Trazabilidad` | Encabezados en la fila 4: FECHA Y HORA, RADICADO, ACCIÓN, DETALLE, USUARIO. `_traza()` agrega filas; `apiNovedades_` la lee para los avisos | Plantilla |
| `Responsables` | Fila 4: ID, ÁREA / SERVICIO, NOMBRE, CARGO, CORREO, TELÉFONO, ACTIVO | Plantilla |
| `Config` | Términos A6:D8 (ENTIDAD, DÍAS, TIPO DE DÍA, NORMA). Festivos F6:G39. Parámetros B11:B18 (ver abajo). Listas: encabezados en la fila 43 y valores debajo (SEDE, SERVICIO, EPS / PRESTADOR, CANAL, TIPO DE PQRS, TIPO SOLICITANTE, TIPO DOCUMENTO, ENTIDAD PRESENTADA, ESTADO, SEXO, RÉGIMEN, POBLACIÓN DIFERENCIAL, MODALIDAD DE ATENCIÓN, TIPOLOGÍA) | Plantilla |
| `Mapeo_Formulario` | Pregunta del formulario → campo del sistema | Plantilla |
| `Plantillas` | CÓDIGO, TIPOLOGÍA, TEXTO DE RESPUESTA | `_hojaPlantillas_` si falta |
| `Usuarios` | USUARIO, NOMBRE, CORREO, ROL, SEDES ASIGNADAS, GESTIONA CORREO, AVISOS POR CORREO, ACTIVO, CLAVE (HASH), SAL, CREADO, ÚLTIMO INGRESO, DEBE CAMBIAR CLAVE | `_hojaUsuarios_` |
| `Entidades_Correo` | TIPO, ENTIDAD, DOMINIOS O CORREOS (;), ENTIDAD PRESENTADA, PRIORIDAD, AVISAR A, ACTIVA. Base en `ENTIDADES_BASE` | `_hojaEntidades_` |
| `Categorias_Correo` | CATEGORÍA, PALABRAS CLAVE (;), PRIORIDAD, DÍAS DE TÉRMINO, TIPO DE DÍA, META INTERNA (h), TIPO DE PQRS. Base en `CATEGORIAS_BASE` | `_hojaCategorias_` |
| `Gestion_Correo` | ID HILO, CATEGORÍA, ESTADO, CORREO USUARIO, ASUNTO, ÁREA, CORREO ÁREA, RADICADO, ÚLTIMA ACCIÓN, FECHA, REGISTRADO POR | `_hojaHilos_` |

**Parámetros de Config** (`_param(i)` = B(11+i)):

| i | Celda | Parámetro |
|---|---|---|
| 0 | B11 | Base del consecutivo histórico (3174) |
| 1 | B12 | Umbral de alerta amarilla (días) |
| 2 | B13 | Prefijo del radicado (SIAU) |
| 3 | B14 | Correo SIAU (responder a) |
| 4 | B15 | Teléfono |
| 5 | B16 | WhatsApp |
| 6 | B17 | ID del formulario vinculado |
| 7 | B18 | Hoja de respuestas del formulario |

**Columnas calculadas con fórmula** (escritas por `_escribirFormulas_` y `_formulasFila_`):

| Columna | Campo | Cálculo |
|---|---|---|
| AF (32) | TÉRMINO | Primero la categoría de `Categorias_Correo` según CLASIFICACIÓN INTERNA ($AB); si no, la entidad presentada contra Config A6:D8; "N/A" para felicitación |
| AG (33) | TIPO DE DÍA | Igual que el término |
| AH (34) | FECHA MÁXIMA | `WORKDAY` con los festivos o suma de días calendario |
| AI (35) | SEMÁFORO | Estado frente a la fecha máxima |
| AJ (36) | DÍAS TRANSCURRIDOS | `INT()` |
| AT (46) | OPORTUNIDAD | Si se respondió a tiempo |

**Propiedades del script** (`PropertiesService`): `AJUSTES` (JSON de la automatización: autoInstitucional, autoUsuarios, acuseInstitucional, citasAuto, webhookChat, chatModo, avisarA, avisosSede, desde, alias), `ESQUEMA` (versión de migración, actual "7"), `SEPARADOR_FORMULAS`, `ALERTAS_META`, `CORREOS_ATENDIDOS`. **No se copian** al duplicar la hoja.

**Etiquetas de Gmail:** `PQRS-Auto`, `PQRS-Radicado`, `PQRS-No aplica`.

## 5. Automatización del correo (`_procesarCorreo_`)

1. Busca `in:inbox newer_than:3d` sin etiquetas del sistema, máximo 40 hilos. Omite los hilos ya gestionados a mano (`Gestion_Correo`), los hilos con un área, lo anterior a la activación (`AJUSTES.desde`) y los correos de colegas del mismo dominio.
2. **Remitente institucional** (`_entidadDe_` por dirección exacta, dominio o subdominio):
   - Con categoría (`_categoriaCorreo_`: el asunto pesa más que el cuerpo) → `apiRadicarCorreo_` con adjuntos, acuse en el mismo hilo (`_acuseInstitucional_`) y aviso interno (`_avisoNuevoCaso_`).
   - Sin categoría → acuse, estado "Por clasificar" en Correo ▸ EPS y entes, y aviso sin contenido.
3. **Usuario ciudadano:**
   - Si es cita, se direcciona al área de citas solo si `citasAuto` está activo.
   - Si es una PQRS clara (`RE_PQRS_FUERTE`), se extraen los datos del texto (`_extraerDatos_`), se clasifica el tipo, se radica y se marca `[Datos incompletos: …]` si falta algo.
   - Si no, queda para revisión manual.
4. Prioridad: `_prioridadDe_` (categoría, luego entidad). Los avisos respetan `chatModo` ("todas" o "prioritarias").

## 6. Clasificador del tipo (`_clasificarTipo_`)

- Léxico con pesos por tipo (`LEXICO_TIPOS`). Las negaciones ("no fue excelente") cuentan para Queja.
- Una felicitación con señales fuertes de queja pierde puntos. Se descartan fórmulas de cortesía como "agradecemos su gestión". Lo que marcó el usuario suma +1.
- Confianza **alta**: diferencia ≥ 2 y puntaje ≥ 3. En QR y correo reclasifica sola y deja constancia en OBSERVACIONES y en Trazabilidad.
- Confianza **media**: deja `[Tipo sugerido: X]` para que el técnico decida. En la radicación manual la interfaz sugiere mientras se escribe (`apiSugerirTipo`).

## 7. Notificaciones (`_correoDiseno_`)

| Variante | Destino | Contenido |
|---|---|---|
| `usuario` | Ciudadano | Acuse, en trámite, respuesta. Barra de avance, fechas clave, detalles y aviso de privacidad |
| `felicitacion` | Ciudadano | Estrella, "Sus palabras" como cita, sin vencimiento |
| `interno` | Área o técnicos | Franja "Uso interno · Confidencial", fechas (con "Vence" en rojo), detalles y advertencia legal. A las áreas les llegan la descripción y los datos de contacto; a los técnicos y a Chat **no** |
| `reconocimiento` | Área | Felicitación: "Un usuario reconoce la labor de su equipo", sin exigir gestión |

Mecánica común: los hilos de Gmail usan `reply`/`forward` con `_opcionesCorreo_`; los mensajes nuevos usan `_enviar`. El logo va incrustado con `cid:logoNiRed` (`LOGO_BASE64`). `_urlPlataforma_(codigo)` da el enlace /exec con `?pqrs=CODIGO`, que el frontend abre después del ingreso (`abrirEnlaceDirecto`).

## 8. Frontend (`frontend/` → `Index.html`)

- **Vistas** (`<section id="v-…">`): inicio, bandeja, detalle, correo, radicar, tablero, responsables, usuarios, config. `ver(nombre)` cambia de vista y carga los datos. La navegación usa `data-perm` (radicar, gestion, correo, admin) según `APP.sesion.puede`.
- **Estado global** `APP` (se restablece al cerrar sesión desde `APP_INICIAL`).
- **Llamadas:** `srv` / `srvSilencioso` → `llamar()`. Si no hay token no llama; descarta respuestas de otra sesión; `__sesion:false` lleva a `sesionTerminada`.
- **Segundo plano:** `sondear()` cada 60 s (`CICLO`) → `apiNovedades` (radicaciones y respuestas de áreas desde Trazabilidad; correo cada 3 ciclos). Genera `notificar()`: aviso emergente, centro de notificaciones, sonido WebAudio según prioridad (`sonar`) y notificación de escritorio sin datos (`escritorio`).
- **Diseño:** barra lateral fija de 256 px (en móvil, menú deslizable y barra inferior), barra superior fija, tarjetas y tablas con `.scroll-x`. Los bloques largos se pliegan con `plegarBloques` y en el detalle el panel derecho acompaña la lectura (`.det-lado.fijo`).
- **Detalle para un técnico:** panel "Seguimiento de la gestión" con 4 pasos, sin acciones de gestión.
- **Usuarios:** tarjeta con el enlace /exec (aviso si es /dev), botón para copiar, WhatsApp e **Invitar** (copia un mensaje con enlace, usuario y sedes).

## 9. Pruebas

- `tests/harness.js` carga `Codigo.gs` en un `vm` de Node con hojas simuladas (`Hoja`), Gmail, Drive, Cache, Properties, Lock y UrlFetch.
  - Simula el separador regional: con `LOCALE_PC=1`, una fórmula con «,» da `#ERROR!`, como en una cuenta de Colombia.
  - **No evalúa fórmulas**, así que término, fecha máxima y semáforo quedan vacíos en las pruebas y en la vista previa, salvo que la prueba los ponga.
- `tests/pruebas_backend.js` cubre: radicación y consecutivo, fechas sin hora, fórmulas y su reparación, gestión completa, correo (hilos, citas, reenvíos, adjuntos), usuarios, sedes, bloqueo, permisos del puente, clasificador, automatización del correo, alertas de 8 h, notificaciones confidenciales, párrafos, felicitaciones y diagnóstico de permisos.
- `tests/mock_browser.js` ejecuta el mismo `Codigo.gs` en el navegador. Datos ficticios; usuarios demo siau.admin, tecnico.playa y consulta, con clave Demo2026.


## 10. Versión 8

### 10.1 Consolidado
- Datos desde la fila 5 **sin tope**. `_finDatos_()` = última fila con CÓDIGO o FECHA DE RADICACIÓN (se recuerda mientras no cambie `getLastRow`). `CFG.FILA_FIN` es una propiedad calculada. `_proximaFila()` agrega siempre al final y `_asegurarFilas_` crea filas y fórmulas con un colchón de 200 (`CFG.COLCHON_FORMULAS`).
- `_datos_()` lee todas las filas (57 columnas); `_codigos_()` guarda la columna A en memoria para `_filaDe` y el consecutivo. `_escribir()` escribe por tramos sin tocar las columnas con fórmula.
- Columnas nuevas: BB (54) NIVEL DE RIESGO, BC (55) POBLACIÓN PRIORIZADA, BD (56) AUTORIZACIÓN TRATAMIENTO DE DATOS, BE (57) ÁREA SUGERIDA.
- Fórmulas: FECHA MÁXIMA usa `Festivos!$A$2:$A$400`. La hoja **Festivos** se calcula sola (`_festivosColombia_`, Ley 51 de 1983) y se completa en `rutinaDiaria`.
- Config: fila 9 = término EPS (72 h). Parámetros nuevos B19 (sin uso desde 8.1), B20 fecha de corte del formulario, B21 política de datos, B22 enlace del QR.
- Migración `ESQUEMA` "8": `_estructuraV8_` agrega encabezados, parámetros, término EPS, festivos, categorías y entidades nuevas (`_completarTabla_`) y columnas del directorio (`_directorioV8_`). Es idempotente.

### 10.2 Radicado (v8.1: una sola estructura)
`SIAU-AAAA-MM-NNNN` para todos los tipos (felicitaciones incluidas) y canales, con un consecutivo único: `_siguienteConsecutivo()` toma el mayor número del consolidado y de la trazabilidad (mínimo Config B11). AAAA-MM = mes de radicación; desde 10000 sigue con 5 cifras. En la migración del histórico, lo que no tenía radicado recibió SIAU 3515–16379 en orden cronológico (siguiente: 16380). `_unificarRadicados_` (ESQUEMA 8.1) convierte en el consolidado cualquier código de otro prefijo (FEL/QR/HIS de la primera entrega) y deja el anterior en OBSERVACIONES y en la trazabilidad.

### 10.2.1 Acceso al consolidado
`_ss_()` abre la hoja vinculada (o la guardada en `CONSOLIDADO_ID`). Si Google responde «No cuentas con el permiso necesario…» (el código corre con una cuenta sin acceso, típicamente la cuenta personal predeterminada del navegador), `_explicarError_` muestra la cuenta y los pasos. `verificarCuenta()` se ejecuta desde el editor para comprobar la cuenta antes de implementar.

### 10.3 Priorización
- `_evaluarRiesgo_(fila)` → `{ nivel, categoria, razones, poblacion, horas }` con `SENALES_VITAL`, `POBLACIONES` y `RE_BARRERA`.
- Reglas: señales ≥ 3 (o categoría vital del correo) → **Vital** (NNA → **Vital NNA**); población de especial protección + barrera o señales ≥ 2 → **Priorizado**.
- `_postRadicacion_` (radicación presencial, formulario y correo): clasificador del tipo → riesgo (aplica la categoría si sube de nivel) → alerta `_alertaPrioritaria_` (Chat, correo, traza «Alerta de riesgo») → área sugerida (col. 57).
- Comando: menú **PQRS ▸ Identificar PQRS prioritarias** o botón en la vista Prioritarias (`apiIdentificarPrioritarias_`). Ajuste manual: `apiFijarRiesgo_` (marca `[Riesgo manual: …]`, que el motor respeta).
- `apiPrioritarias_` lista las abiertas con límite en horas (desde MARCA TEMPORAL) y cuenta regresiva.
- `revisarAlertas` (cada 30 min): categorías con meta; alcance «Direccionar» = alerta si no se ha enviado al área; «Responder» (vital NNA) = alerta a la mitad y al cumplirse si no se ha cerrado.

### 10.4 Directorio y direccionamiento
- Responsables H:K = SERVICIOS QUE ATIENDE, SEDES, PALABRAS CLAVE, CORREOS EN COPIA (`;`). `_sugerirArea_`: servicio +6, palabra +2 (máx. 3), sede +1; descarta áreas de otras sedes.
- `_direccionAutomatica_`: felicitaciones «inmediato»; PQRS con `direccionAuto` y área inequívoca (`_areaClara_`), nunca tutelas, peticiones ni requerimientos.
- `apiDireccionarFelicitaciones_`: un correo de reconocimientos por área y cierre de cada felicitación (rutina diaria si `direccionFelicitaciones = "resumen"`).

### 10.5 Notificaciones
| Paso | Usuario | Área |
|---|---|---|
| 1 Recepción | Acuse con tipo, clasificación, término (horas si es prioritaria) y aviso de datos | — |
| 2 Direccionamiento | «Su solicitud está en trámite» | Solicitud interna (con prefijo de riesgo en el asunto y copias del directorio) |
| 3 Respuesta | Respuesta formal (botón Redactar: `apiRedactarRespuesta_`) y cierre | — |
| 4 Cierre | — | «Se respondió al usuario y el caso quedó cerrado» (`_avisoCierreArea_`) |
| Felicitación | Solo acuse (con la mascota) | Reconocimiento (inmediato o resumen diario) |

### 10.6 Entes de control
`Entidades_Correo` H = CATEGORÍA POR DEFECTO. Procuraduría, Personería, Defensoría, Contralorías, MinSalud, ICBF → REQUERIMIENTO ENTE DE CONTROL (10 días hábiles); juzgados (`@cendoj.ramajudicial.gov.co`) → TUTELA. Cada correo de un ente deja la traza «Correo de ente de control», que la plataforma convierte en alarma.

### 10.7 Nuevas rutas de la API
| Nombre | Permiso |
|---|---|
| `apiPrioritarias`, `apiEvaluarRiesgo` | P_LEER |
| `apiSugerirArea` | P_LEER + sede |
| `apiIdentificarPrioritarias` | P_RADICAR |
| `apiFijarRiesgo` | P_RADICAR + sede |
| `apiRedactarRespuesta` | P_GESTION + sede |
| `apiDireccionarFelicitaciones` | P_GESTION |
| `apiFormularioQR`, `apiCrearFormulario`, `apiDiagnostico` | P_ADMIN |

### 10.8 Portal
`doPost(e)` recibe `{ fn, args }` y despacha solo `PUERTA_PORTAL` (estadoAcceso, iniciarSesion, cerrarSesion, crearPrimerAdministrador, api). El frontend, si no está dentro de Apps Script, crea un `google.script.run` con `fetch` (POST text/plain, sin preflight). `tools/construir_portal.mjs` → `portal/index.html` + `portal/config.js`; `.github/workflows/portal.yml` lo publica en GitHub Pages.

### 10.9 Migración del histórico
`tools/migrar_historico.py` usa el propio `Codigo.gs` (vía `tests/harness.js`) para las fórmulas, festivos, categorías, entidades y directorio, de modo que el libro migrado es idéntico a lo que escribiría la plataforma. Deduplica el formulario contra el histórico (documento, descripción, teléfono; felicitaciones por documento y fecha ±1 día). Fechas con errores de digitación (0206, 16/062026, 2027) se corrigen o se estiman por el mes y se marcan en OBSERVACIONES.

## 11. Versión 8.2: radicación rápida, Excel y respaldo

- **Radicado seguro y rápido.** `_reservarRadicado_` toma el candado del documento (no el del script, que mantiene el proceso del correo), reserva fila y consecutivo y escribe; así dos técnicos que radican a la vez nunca repiten número. `_finDatos_` lee solo el último bloque de 400 filas; `_siguienteConsecutivo` usa la propiedad `ULTIMO_CONSECUTIVO` más el final de ambas hojas (primera vez: recorrido completo).
- **Avisos en segundo plano.** `apiRadicar` con `diferir: true` (la interfaz lo envía) devuelve el radicado y deja el código en la cola `COLA_AVISOS`. La interfaz llama enseguida a `apiNotificarRadicacion` (acuse, aviso interno/Chat, direccionamiento automático); si el navegador se cierra, `procesarCorreoEntrante` (cada 5 min) la vacía pasado 1 minuto. `_sacarDeCola_` garantiza que los avisos no se envíen dos veces.
- **Excel.** `apiExportarExcel` (solo administrador) arma un libro temporal con los valores del consolidado (nunca la hoja Usuarios), lo convierte con la exportación de Google (`/export?format=xlsx` + token OAuth), lo guarda en la carpeta «PQRS · Respaldos (Excel)» y, si pesa ≤ 6 MB, lo entrega para descargar. Filtros: año, mes, sede, servicio; respeta `_filaVisible_`.
- **Respaldo.** `rutinaDiaria` (7:00) llama a `_respaldoExcel_`: un archivo `Respaldo_diario_AAAA-MM-DD.xlsx` por día, retención de 14 días solo para esos archivos y, si `respaldoCorreo` está definido, la carpeta se comparte en solo lectura con esa cuenta. Los fallos quedan en Trazabilidad («Respaldo en Drive falló») y no detienen la rutina.
- Pruebas: sección «v8.2» de `tests/pruebas_v8.js`; la vista previa y el recorrido e2e cubren el radicado en dos pasos, el botón del Tablero y «Respaldar ahora».

## 12. Versión 8.3: EPS y entes, push, correos e ingreso

- **A EPS y entes no se les escribe solos.** Se eliminó `_acuseInstitucional_`. `_esInstitucional_(f)` (marca «Remitente institucional:» en OBSERVACIONES) bloquea el acuse de radicación (`_acuseRecepcion_`) y el aviso «en trámite» al enviar al área. La respuesta a la entidad solo sale cuando el administrador la envía desde «Responder al usuario».
- **Revisión cada 3 minutos.** Apps Script solo permite disparadores de 1, 5, 10, 15 o 30 min: el disparador corre cada minuto y `procesarCorreoEntrante(e)` se salta las corridas con evento de disparador (`e.triggerUid`) que llegan antes de `INTERVALO_CORREO_MS` (170 s). Las llamadas manuales (sin evento) siempre corren. Hay que volver a ejecutar «Instalar disparadores» para pasar de 5 min a 1 min.
- **Push (ntfy).** `_avisoPush_` publica en ntfy (JSON) con el tema `pushTema` y el servidor `pushServidor`; `_avisoChat_(texto, prio)` envía a Chat y, si recibe prioridad 1-5, también push. Llegan: todo correo de EPS o ente (3), prioridad Alta (4) y Crítica (5), alertas de riesgo y de meta, y correos por clasificar. Mismas reglas de confidencialidad que Chat: solo radicado, tipo, prioridad, sede y fechas. GitHub no envía push; ntfy (app móvil o web) sí.
- **Análisis detallado.** `_analisisCorreo_` resume categoría, norma, término legal (con fecha: `_sumarHabiles_` descuenta fines de semana y la hoja Festivos), meta interna, plazos y referencias que cita el texto, riesgo y población, datos del usuario, adjuntos, áreas sugeridas y acciones. Se entrega en `apiHilo_` y `apiDetalle_` (solo con sesión) y se pinta con `htmlAnalisis` (frontend 3bz).
- **Mismo hilo.** `_enviarAreaCaso_`: si el radicado vino de un correo (`ID_CORREO`), la notificación al área se reenvía dentro del hilo original (mismo asunto, con los adjuntos); si no, sale como correo nuevo.
- **Correos.** `_correoDiseno_` rehecho: cabecera con los logos blancos de MiRed y SIAU sobre el teal, franja roja/amarilla/verde, banda de prioridad (roja para crítica), tarjeta de plazo, fechas en una columna en celular (`@media max-width:540px`), botón a todo el ancho y mensaje de gratitud con la medalla. Imágenes en `tools/imagenes_siau.py` (`LOGO_SIAU_B_BASE64`, `LOGO_SIAU_BASE64`, `LOGO_MIRED_B_BASE64`, `LOGO_SIAU_MEDALLA_BASE64`). `tests/render_correos.js` captura cada muestra en 680 y 375 px.
- **Interfaz.** Logos nuevos del SIAU (`assets/siau`, `frontend/vendor/imagenes_siau.js`), ingreso proporcionado (una pantalla en escritorio; formulario primero en celular), afiche del QR rediseñado (`htmlAficheQR`).

## 13. Versión 8.4: seguridad

Política completa en `docs/SEGURIDAD.md`. En el código:

- `_claveValida_(c, usuario)` + `_msgClave_`: 10 caracteres, mayúscula, minúscula, número; sin el usuario ni `CLAVES_COMUNES`.
- `_iniciarSesion_`: formato de usuario validado, mismo mensaje y mismo costo para usuario inexistente o contraseña incorrecta, bloqueo de 15 min tras `MAX_INTENTOS`, todo auditado. `_sesion_`: tope absoluto `SESION_MAX_MS` (12 h) además de los 6 h de inactividad. `api()`: con `debeCambiar` solo pasan `appBootstrap` y `apiCambiarMiClave` (el frontend lo atiende en `llamar()` con `__cambiarClave`).
- `_auditar_` / `apiAuditoria_` (hoja oculta `Auditoria`, vista en *Usuarios y sedes*). Eventos: ingresos, fallos, bloqueos, cierres, acciones denegadas, contraseñas, usuarios, exportaciones.
- `_seguroCelda_`: antepone `'` a los textos que empiezan por `= + - @` (inyección de fórmulas) en `_escribir`, `_traza`, `_guardarHilo_`, respuestas del área y del usuario, observaciones y exportaciones a Excel.
- `_chequeosSeguridad_` (dentro del diagnóstico): acceso general y editores del consolidado, carpeta de respaldos, administradores, contraseñas temporales, usuarios sin uso, tema del push.
- Portal: `tools/construir_portal.mjs` agrega CSP (`connect-src` solo a `script.google.com` y `script.googleusercontent.com`) y `referrer: no-referrer`. `doPost` rechaza cuerpos de más de 30 MB.

