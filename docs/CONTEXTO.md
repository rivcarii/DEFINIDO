# Contexto del proyecto

## 1. Institución y propósito

**MiRed Barranquilla IPS S.A.S.** es una IPS (prestador de servicios de salud) de Barranquilla, Colombia, con varias sedes. La **Oficina de Atención al Usuario (SIAU)** recibe las PQRS, que son un requisito del Sistema Obligatorio de Garantía de Calidad (SOGCS) y de la Supersalud: hay que radicarlas, responderlas dentro del término legal y medir la oportunidad.

Antes del sistema, las PQRS llegaban por tres vías desconectadas: formulario QR (Google Forms), correo institucional y atención presencial. Se tabulaban a mano en Excel, sin código de trazabilidad, sin control de términos y sin avisos.

**Objetivo:** un sistema integral que unifique las vías de ingreso en un solo lugar, codifique automáticamente cada caso, controle los términos legales con semáforo, notifique (recepción, trámite, cierre) y permita consultar todo a tiempo, desde un consolidado en el Drive de la cuenta SIAU.

## 2. Requisitos del usuario (en orden cronológico, parafraseados)

### v1 a v3: consolidado integrado en Excel/Sheets + Apps Script
- Unificar QR, correo y manual. Código automático por canal para trazabilidad.
- Términos legales según normativa, con semáforo verde, amarillo y rojo.
- Notificaciones de recepción, gestión y cierre.

### v4: plataforma web
- Gestionar todo desde la plataforma: radicar, analizar, direccionar al área, redireccionar si se envió mal, registrar la respuesta del área, responder al usuario y consultar el tablero.
- Vincular el Google Form **existente** mediante un mapeo de preguntas a campos (hoja `Mapeo_Formulario`).

### v5
- Inicio más completo y Tablero con información por meses.
- Responsables en un diseño compacto.
- **Días sin decimales**, tanto en la plataforma como en los correos. La causa era la zona horaria; se resolvió con `_soloFecha_` e `INT()`.
- Estética minimalista y profesional, con la paleta del logo por tipo de PQRS.
- Tarjetas de indicadores por mes y año; al tocarlas se abre un detalle por sede con la que más PQRS tuvo.
- Avisos emergentes en segundo plano y animaciones de carga.
- En el correo, distinguir las notificaciones que envía la propia plataforma (irrelevantes) de los correos reales.
- Tipografía VW Serial en los correos.

### v6
- Muchos correos son **solicitudes de citas**: deben poder direccionarse al área de citas.
- Consolidar los datos del usuario al radicar desde el correo.
- **En el mismo hilo de correo:** pedir datos o documentos al usuario, reenviar al área y que usuario, área y SIAU conversen, además de ver y enviar documentos.
- Corregir los `#ERROR!` del consolidado. La causa era el separador de fórmulas «,» contra «;» por la configuración regional, más un desplazamiento de 13 filas; se resolvió con `_escribirFormulas_` adaptable y `_saludFormulas_`.

### Preguntas resueltas entre versiones
- **Cambiar el nombre del enlace:** no es posible en Apps Script. Las alternativas son Google Sites, un dominio propio o un acortador. Para publicar cambios siempre se usa "Nueva versión" en la misma implementación.
- **Compartir con otros:** la diferencia entre /dev y /exec, "Ejecutar como" y "Quién tiene acceso". La hoja y el proyecto nunca se hacen públicos.

### v7 (documento `requisitos/Automatizacion_Canal_Correo_Electronico.docx`)
- El documento proponía hacerlo en n8n; **se implementó dentro de Apps Script** para no depender de otra herramienta.
- Identificar al remitente por **dominio**: entes de control (Secretaría de Salud Distrital, Supersalud, Contraloría) y EPS (Nueva EPS, Famisanar, Sura, Mutual Ser y su BPO Affinity `@affinitybpo.com.co`, Salud Total, EPS Familiar y su buzón `documental@miredips.org`, Proteger, Sanitas, Coosalud).
- Clasificar el asunto en **5 categorías**: Supersalud Riesgo Simple, Priorizado y Vital, Tutela y Derecho de Petición. Asignar prioridad y término.
- **Acuse de recibo automático** en el mismo hilo, aviso interno por EPS o entidad, y **radicación automática con adjuntos**, salvo cuando no hay certeza (queda "Por clasificar").
- Alerta si una Tutela o un Derecho de Petición lleva **8 horas** sin direccionar.
- Solicitudes de EPS identificadas y priorizadas.
- **Cada técnico con usuario y contraseña**. Los administradores crean, activan e inactivan usuarios. Cada uno ve y tabula **solo sus sedes asignadas**. Todo va al consolidado del Drive de siau@miredips.org.
- Tabular PQRS de cualquier medio igual que las manuales; pedir datos adicionales solo si faltan.
- Las notificaciones deben incluir **fecha de recepción, fecha de los hechos y fecha de vencimiento**.
- **Clasificador del tipo** según el texto, para todos los canales. Por ejemplo, una "felicitación" que en realidad es una queja.
- Diseño de aplicación o plataforma de gestión más profesional, con la distribución de PQRS por sede de cada colaborador.
- Notificaciones dentro y fuera de la plataforma, **con sonido de alerta**.
- "No es hacerlo desde cero": reescribir, modificar e integrar.

