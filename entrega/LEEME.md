# Entrega v8.4 — qué pegar y dónde

Apps Script y GitHub son cosas separadas: el repositorio no se sincroniza solo con Apps Script. Hay que pegar estos archivos (o usar clasp, ver docs/DESPLIEGUE.md §2).

| Archivo | Dónde va |
|---|---|
| `Codigo.gs` | Apps Script: reemplaza **todo** el contenido de `Codigo.gs` |
| `Index.html` | Apps Script: reemplaza **todo** el contenido de `Index.html` |
| `portal_index.html` | GitHub: carpeta `portal/`, reemplaza `index.html` |
| `favicon.png`, `apple-touch-icon.png` | GitHub: carpeta `portal/` |

Después, en Apps Script: **Implementar ▸ Administrar implementaciones ▸ lápiz ▸ Nueva versión ▸ Implementar**.
Luego, en la hoja: menú **PQRS ▸ Instalar disparadores** (el correo se revisa cada 3 minutos).


## Novedades 8.5
- **Codigo.gs e Index.html:** pegar ambos en Apps Script, luego **Implementar ▸ Administrar implementaciones ▸ lápiz ▸ Nueva versión**. Ejecutar una vez `instalarDisparadores` (la migración 8.5 agrega la lista «MOTIVO ESPECÍFICO» en Config y renombra el encabezado de la columna 29).
- **Portal (GitHub):** `portal_index.html` va como `portal/index.html` (ya trae la URL /exec).
- Nuevo: ficha del formulario descargable por técnicos, ingreso con mascota, usuario nuevo con correo de bienvenida y clave **Siau123\*** (vence a las 72 h), «Motivo específico (derecho vulnerado)» en vez de «Tipología».
- Pendiente: separar el consolidado en dos libros y cargar el documento «Derechos y deberes» de MiRed (ver `docs/PENDIENTES.md`).
