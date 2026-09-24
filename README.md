# Sistema de Gestión de PQRS · MiRed Barranquilla IPS

Plataforma web del SIAU (Google Sheets + Apps Script) que unifica las PQRS del **formulario QR**, del **correo institucional** (EPS y entes de control) y de la **atención presencial**.

- Los técnicos de cada sede **radican y consultan** sus sedes.
- Los administradores **direccionan** a las áreas, **responden** al usuario y controlan los **términos legales**.
- Todo queda en el consolidado del Drive de la cuenta SIAU, con trazabilidad.

**Versión 7.3** · 110 pruebas automáticas × 2 configuraciones regionales · recorrido de la interfaz en 4 tamaños de pantalla.

## Empezar

```bash
npm install
npm run verificar      # lint + pruebas + vista previa + recorrido de la interfaz
npm run preview        # abre tests/salida/Vista_Previa_Plataforma.html en el navegador
                       # usuarios demo: siau.admin / tecnico.playa / consulta · clave Demo2026
```

## Documentación

| Archivo | Para qué |
|---|---|
| `CLAUDE.md` | Reglas del proyecto y comandos (Claude Code lo lee solo) |
| `docs/CONTEXTO.md` | Qué pidió la institución, versión por versión, y por qué se decidió cada cosa |
| `docs/ARQUITECTURA.md` | Mapa del código, API y permisos, hojas y columnas, automatización del correo, notificaciones |
| `docs/DESPLIEGUE.md` | Cómo publicar, cómo pasar a la cuenta SIAU y cómo resolver problemas de acceso |
| `docs/PENDIENTES.md` | Riesgos y próximos pasos, en orden de prioridad |
| `docs/requisitos/` | Documento original de la automatización del canal correo |
| `plantilla_libro/` | Estructura del consolidado sin datos personales |

## Usar con Claude Code

1. Descomprime la carpeta y ábrela en la terminal: `cd pqrs-mired-siau`.
2. Opcional: `git init && git add -A && git commit -m "PQRS v7.3"`.
3. Ejecuta `claude`. Claude Code lee `CLAUDE.md` automáticamente.
