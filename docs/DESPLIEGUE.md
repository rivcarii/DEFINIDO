# Despliegue · versión 8.1

## ⚠ Antes de empezar: usa SOLO la cuenta de MiRed

El error **«No cuentas con el permiso necesario para acceder al documento solicitado (línea 150, archivo Código)»** y que Google pida **iniciar sesión con tu correo personal** tienen la misma causa: el navegador tiene abiertas varias cuentas y Google usa la **predeterminada (la personal)** para el editor de Apps Script, la autorización y la implementación. Esa cuenta no tiene acceso al consolidado de MiRed.

1. Abre una **ventana de incógnito** (Ctrl+Shift+N) o un **perfil de Chrome nuevo** e inicia sesión **solo** con la cuenta del SIAU de MiRed (siau@…). No agregues la personal.
2. En esa ventana abre el consolidado ▸ **Extensiones ▸ Apps Script**. El proyecto debe crearse **desde la hoja** (vinculado), no desde script.google.com.
3. Selecciona la función **verificarCuenta** ▸ ▶ **Ejecutar** ▸ revisa el registro: debe decir `Cuenta que ejecuta el código: siau@…` y `✔ Abre el consolidado`. Si sale la personal, cierra todo y repite el paso 1.
4. Si ya tenías una implementación hecha con la cuenta personal: **archívala** y crea una nueva desde la cuenta del SIAU (§2). El enlace /exec cambia: compártelo de nuevo.

Todo se hace con la sesión de la **cuenta SIAU** (siau@miredips.org). Esa cuenta es dueña del consolidado, envía los correos y la plataforma se ejecuta como ella. Los técnicos **no necesitan cuenta de Google ni acceso a la hoja**: entran con usuario y contraseña.

## 0. Por qué fallaba el acceso antes (y cómo lo resuelve v8)

| Síntoma que tenían los técnicos | Causa real | Solución v8 |
|---|---|---|
| «No me deja compartir la hoja» / «Necesitas acceso» | Se compartía la **hoja** o el enlace **/dev**. Workspace bloquea compartir fuera del dominio y la hoja nunca debe ser pública | Se comparte solo el enlace **/exec** (o el portal). La hoja sigue privada |
| «No cuentas con el permiso necesario…» | Implementación en «Ejecutar como: usuario que accede» | «Ejecutar como: **Yo** (SIAU)». La pantalla de ingreso lo explica si pasa |
| No aparece «Cualquier persona» | Política de Workspace de miredips.org | Pedir a TI que lo habilite (§4) o dar cuentas @miredips.org y usar «Cualquier persona de MiRed» |
| La plataforma se volvía lenta o «perdía» casos | Tope de 400 filas | v8 no tiene tope (probado con 13.200 registros reales) |

## 1. Consolidado nuevo con el histórico 2026 (una sola vez)

1. En el computador: `pip install openpyxl` y ejecuta
   `python3 tools/migrar_historico.py --historico "HISTÓRICO CONSOLIDADO….xlsx" --formulario "pqrs.xlsx" --salida migracion_salida`
   (ya se generó y te lo entregué; repítelo si cambian los archivos de origen).
2. Sube `PQRS_Consolidado_v8_2026_AAAAMMDD.xlsx` al **Drive de la cuenta SIAU** ▸ clic derecho ▸ Abrir con ▸ Hojas de cálculo de Google ▸ **Archivo ▸ Guardar como Hojas de cálculo de Google**. Borra el .xlsx subido.
3. Archivo ▸ Configuración ▸ Configuración regional **Colombia** y zona horaria **(GMT-05:00) Bogotá**.
4. Revisa la hoja **Migración_Revisar** (120 casos que no tenían radicado: recibieron SIAU desde el 3515): si alguno ya se gestionó con otro radicado, anótalo en OBSERVACIONES. Todo el consolidado usa una sola estructura: **SIAU-AAAA-MM-NNNN**.

## 2. Código de la plataforma

