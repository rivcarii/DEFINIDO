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
