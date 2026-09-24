# Despliegue

Siempre con la sesión de la **cuenta SIAU** abierta. Esa cuenta es la dueña del consolidado y la plataforma se ejecuta como ella.

## 1. Opción A · Manual (la que usa River hoy)

1. Abre el consolidado ▸ **Extensiones ▸ Apps Script**.
2. Reemplaza el contenido de **Código.gs** con `apps-script/Codigo.gs`, y el de **Index** (archivo HTML llamado exactamente `Index`) con `apps-script/Index.html`. Guarda.
3. Ve a **Implementar ▸ Administrar implementaciones ▸ lápiz ✏️ ▸ Versión: Nueva versión ▸ Implementar**. Esto mantiene el mismo enlace /exec.
4. Si Google pide permisos nuevos, autoriza con la cuenta SIAU.

## 1. Opción B · clasp (desde Claude Code)

```bash
npm install
npx clasp login                       # con la cuenta SIAU; antes activa la API en https://script.google.com/home/usersettings
cp .clasp.json.example .clasp.json    # pega el scriptId (Apps Script ▸ Configuración del proyecto ▸ ID de secuencia de comandos)
npm run push                          # ensambla, lint, pruebas y clasp push (sube Codigo.gs, Index.html y appsscript.json)
npx clasp list-deployments            # copia el ID de la implementación web (la del enlace /exec)
npx clasp update-deployment <ID> -d "v7.x · descripción"   # publica la nueva versión en el mismo enlace
```

- `clasp push` **reemplaza todos los archivos** del proyecto remoto. Si allá el archivo se llama "Código.gs", quedará uno solo llamado "Codigo". Es normal.
- `clasp push` solo actualiza el código de /dev. Los técnicos (/exec) no ven cambios hasta hacer `update-deployment` o "Nueva versión" en la interfaz.
- `appsscript.json` fija `timeZone: America/Bogota`, V8 y `webapp: USER_DEPLOYING / ANYONE_ANONYMOUS`. Si el proyecto real usa otra zona, cámbiala aquí antes del push.

## 2. Puesta en marcha en la copia de la cuenta SIAU (pendiente en producción)

River copió el consolidado al Drive de la cuenta SIAU. Al copiar una hoja pasa lo siguiente:

| Qué | ¿Se copia? | Qué hacer |
|---|---|---|
| Código de Apps Script ligado a la hoja | Sí, pero en su versión vieja | Pegar o subir la v7.3 (§1) |
| Implementación web (enlace /exec) | **No** | **Implementar ▸ Nueva implementación ▸ Aplicación web ▸ Ejecutar como: Yo (SIAU) ▸ Quién tiene acceso: Cualquier persona** |
| Disparadores | **No** | Hoja ▸ menú **PQRS ▸ Instalar disparadores** |
| Propiedades del script (ajustes de automatización, webhook de Chat, alias) | **No** | Plataforma ▸ Configuración ▸ Automatización ▸ volver a configurar y **Guardar** |
| Hojas Usuarios, Entidades_Correo, Categorias_Correo, Gestion_Correo | Sí | Revisar en Usuarios y sedes que cada técnico tenga rol **Técnico** y sus sedes |
| Formulario QR | Google crea **otro** formulario copia; el QR sigue apuntando al **original**, que escribe en la hoja vieja | En el formulario original: **Respuestas ▸ ⋮ ▸ Seleccionar destino ▸ hoja nueva**, o Configuración ▸ Vincular un formulario existente. Borrar la copia del formulario |
| Implementación vieja (cuenta anterior) | Sigue viva | **Archivarla** para que nadie radique en el consolidado antiguo |

**Comprobación:** abre el /exec en una **ventana de incógnito** del celular. Debe aparecer el ingreso de la plataforma (no la pantalla de Google) y el técnico debe ver solo Inicio, Bandeja, Radicar y Tablero, con sus sedes.

## 3. Problemas típicos de acceso

| Síntoma | Causa | Solución |
|---|---|---|
| "Necesitas acceso · Lector / Editor" (pantalla de Google) | Se compartió el enlace del editor o el **/dev** | Compartir la "URL de la aplicación web" que termina en **/exec**. En la plataforma: Usuarios y sedes ▸ Copiar enlace / Invitar |
| La plataforma carga pero dice "No cuentas con el permiso necesario para acceder al documento solicitado" o "La plataforma se está ejecutando con la cuenta…" | Implementación en "Ejecutar como: usuario que accede" | Cambiar a **Ejecutar como: Yo** + Nueva versión |
| No aparece la opción "Cualquier persona" | Google Workspace de miredips.org no permite compartir fuera del dominio | La administración de Workspace lo habilita en admin.google.com ▸ Apps ▸ Google Workspace ▸ Drive y Documentos ▸ Uso compartido, o se dan cuentas @miredips.org a los técnicos y se usa "Cualquier persona de miredips.org" |
| Los correos salen de otra cuenta | Los envía la cuenta que implementó | Implementar con la cuenta SIAU, o agregar siau@ como "Enviar como" en Gmail y elegirla en Configuración ▸ Cuenta que envía las notificaciones |
| `#ERROR!` en columnas de término o fecha máxima | Separador regional o fórmulas borradas | Se reparan solas al abrir la plataforma (`_saludFormulas_`); también hoja ▸ PQRS ▸ Reparar fechas y fórmulas de días |

## 4. Nunca

- Poner la **hoja** o el **proyecto** como públicos. Solo la **implementación** es "Cualquier persona"; los datos quedan protegidos por el ingreso de la plataforma.
- Compartir el enlace /dev o el del editor con los técnicos.
- Subir el consolidado real a git, a capturas o a pruebas.

## 5. Volver a una versión anterior

**Implementar ▸ Administrar implementaciones ▸ lápiz ▸ Versión:** elige la anterior ▸ **Implementar**. El enlace no cambia.