### Opción A · Manual
1. En el consolidado nuevo: **Extensiones ▸ Apps Script**.
2. Crea el archivo **Codigo.gs** con el contenido de `apps-script/Codigo.gs` y el archivo HTML **Index** con `apps-script/Index.html`. Reemplaza `appsscript.json` (Configuración del proyecto ▸ Mostrar el archivo de manifiesto) con `apps-script/appsscript.json`. Guarda.
3. **Implementar ▸ Nueva implementación ▸ Aplicación web**: Ejecutar como **Yo (siau@miredips.org)** · Quién tiene acceso **Cualquier persona** ▸ Implementar ▸ autoriza los permisos (Gmail, Drive, Formularios, servicios externos para Google Chat).
4. Copia la **URL de la aplicación web** (termina en `/exec`): ese es el enlace de los técnicos.

### Opción B · clasp
```bash
npm install
npx clasp login                       # cuenta SIAU; antes activa la API en https://script.google.com/home/usersettings
cp .clasp.json.example .clasp.json    # pega el scriptId del proyecto del consolidado nuevo
npm run push                          # ensambla, lint, pruebas y clasp push
npx clasp create-deployment -d "v8"   # la primera vez; luego: npx clasp update-deployment <ID> -d "v8.x"
```

## 3. Puesta en marcha (10 minutos)

1. Abre el `/exec`, crea el **primer administrador** (tu usuario). La primera carga actualiza el consolidado a la versión 8 (fórmulas, festivos, categorías de riesgo, entes de control y directorio). Con 13.000 filas puede tardar 1–2 minutos.
2. En la hoja aparece el menú **PQRS** (recarga la hoja si no lo ves):
   - **Instalar disparadores** → formulario al enviarse, correo cada 3 min, alertas cada 30 min (riesgo vital 8 h/24 h), rutina diaria 7:00 (vencidas + resumen de felicitaciones por área).
   - **Diagnóstico de la puesta en marcha** → lista lo que falta y cómo resolverlo (también en Configuración ▸ Diagnóstico).
3. **Formulario QR**:
   - Formulario actual: en el Google Form ▸ Respuestas ▸ ⋮ ▸ **Seleccionar destino de las respuestas ▸ hoja existente ▸ este consolidado**. Google copia todas las respuestas antiguas, pero **solo se radican las posteriores al corte** (Config B20 = 23/09/2026 20:34:53, la última respuesta migrada). El mapeo de preguntas ya viene configurado.
   - O mejor: Configuración ▸ Código QR ▸ **Crear formulario nuevo** (incluye la autorización de tratamiento de datos, las 41 sedes y los servicios) y reemplaza el QR impreso.
   - **Imprimir afiche**: genera el afiche A4 con el QR, el logo del SIAU y el aviso de datos para las 40 sedes. **Descargar QR (PNG)** para piezas gráficas.
4. **Áreas responsables**: completa el correo de cada área y sus reglas (servicios, sedes, palabras clave, correos en copia). Con eso la plataforma sugiere o direcciona sola.
5. **Configuración ▸ Automatización**: webhook de Google Chat (aviso con sonido en el celular), correos que reciben todos los avisos, felicitaciones (resumen diario), direccionamiento automático.
6. **Usuarios y sedes**: crea un usuario **Técnico** por cada técnico de sede con sus sedes asignadas ▸ **Invitar** (copia el mensaje con enlace y usuario para WhatsApp).
7. Comprobación: abre el `/exec` en **incógnito desde un celular**: debe verse el ingreso de la plataforma, no una pantalla de Google.
8. **Archiva** la implementación vieja y deja de tabular en el Excel/Sheet anterior.

## 4. Si Workspace no deja publicar para «Cualquier persona»

En orden de preferencia:
1. **TI habilita la opción** (admin.google.com ▸ Apps ▸ Google Workspace ▸ Drive y Documentos ▸ Configuración de uso compartido ▸ permitir compartir fuera de miredips.org, o ▸ Apps Script según la consola). Es lo único que Google exige; los datos siguen protegidos por el ingreso de la plataforma.
2. **Cuentas @miredips.org para los técnicos** e implementar con «Cualquier persona de MiRed Barranquilla IPS» (siguen entrando con su usuario de la plataforma).
3. No uses cuentas personales @gmail para alojar el consolidado: los datos de salud deben quedar en la cuenta institucional (Ley 1581 de 2012).

