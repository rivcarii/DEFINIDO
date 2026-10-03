# Política de seguridad de la información · Sistema de PQRS (MiRed Barranquilla IPS S.A.S.)

Versión 8.5. Aplica a la plataforma (Apps Script + Google Sheets), al portal publicado en GitHub Pages, a los correos que envía y a los respaldos en Drive.
Marco: Ley 1581 de 2012 (protección de datos personales), Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015) y reserva de la historia clínica (Ley 23 de 1981, Resolución 1995 de 1999).

## 1. Qué datos se protegen

| Clase | Ejemplos | Dónde está |
|---|---|---|
| **Sensible (salud)** | descripción del caso, diagnóstico, servicio, edad, población de especial protección | hoja `Consolidado_PQRS`, respaldos en Excel, correos internos a las áreas |
| **Personal** | nombre, documento, teléfono, correo, dirección | `Consolidado_PQRS`, hilos de Gmail |
| **Credenciales** | contraseñas (solo su resumen con sal), sesiones | hoja oculta `Usuarios`, caché de Apps Script |
| **Operativa** | radicados, tipos, prioridades, sedes, fechas | avisos a técnicos, Google Chat, push |

Regla de oro: **los avisos fuera de la plataforma** (correo a técnicos, Google Chat, push al celular) solo llevan **radicado, tipo, prioridad, sede y fechas**. Nunca nombre, documento, descripción ni el asunto original.

## 2. Qué protege el sistema hoy

| Control | Cómo funciona |
|---|---|
| **Cifrado en tránsito** | Todo viaja por HTTPS (TLS) entre el navegador, Apps Script, Gmail y Drive. El portal solo puede hablar con `script.google.com` (política CSP del portal). |
| **Cifrado en reposo** | Google cifra Sheets, Drive y Gmail en reposo (AES-256) y administra las llaves. Apps Script no ofrece cifrado propio por campo; se descartó cifrar columnas desde la aplicación porque rompería filtros, búsqueda, fórmulas y exportaciones sin dar protección real frente a quien edita el proyecto. |
| **Contraseñas** | Se guarda solo un resumen con sal única (SHA-256 repetido 150 veces); nunca la contraseña. Política: mínimo 10 caracteres con mayúscula, minúscula y número, sin el usuario ni palabras comunes. La contraseña temporal obliga a cambiarla y el **servidor** bloquea todo lo demás hasta que se cambie. |
| **Ingreso** | Bloqueo de 15 minutos tras 5 intentos fallidos. Mismo mensaje y mismo tiempo de respuesta para usuario inexistente o contraseña incorrecta. |
| **Sesiones** | Token aleatorio de 256 bits. Caduca a las 6 h sin actividad y, en todo caso, a las **12 h** desde el ingreso. «Cerrar sesión» la invalida en el servidor. |
| **Permisos** | Todo pasa por `api()`: valida sesión, rol (Administrador / Técnico / Consulta) y sede. Un técnico solo ve y radica en sus sedes. Las funciones internas terminan en `_` y el navegador no puede llamarlas. |
| **Auditoría** | Hoja oculta `Auditoria` (visible al administrador en *Usuarios y sedes*): ingresos correctos y fallidos, bloqueos, cierres de sesión, acciones denegadas, contraseñas cambiadas o restablecidas, usuarios creados o modificados, exportaciones. Sin contraseñas ni datos de los casos. |
| **Inyección de fórmulas** | Todo texto externo que empiece por `=` `+` `-` `@` se guarda como texto (`_seguroCelda_`). Una descripción como `=IMPORTXML(…)` no se ejecuta ni sale a Excel como fórmula. |
| **Correos** | No se escribe automáticamente a EPS ni a entes de control; solo el administrador les responde. Los correos internos llevan advertencia de confidencialidad. |
| **Exportaciones** | Solo el administrador exporta. El Excel nunca incluye la hoja `Usuarios`. El respaldo diario se guarda en la carpeta «PQRS · Respaldos (Excel)» y se conservan 14 días. |
| **Diagnóstico de seguridad** | *Configuración ▸ Diagnóstico* revisa: acceso general del consolidado, editores externos, carpeta de respaldos compartida, número de administradores, contraseñas temporales sin cambiar, usuarios sin ingresar en 90 días y fortaleza del tema del push. |

## 3. Reglas para las personas

1. **Cuentas.** Una persona, un usuario. Nunca se comparten usuarios ni contraseñas. Todo usuario nuevo (o restablecido) recibe por correo su usuario y la clave temporal predeterminada **Siau123\***; esa clave **vence a las 72 horas** y el servidor obliga a cambiarla en el primer ingreso. Si hace falta más reserva, el administrador puede escribir otra clave temporal (debe cumplir la política).
2. **Roles mínimos.** Técnico: solo sus sedes. Administradores: entre 1 y 3. El rol «Consulta» para quien solo necesita ver.
3. **Altas y bajas.** Quien deja el SIAU se inactiva el mismo día (*Usuarios y sedes ▸ editar ▸ activo*). Cada trimestre se revisa la lista de usuarios y el diagnóstico de seguridad.
4. **Cuenta SIAU de Google.** Es la dueña de la implementación, del consolidado y de Gmail: activar la **verificación en dos pasos**, no usarla para navegar ni compartir su contraseña, y revisar sus dispositivos y sesiones cada trimestre.
5. **Consolidado.** *Compartir ▸ Acceso general ▸ «Restringido»*. Editores: solo quien administra la plataforma (un editor puede leer todo, incluida la hoja `Usuarios`). El proyecto de Apps Script tiene los mismos editores.
6. **Respaldos y exportaciones.** Traen datos personales y de salud. Se comparten solo con cuentas autorizadas, de preferencia institucionales; un Drive personal solo con autorización expresa del responsable de datos. No se reenvían por WhatsApp ni se suben a servicios de terceros.
7. **Equipos.** Bloqueo de pantalla, navegador actualizado, no usar la plataforma en equipos públicos. «Mantener la sesión» solo en equipos propios del SIAU.
8. **Push y Chat.** El tema de ntfy es un secreto: largo, generado por la plataforma y no compartido. Quien lo conozca lee los avisos (que no llevan datos personales).
9. **Pruebas y capturas.** Nunca con datos reales (nombres, documentos, descripciones).