### v7.1
- La barra lateral no quedaba fija y había desbordes.
- Al cerrar sesión no aparecía el ingreso, y la plataforma "seguía usando el correo" de la cuenta de Google.
- Las notificaciones deben mantener **confidencialidad**.
- Rediseñar las notificaciones y las **felicitaciones**.
- Corregir la falta de espacios entre párrafos en los correos.

### v7.2 y v7.3 (acceso de los técnicos)
- Los técnicos veían "Necesitas acceso (Lector / Editor)": estaban usando el enlace del editor o el /dev.
- Luego apareció "No cuentas con el permiso necesario para acceder al documento solicitado": la implementación estaba en "Ejecutar como: usuario que accede". Ahora la plataforma lo explica en la pantalla de ingreso.
- River **copió los archivos al Drive de la cuenta SIAU** para que la plataforma sea del SIAU y todos ingresen con usuario y contraseña, **sin cuenta de Google** (algunos técnicos usan @gmail.com).
- **La plataforma funciona como puente:** los SIAU de sede **solo radican o tabulan y consultan** sus sedes. El envío a las áreas y la respuesta al usuario **los hacen los administradores**.

### v8 (rediseño: «que funcione y no tenga trabas con los accesos»)
- Ecosistema único: formulario QR existente o nuevo, correo institucional siau@miredips.org, radicación en las **40 sedes** (presencial, papel, teléfono, buzón, redes) y un solo histórico.
- Los técnicos de las 40 sedes deben poder tabular **el mismo día** sin depender de la correspondencia en papel ni de permisos sobre la hoja.
- Comando para identificar las PQRS **prioritarias e inmediatas** según la circular nueva (Circular Supersalud 2026151000000007-5: riesgo vital en NNA en 8 horas) y la de 2023 (vital 24 h, priorizado 48 h, simple 72 h).
- **Directorio** para direccionar al área correspondiente, automático o manual, desde cualquier vía de ingreso.
- Notificaciones en 4 pasos, con contenido distinto para el usuario y para el área: acuse (qué se radicó y su clasificación) ▸ en trámite / solicitud interna ▸ respuesta mejor redactada a partir de la del área ▸ cierre (también al área).
- **Felicitaciones**: solo acuse de agradecimiento y entrega al área; sin trazabilidad de respuesta. En la plataforma con sonido y animación propios.
- Notificar los correos de **entes de control**; alarma y sonido para lo urgente.
- Normas de protección de datos (Ley 1581 de 2012, Decreto 1377 de 2013) en las notificaciones.
- **QR** para los usuarios.
- Transcribir todo 2026 al consolidado nuevo **hasta el último radicado** del «Histórico consolidado de opiniones del usuario 2026» (SIAU-2026-09-3514).
- Apariencia de plataforma de sistema de gestión integrado (solo PQRS). Logo MiRed IPS y mascota del SIAU.

**Resultado de la migración (24/09/2026):** 13.200 registros: 335 PQRS con radicado SIAU (3179–3514, falta el 3422 en el histórico), 12.745 felicitaciones (9.214 del histórico + 3.531 del formulario QR que no estaban tabuladas) en serie FEL, 119 quejas/reclamos/sugerencias del QR gestionadas en la hoja del formulario sin radicado (serie QR) y 1 del histórico sin radicado (serie HIS). 109 respuestas del QR ya estaban en el histórico y se omitieron.

## 3. Decisiones de diseño (y por qué)