## 5. Portal con dirección propia (opcional)

La misma interfaz puede publicarse como página (sin el marco de Google, con sonido y avisos del escritorio más confiables):
1. `npm run portal` genera `portal/index.html`.
2. Edita `portal/config.js`: `window.PQRS_API = "https://script.google.com/macros/s/…/exec";`
3. En GitHub: Settings ▸ Pages ▸ Source: **GitHub Actions**. El flujo `.github/workflows/portal.yml` publica al hacer push a `main` (repositorio público o plan con Pages privado).
4. Enlace para los técnicos: `https://<usuario>.github.io/<nombre-del-repositorio>/`. Sigue exigiendo usuario y contraseña; la URL /exec no es secreta.
   Para probar sin publicar: abre `portal/index.html?api=<URL /exec>`.

## 6. Actualizar a una versión nueva

`clasp push` (o pegar los archivos) actualiza el código de `/dev`. Para los técnicos: **Implementar ▸ Administrar implementaciones ▸ lápiz ▸ Versión: Nueva versión ▸ Implementar** (el enlace /exec no cambia). Volver atrás: el mismo camino eligiendo la versión anterior.

## 6b. Actualizar a la 8.2 (Excel, respaldo y radicación rápida)

1. En el editor de Apps Script, copia el `Codigo.gs` actual a un archivo de respaldo (por si quieres volver atrás).
2. Reemplaza todo `Codigo.gs` por el de `entrega/Codigo.gs` y todo `Index.html` por el de `entrega/Index.html`. Guarda.
3. **Implementar ▸ Administrar implementaciones ▸ lápiz ▸ Nueva versión** (el enlace /exec no cambia).
4. La primera vez que alguien pulse «Exportar a Excel» o «Respaldar ahora» como administrador, Google puede pedir permisos de Drive/Hojas a la cuenta SIAU: ejecuta una vez `rutinaDiaria` desde el editor y acéptalos.
5. Configuración ▸ Exportar y respaldar en Excel: deja activo el respaldo diario y, si quieres verlo en otro Drive, escribe ese correo (la carpeta se comparte en solo lectura).

## 6c. Actualizar a la 8.3 (EPS y entes, push, correos nuevos)

1. Reemplaza `Codigo.gs` e `Index.html` por los de `entrega/` y publica **Nueva versión** de la misma implementación.
2. **Vuelve a ejecutar «Instalar disparadores»** (menú PQRS de la hoja): el correo pasa a revisarse cada 3 minutos.
3. Configuración ▸ Automatización ▸ **Push**: pulsa «Generar», guarda, instala la app **ntfy** en los celulares, suscríbete a ese tema y prueba con «Enviar aviso de prueba».
4. El portal de GitHub Pages usa `entrega/portal_index.html` (ya trae la URL de tu implementación).

## 6d. Actualizar a la 8.4 (seguridad)

1. Reemplaza `Codigo.gs` e `Index.html` (y `portal/index.html` en GitHub) por los de `entrega/` y publica **Nueva versión**.
2. Las contraseñas **existentes siguen funcionando**; la nueva política (10 caracteres, mayúscula, minúscula, número) aplica a las que se creen o cambien desde ahora.
3. Entra como administrador ▸ **Configuración ▸ Diagnóstico** y corrige lo que salga en rojo en «Seguridad ·» (acceso general del consolidado «Restringido», editores, administradores, usuarios sin uso).
4. Activa la verificación en dos pasos en la cuenta SIAU de Google y lee `docs/SEGURIDAD.md` con el equipo.

## 6e. WhatsApp (accesos de usuarios y avisos a los técnicos)

