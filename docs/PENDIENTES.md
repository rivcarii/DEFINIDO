# Pendientes, riesgos y próximos pasos (v8)

Antes de cerrar cualquier punto: `npm run verificar` y su prueba.

## P1 · Puesta en marcha (depende de la cuenta SIAU)

1. Subir el consolidado migrado y pegar el código (`docs/DESPLIEGUE.md` §1–§3). Validar en incógnito desde un celular.
2. **Correos de las áreas y reglas del directorio** en Áreas responsables: sin correo no se puede direccionar ni entregar felicitaciones.
3. **Revisar la hoja Migración_Revisar**: 120 casos que no tenían radicado en el histórico (recibieron SIAU 3515 en adelante). El consecutivo SIAU **3422** no existe en el histórico: confirmar si se anuló.
4. Verificar dominios supuestos de entes: `@personeriabarranquilla.gov.co`, `@contraloriabarranquilla.gov.co`, `@atlantico.gov.co`, `@icbf.gov.co` (Configuración ▸ Entidades).
5. Publicar la **política de tratamiento de datos** de MiRed IPS y pegar su enlace en Config B21 (aparece en el formulario y en los correos).
6. Si Workspace no permite «Cualquier persona»: gestionar con TI (§4 de DESPLIEGUE).

## P2 · Rendimiento con el volumen real

- Con 13.200 filas cada lectura completa del consolidado (57 columnas) toma del orden de 2–4 s en Apps Script. Inicio hace 2 lecturas. Si se vuelve lento:
  - **Archivo anual**: mover a un libro «Histórico AAAA» las felicitaciones cerradas del año anterior (~16.000/año) conservando el radicado; el tablero puede leer ambos.
  - Leer solo las columnas necesarias en Inicio/Prioritarias.
- `setFormulas` sobre 13.400 filas en la primera migración: 1–2 min (una sola vez).

- **8.2 (hecho):** el final de los datos se halla por bloques desde el final de la hoja, el consecutivo se guarda en `ULTIMO_CONSECUTIVO` (tail-scan de respaldo) y el acuse, el aviso interno y el direccionamiento automático salen después de mostrar el radicado (`diferir` → `apiNotificarRadicacion`; red de seguridad cada 5 min). La lectura completa en Inicio/Bandeja/Tablero sigue pendiente.
- Si Apps Script sigue siendo el cuello de botella con el volumen real, el siguiente paso es mover la radicación y la lectura a una base de datos (p. ej. Supabase/Firestore) y dejar Sheets como reporte; es un cambio de arquitectura, no un ajuste.

## P3 · Mejoras funcionales

- ~~Exportar a Excel y respaldo en Drive~~ → hecho en 8.2 (Tablero ▸ Exportar a Excel; respaldo diario a las 7:00). Pendiente: PDF e informes con indicadores SOGCS/Supersalud ya calculados.
- Tablero: gráfico por nivel de riesgo y tiempo de respuesta de las prioritarias en horas.
- Encuesta de satisfacción automática al cerrar.
- Recuperación de contraseña sin administrador (la auditoría de ingresos ya existe desde 8.4); inicio de sesión con Google y segundo factor (ver `docs/SEGURIDAD.md` §6).
- Redacción asistida con IA (Gemini de Google Workspace o Claude) **solo** con acuerdo de tratamiento de datos y anonimización; hoy el redactor es por reglas para no enviar datos de salud a terceros.

## P4 · Limitaciones conocidas (aceptadas)

- Sesiones máx. 6 h (CacheService). Hash SHA-256 con sal ×150.
- Cuotas de Google: correos/día (Workspace ~1.500 destinatarios), 6 min por ejecución (la importación del formulario corta a los 4 min y sigue en la siguiente), UrlFetch.
- El motor de riesgo es por palabras: puede fallar con textos ambiguos. Por eso muestra las señales, avisa al SIAU y permite ajustar.
- La vista previa y las pruebas no evalúan fórmulas (el simulador del navegador las emula).

## Pendientes v8.5

- **Separar el consolidado en dos libros (PQRS / resto de hojas):** no implementado. Es un cambio estructural (Config, Festivos, Usuarios y Categorías se leen con `_h()` del mismo libro). Propuesta: `DATOS_ID` opcional, espejos de lectura y migración con respaldo previo. Mientras tanto, solo el administrador exporta y el Excel nunca lleva la hoja `Usuarios`; el control real es no compartir el libro con técnicos (ellos entran por la plataforma).
- **Motivo específico:** la lista de Config «MOTIVO ESPECÍFICO» es una base (Ley 1751/2015 art. 10, Res. 13437/1991). Reemplazarla por el documento «Derechos y deberes» de MiRed cuando River lo comparta.
- **Felicitaciones:** decidir si conservan radicado (hoy lo tienen y se cierran al entregarse al área).

## Enlace de ingreso (v8.5)
Los correos (bienvenida, avisos, resúmenes), el push y la sección «Usuarios y sedes» usan el **portal de GitHub Pages** (`URL_PORTAL_DEFECTO`, o la propiedad `URL_PORTAL`). El `/exec` de Apps Script sigue siendo la API que usa el portal (`portal/config.js`). El administrador puede cambiar el enlace desde Usuarios y sedes ▸ Cambiar enlace.

## v8.6
- **Aviso de vencimiento:** `_avisosVencimiento_` (desde `rutinaDiaria`): una vez por caso a los 5 días o menos de la fecha máxima, al área (si no ha respondido) y a los avisos de la sede. Ajuste opcional `diasAvisoVencimiento` (0 = apagado). Requiere el disparador diario (`instalarDisparadores`).
- **NPS:** hoja oculta `Encuestas`; tarjeta en el Tablero. Pendiente: pregunta abierta de «por qué» (hoy solo puntaje) y la consulta pública de radicado (River: «aún no»).
- **App (PWA):** solo el portal de GitHub Pages es instalable (Apps Script va en un iframe). Sin notificaciones push propias: los avisos siguen por correo, Google Chat y ntfy. Para offline real haría falta guardar datos locales (no se hace por privacidad).