| Decisión | Razón |
|---|---|
| Google Sheets + Apps Script, sin servidor propio | La institución ya usa Google Workspace. Costo cero y el consolidado queda en su Drive |
| Autenticación propia (hoja `Usuarios`, SHA-256 con sal ×150, sesiones en CacheService de 6 h, bloqueo tras 5 intentos) | Los técnicos no tienen (o no usan) cuentas del dominio. La app corre como la cuenta SIAU y los datos no se comparten con nadie |
| Acceso "Cualquier persona" a la implementación | Solo así entran cuentas @gmail o sin cuenta. Los datos quedan protegidos por el ingreso de la plataforma, y la hoja y el proyecto siguen privados |
| Una sola puerta `api()` con tabla `RUTAS` | En Apps Script toda función global es invocable. Así se centralizan sesión, rol y sede |
| Fórmulas en la hoja (término, fecha máxima, semáforo, días, oportunidad) | El consolidado debe seguir siendo útil abierto directamente en Sheets |
| Separador de fórmulas detectado en tiempo de ejecución | Las cuentas en Colombia usan «;». Escribir «,» producía `#ERROR!` |
| Términos por categoría del correo primero y luego por entidad presentada | Circular Externa Supersalud 2023151000000010-5 de 2023 (vital 24 h, priorizado 48 h, simple 72 h) y Ley 1755 de 2015 (15 días hábiles) |
| Clasificador por léxico con puntajes | Explicable ("señales: grosero, me gritó") y sin servicios externos. Con confianza alta reclasifica solo (QR y correo); con confianza media solo sugiere |
| Avisos externos por Google Chat (webhook) | Las notificaciones del navegador suelen estar bloqueadas en el iframe de Apps Script. Chat llega al celular con sonido |
| Avisos sin datos personales | Ley 1581 de 2012 y reserva de la historia clínica (Ley 23 de 1981, Res. 1995 de 1999) |
| Vista previa con el backend real en el navegador | River revisa el diseño sin desplegar. Las pruebas E2E usan el mismo archivo |
| **v8 · Evolucionar v7.3 en vez de reescribir** | La base tenía 110 pruebas, diseño aprobado y seguridad correcta. Los problemas eran el tope de 400 filas, el despliegue y faltantes funcionales |
| v8 · Fin de datos calculado (`_finDatos_`) y escritura al final | Quita el tope sin cambiar las 53 columnas históricas ni sus fórmulas |
| v8 · Serie FEL para felicitaciones | Son ~1.400 al mes y antes no se codificaban: con la serie SIAU se habría disparado la numeración institucional |
| v8 · Serie QR para lo gestionado solo en la hoja del formulario | No se inventan radicados SIAU retroactivos; quedan identificadas para revisión (hoja Migración_Revisar) |
| v8 · Fecha de corte del formulario (Config B20) | Al vincular el formulario Google copia 4.500 respuestas desde 2023: sin corte se habrían radicado todas |
| v8 · Motor de riesgo por señales, explicable | Sin servicios externos (los datos de salud no salen de la cuenta), con razones visibles y ajuste manual; calibrado con el histórico real (≈7 % de las PQRS marcadas) |
| v8 · Redactor de respuesta por reglas, no IA | La respuesta del área se limpia (firmas, mayúsculas, citas) y se envuelve en el formato institucional sin enviar datos a terceros |
| v8 · Felicitaciones en resumen diario por área | Evita cientos de correos sueltos a las áreas y cierra el caso sin seguimiento |
| v8 · Portal por `doPost` | Una dirección propia fuera del marco de Google (sonido y avisos más confiables); misma puerta de seguridad |

## 4. Personas y cuentas

- **Cuenta dueña:** la del SIAU (siau@miredips.org). River la llama "el correo de siau". La plataforma, el consolidado y los envíos de correo deben estar en esa cuenta.
- **Roles en la plataforma:** administradores (líder SIAU, Calidad), técnicos de atención al usuario por sede y usuarios de consulta.
- No guardes correos personales de técnicos en el repositorio.

## 5. Estado al entregar (v8.0)

- Código probado: 110 verificaciones de v7 + 60 de v8, cada una en las 2 configuraciones regionales; lint sin errores; E2E en 4 anchos (incluida la vista Prioritarias, el QR y el diagnóstico) y E2E del portal por doPost.
- El libro migrado se validó cargándolo en el banco de pruebas con el backend real (siguiente radicado SIAU-2026-09-3515, FEL-2026-09-12746).
- Pendiente en producción: `docs/DESPLIEGUE.md` §1–§3 (subir el consolidado migrado a la cuenta SIAU, pegar el código, implementar, disparadores, formulario y usuarios).