Usa la **API oficial de WhatsApp Business (Cloud API de Meta)**. Es gratuito conectarla; Meta cobra por los mensajes de plantilla fuera de la ventana de 24 h (consulta los precios vigentes en Meta). Necesitas una cuenta de Facebook Business y un número de celular que **no** esté registrado en WhatsApp normal (o el número de prueba que Meta regala).

1. Entra a **developers.facebook.com ▸ Mis apps ▸ Crear app** (tipo *Empresa*) y agrega el producto **WhatsApp**.
2. En **WhatsApp ▸ Configuración de la API** copia el **Identificador del número de teléfono** (solo dígitos). Con el número de prueba, agrega abajo los celulares que recibirán mensajes (máximo 5); para escribirle a todos los técnicos registra tu número real y verifica la empresa en *Business Settings ▸ Centro de seguridad*.
3. **Token permanente:** *Business Settings ▸ Usuarios ▸ Usuarios del sistema ▸ Agregar* (rol Administrador) ▸ *Asignar activos* (tu app) ▸ *Generar token* con los permisos `whatsapp_business_messaging` y `whatsapp_business_management`. Cópialo: no se vuelve a mostrar.
4. **Plantilla** (necesaria para escribir sin que la persona te haya escrito antes): *WhatsApp Manager ▸ Plantillas de mensajes ▸ Crear*: categoría **Utilidad**, idioma **Español**, nombre `aviso_pqrs`, texto `Aviso del Sistema de PQRS SIAU: {{1}}`, con un ejemplo en la variable. Meta la aprueba en minutos u horas.
5. En la plataforma: **Configuración ▸ Automatización ▸ WhatsApp**: pega el ID y el token, escribe `aviso_pqrs` como plantilla, **Guardar conexión**, activa **Enviar por WhatsApp**, **Guardar automatización** y **Enviar mensaje de prueba** a tu celular.
6. En **Usuarios y sedes ▸ editar** escribe el WhatsApp de cada persona (10 dígitos o con 57). Al crear o restablecer un usuario con WhatsApp, recibe su enlace, usuario y contraseña temporal.

Notas: el token se guarda en las propiedades del proyecto de Apps Script (nunca en la hoja ni en GitHub). Los avisos de PQRS solo llevan radicado, tipo, prioridad, sede, fechas y enlace. Si apagas **Incluir la contraseña temporal**, el mensaje de acceso solo trae el enlace y el usuario. Sin plantilla, WhatsApp solo entrega el mensaje si la persona te escribió en las últimas 24 horas (sirve para pruebas).

## 7. Problemas típicos

| Síntoma | Solución |
|---|---|
| «Necesitas acceso · Lector / Editor» | Compartiste el enlace de la hoja o el /dev. Usa el /exec (Usuarios y sedes ▸ Copiar enlace) |
| «La plataforma se está ejecutando con la cuenta…» / «No cuentas con el permiso… (línea 150)» | El código corre con una cuenta sin acceso (casi siempre la personal predeterminada del navegador). Ver «Antes de empezar» e implementa desde la cuenta del SIAU con «Ejecutar como: Yo» |
| Pide iniciar sesión con el correo personal | Ventana de incógnito o perfil de Chrome solo con la cuenta de MiRed |
| Los correos salen de otra cuenta | Implementa con la cuenta SIAU o configura siau@ como «Enviar como» y elígelo en Configuración |
| `#ERROR!` en término o fecha máxima | Se reparan solas al abrir la plataforma; o menú PQRS ▸ Reparar fechas y fórmulas |
| El formulario radicó respuestas viejas | Revisa Config B20 (fecha de corte) antes de vincular el formulario |
| Una PQRS no aparece en Prioritarias | Ábrela y ajusta el nivel de riesgo, o pulsa «Identificar prioritarias» |

## 8. Nunca

- Hacer pública la **hoja** o el **proyecto** (solo la implementación es «Cualquier persona»).
- Subir el consolidado real, capturas con datos o exportaciones a git (`.gitignore` bloquea `*.xlsx` y `migracion_salida/`).
