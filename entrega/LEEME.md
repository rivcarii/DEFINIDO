# Entrega v9.10.1 — qué pegar y dónde

Apps Script y GitHub son cosas separadas: el repositorio no se sincroniza solo con Apps Script. Hay que pegar estos archivos (o usar clasp, ver docs/DESPLIEGUE.md §2).

| Archivo | Dónde va |
|---|---|
| `Codigo.gs` | Apps Script: reemplaza **todo** el contenido de `Codigo.gs` |
| `Index.html` | Apps Script: reemplaza **todo** el contenido de `Index.html` |
| `portal_index.html` | GitHub: carpeta `portal/`, reemplaza `index.html` (ya trae la URL /exec) |
| `favicon.png`, `apple-touch-icon.png` | GitHub: carpeta `portal/` |

Después, en Apps Script: **Implementar ▸ Administrar implementaciones ▸ lápiz ▸ Nueva versión ▸ Implementar**.
En el ingreso debe decir **«Pantalla 9.10.1 · Servidor 9.10.1»**; si no coinciden, falta pegar o publicar versión nueva.

## Novedades 9.10.1 (el módulo no abría)
- **Ya no falla en silencio.** Si el servidor no está actualizado, si falta la dirección o si Google rechaza el marco, la pantalla lo dice.
- **Usa la dirección tal cual** (la de dominio `/a/miredips.org/…` que abre en tu navegador). Si antes guardaste una dirección en Configuración ▸ Módulos externos, la de la implementación anterior se ignora.
- **Comprobar acceso** (dentro del módulo y en Configuración ▸ Módulos externos): la plataforma le pregunta a Google qué responde cada página del módulo y te explica la causa (no es pública, no existe, prohíbe marcos…). Se ejecuta sola al abrir el módulo.
- **Probar otra forma de la dirección**: botón para cargar la forma común en el marco si la de dominio no abre.
- Para que esto funcione, **pega los dos archivos**: el diagnóstico vive en `Codigo.gs`; si solo pegas `Index.html`, el módulo igual abre pero verás el aviso «el servidor está en una versión anterior».

## Novedades 9.10
- **Seguimiento SIAU se ejecuta dentro de la plataforma** (solo administradores): Módulos ▸ Seguimiento SIAU ▸ Visor / Administrador. Se abre en un marco aislado con pestañas, «Recargar» y «Otra pestaña».
- **Requisito en el otro proyecto** (`SEGUIMIENTO-SIAU-ASOUSUARIOS`): su implementación debe estar en **Ejecutar como: Yo (siau@miredips.org)** y **Quién tiene acceso: Cualquier persona** (no solo el dominio), con usuario y contraseña propios. Si Google muestra un inicio de sesión bloqueado dentro del marco, usa «Otra pestaña».
- La dirección se cambia en **Configuración ▸ Módulos externos** (acepta `https://script.google.com/macros/s/…/exec` y la forma con dominio `/a/miredips.org/macros/s/…/exec`).
- **Portal (GitHub):** la política de seguridad ahora permite `frame-src https://script.google.com`; hay que publicar el nuevo `portal_index.html`.
- La rama `claude/puente-pqrs` del repo del módulo ya no se usa y se puede borrar.

## Pendientes
- Separar el consolidado en dos libros y cargar el documento «Derechos y deberes» de MiRed (ver `docs/PENDIENTES.md`).
- `web/index.html` del repo del módulo todavía redirige a la dirección anterior de Apps Script.