## 4. Retención

| Información | Conservación | Disposición |
|---|---|---|
| PQRS y trazabilidad | Según la tabla de retención documental de la institución | Archivo anual (ver `docs/PENDIENTES.md`) |
| Respaldos diarios en Excel | 14 días | Se envían a la papelera automáticamente |
| Exportaciones manuales | Hasta que dejen de ser necesarias | Las elimina quien las generó |
| Auditoría de accesos | Mínimo 1 año | Se archiva antes de borrar |
| Usuarios inactivos | Se inactivan, no se borran (conserva la trazabilidad) | — |

## 5. Incidentes de seguridad

1. **Detectar:** diagnóstico de seguridad, auditoría (ingresos fallidos o bloqueos repetidos), aviso de un usuario o de Google.
2. **Contener (primeros 60 minutos):** restablecer o inactivar el usuario afectado (*Usuarios y sedes*), cambiar el tema del push, quitar editores sobrantes del consolidado y del proyecto de Apps Script, y si hay duda sobre la cuenta SIAU, cambiar su contraseña y cerrar sesiones desde la cuenta de Google.
3. **Evaluar:** qué datos se vieron, de cuántas personas y durante cuánto tiempo (auditoría y trazabilidad).
4. **Notificar:** al responsable de protección de datos de la institución. Si hay violación de los códigos de seguridad o riesgo en la administración de la información de los titulares, **se informa a la Superintendencia de Industria y Comercio** por el mecanismo y en los plazos que indique la ley (art. 17 lit. n de la Ley 1581 de 2012) y se avisa a los titulares afectados cuando corresponda.
5. **Corregir y documentar:** causa, acciones y cambios a esta política.

## 6. Límites conocidos (y qué haría falta)

- El resumen de las contraseñas es SHA-256 con sal repetido 150 veces: es lo que Apps Script permite sin hacer lenta la entrada. Frente a un atacante con acceso a la hoja `Usuarios` es más débil que un algoritmo moderno (PBKDF2/Argon2). Por eso la política exige 10 caracteres y la hoja se mantiene con pocos editores.
- No hay segundo factor propio. Si se requiere, la ruta es usar **Inicio de sesión con Google** (cuentas institucionales con verificación en dos pasos) o mover la autenticación a un servicio especializado (Firebase Auth, Auth0).
- Los editores del consolidado y del proyecto de Apps Script pueden leer todo; el control es administrativo (sección 3), no técnico.
- No se cifran los campos del consolidado ni los Excel (el cifrado de Google en reposo sí aplica). Si la normativa o un cliente lo exigen, la alternativa es una base de datos con cifrado a nivel de columna y llaves propias (por ejemplo Cloud SQL o Supabase), con Sheets solo como reporte.
- El portal en GitHub Pages es una página estática: no contiene datos; todo dato viaja desde Apps Script tras autenticar.

## 7. Revisión de esta política

La revisa el líder de Gestión de la Calidad al menos una vez al año o después de cualquier incidente. Cada cambio de seguridad en el código debe incluir su prueba en `tests/pruebas_v8.js` y quedar descrito aquí.

## 8. Seguridad del repositorio en GitHub

El repositorio es **público** (el portal se publica en GitHub Pages): solo contiene código y datos ficticios. Controles en el código:

| Control | Dónde |
|---|---|
| Análisis estático CodeQL (semanal y en cada cambio) | `.github/workflows/codeql.yml` |
| Lint, pruebas y revisión de que no se suban hojas de cálculo, credenciales ni llaves | `.github/workflows/verificar.yml` |
| Alertas y PR automáticos de dependencias y acciones | `.github/dependabot.yml` |
| Revisión obligatoria por la persona responsable | `.github/CODEOWNERS` |
| Cómo reportar una vulnerabilidad | `SECURITY.md` |
| Permisos mínimos en los flujos (`contents: read`) | todos los workflows |
| Portal con política CSP (solo habla con `script.google.com`) | `tools/construir_portal.mjs` |

Ajustes que solo puede hacer el dueño del repositorio, en **Settings** (una vez):
1. **Code security ▸** activar *Dependency graph*, *Dependabot alerts*, *Dependabot security updates*, *Secret scanning* y **Push protection**, *Private vulnerability reporting* y *Code scanning (CodeQL)*.
2. **Branches ▸ Add rule** para `main`: exigir pull request, exigir que pasen los chequeos *Verificar* y *CodeQL*, y bloquear *force push* y borrado.
3. **Pages ▸** activar **Enforce HTTPS**.
4. **Cuenta de GitHub:** verificación en dos pasos y llave de acceso o app autenticadora.
5. Nadie más con permiso de escritura (*Settings ▸ Collaborators*).
