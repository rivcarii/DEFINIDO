# Pendientes, riesgos y próximos pasos

Ordenados por prioridad. Antes de cerrar cualquier punto hay que pasar `npm run verificar` y agregar su prueba.

## P1 · Errores o riesgos que hay que atender primero

1. **Tope de 400 PQRS en el consolidado.** `CFG.FILA_FIN = 404` (datos en las filas 5–404).
   - Todas las lecturas (`_filaDe`, bandeja, tablero, novedades, `_siguienteConsecutivo`) recorren solo ese rango.
   - Cuando se llena, `_proximaFila` copia la fila 404 a la 405, pero `clearContent()` **borra también las fórmulas**, y `CFG.FILA_FIN` solo cambia en memoria. En la siguiente ejecución esa fila **no existe para la plataforma**: no aparece en la bandeja ni se encuentra por radicado.
   - **Arreglo sugerido:** calcular el fin dinámicamente (`_finDatos_()` = última fila con CÓDIGO, con un colchón), hacer que `_escribirFormulas_` extienda las fórmulas a las filas nuevas, reemplazar todas las lecturas de `CFG.FILA_FIN` y agregar un paso de migración (`ESQUEMA` "8").
   - La plantilla real tiene formato hasta cerca de la fila 987. Probar con más de 450 filas.
2. **Puesta en marcha en la cuenta SIAU** (ver `DESPLIEGUE.md` §2): implementación nueva, disparadores, formulario QR, ajustes y archivar la implementación vieja.
3. **Verificar dominios** de Supersalud (`@supersalud.gov.co`) y Contraloría (`@contraloria.gov.co`). El documento de requisitos los dejó en blanco y se supusieron. Se editan en Configuración ▸ Entidades.
4. **Término para "EPS" como entidad presentada.** Si un correo de EPS no trae categoría, la entidad presentada es "EPS". Esa fila no existe en Config A6:D8 (solo SEDE, SUPER SALUD y SECRETARIA DE SALUD) y el término queda "Revisar la entidad". Hay dos salidas: agregar una fila EPS en Config (hay que ampliar el rango `CFG_TERMINOS` y las fórmulas) o mapear EPS a SEDE (15 días hábiles). **Decidir con River.**

## P2 · Mejoras funcionales pedidas o implícitas

- **Flujo del puente:** hoy los administradores se enteran de lo que radican los técnicos por avisos (plataforma, correo y Chat) y por la etapa "Sin direccionar". Se podría agregar una bandeja "Por direccionar hoy" con asignación a un administrador y un indicador de tiempo entre radicación y direccionamiento.
- **Reportes:** exportar a Excel o PDF el informe mensual por sede, tipo y oportunidad (indicadores del SOGCS y de la Supersalud).
- **Carga del histórico:** existe un archivo "HISTÓRICO CONSOLIDADO DE OPINIONES DEL USUARIO" que River compartió al inicio del proyecto y no está en este repositorio. Importarlo requiere antes el arreglo de P1.1.
- **Recuperar contraseña** sin administrador. Hoy solo el administrador la restablece.
- **Auditoría de ingresos** (hoja de accesos) y cierre de sesiones de un usuario inactivado. Hoy la sesión se invalida en la siguiente llamada.

## P3 · Limitaciones conocidas (aceptadas)

- Las sesiones duran como máximo 6 h (límite de CacheService). El bloqueo es por usuario, no por IP.
- El hash es SHA-256 con sal ×150 (no hay bcrypt en Apps Script). Es aceptable porque la hoja es privada.
- Las notificaciones del escritorio pueden quedar bloqueadas por el iframe de Apps Script; el canal externo confiable es Google Chat.
- Cuotas de Google: correos por día (Workspace ~1.500 destinatarios), 6 min por ejecución y UrlFetch. `procesarCorreoEntrante` toma máximo 40 hilos de los últimos 3 días en cada pasada.
- La automatización solo procesa correos que llegan **después** de activarla (`AJUSTES.desde`).
- La vista previa y las pruebas **no evalúan fórmulas**: término, fecha máxima y semáforo salen vacíos si la prueba no los pone.
- `Codigo.gs` es un solo archivo de unas 3.600 líneas. Se puede dividir en varios `.gs` (Apps Script comparte el ámbito global), pero hay que cuidar el orden de los `var` de nivel superior que dependen de otros (`CFG`, `C`, `CAMPOS`, `RUTAS`, `ESQUEMA`…). Si se hace: un archivo por sección de la tabla de `ARQUITECTURA.md` §2, `filePushOrder` en `.clasp.json` y pruebas verdes.

## Ideas para después

- Integración con n8n (lo que proponía el documento original) solo si se necesitan canales fuera de Google (WhatsApp Business, por ejemplo).
- Encuesta de satisfacción automática al cerrar una PQRS.
- Tablero público anónimo de indicadores (sin datos personales) para comités.
