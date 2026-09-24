# Despliegue · versión 8

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
4. Revisa la hoja **Migración_Revisar** (119 quejas/reclamos del formulario QR sin radicado SIAU y 1 del histórico sin radicado): si alguna ya se gestionó con otro radicado, anótalo en OBSERVACIONES.

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
   - **Instalar disparadores** → formulario al enviarse, correo cada 5 min, alertas cada 30 min (riesgo vital 8 h/24 h), rutina diaria 7:00 (vencidas + resumen de felicitaciones por área).
   - **Diagnóstico de la puesta en marcha** → lista lo que falta y cómo resolverlo (también en Configuración ▸ Diagnóstico).
3. **Formulario QR**:
   - Formulario actual: en el Google Form ▸ Respuestas ▸ ⋮ ▸ **Seleccionar destino de las respuestas ▸ hoja existente ▸ este consolidado**. Google copia todas las respuestas antiguas, pero **solo se radican las posteriores al corte** (Config B20 = 23/09/2026 20:34:53, la última respuesta migrada). El mapeo de preguntas ya viene configurado.
   - O mejor: Configuración ▸ Código QR ▸ **Crear formulario nuevo** (incluye la autorización de tratamiento de datos, las 41 sedes y los servicios) y reemplaza el QR impreso.
   - **Imprimir afiche**: genera el afiche A4 con el QR, la mascota del SIAU y el aviso de datos para las 40 sedes. **Descargar QR (PNG)** para piezas gráficas.
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
4. Enlace para los técnicos: `https://<usuario>.github.io/pqrs/`. Sigue exigiendo usuario y contraseña; la URL /exec no es secreta.
   Para probar sin publicar: abre `portal/index.html?api=<URL /exec>`.

## 6. Actualizar a una versión nueva

`clasp push` (o pegar los archivos) actualiza el código de `/dev`. Para los técnicos: **Implementar ▸ Administrar implementaciones ▸ lápiz ▸ Versión: Nueva versión ▸ Implementar** (el enlace /exec no cambia). Volver atrás: el mismo camino eligiendo la versión anterior.

## 7. Problemas típicos

| Síntoma | Solución |
|---|---|
| «Necesitas acceso · Lector / Editor» | Compartiste el enlace de la hoja o el /dev. Usa el /exec (Usuarios y sedes ▸ Copiar enlace) |
| «La plataforma se está ejecutando con la cuenta…» | Implementación en «Ejecutar como: Yo» + Nueva versión |
| Los correos salen de otra cuenta | Implementa con la cuenta SIAU o configura siau@ como «Enviar como» y elígelo en Configuración |
| `#ERROR!` en término o fecha máxima | Se reparan solas al abrir la plataforma; o menú PQRS ▸ Reparar fechas y fórmulas |
| El formulario radicó respuestas viejas | Revisa Config B20 (fecha de corte) antes de vincular el formulario |
| Una PQRS no aparece en Prioritarias | Ábrela y ajusta el nivel de riesgo, o pulsa «Identificar prioritarias» |

## 8. Nunca

- Hacer pública la **hoja** o el **proyecto** (solo la implementación es «Cualquier persona»).
- Subir el consolidado real, capturas con datos o exportaciones a git (`.gitignore` bloquea `*.xlsx` y `migracion_salida/`).
