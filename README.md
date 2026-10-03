# Sistema de Gestión de PQRS · MiRed Barranquilla IPS

Plataforma del SIAU (Google Sheets + Apps Script + Google Forms) que unifica en un solo consolidado las PQRS del **formulario QR**, el **correo institucional** (EPS, entes de control y juzgados), la **atención presencial, telefónica y en papel** de las 40 sedes, con términos legales, priorización por riesgo y trazabilidad.

**Versión 8.1** · radicado único SIAU-AAAA-MM-NNNN

- Consolidado sin tope de filas (probado con los 13.200 registros de 2026) y festivos automáticos.
- **Prioritarias**: riesgo vital en niñas, niños y adolescentes en 8 horas (Circular Supersalud 2026151000000007-5), riesgo vital 24 h y priorizado 48 h (Circular 2023151000000010-5), con alarma sonora, Google Chat, correo y cuenta regresiva. Comando **Identificar prioritarias**.
- **Directorio de áreas** con reglas (servicios, sedes, palabras clave, copias): sugerencia y direccionamiento automático o manual.
- 4 pasos de notificación (acuse con clasificación y término ▸ en trámite y solicitud interna ▸ respuesta formal ▸ aviso de cierre al área). **Felicitaciones**: solo acuse con la mascota del SIAU, resumen diario de reconocimientos por área, sonido y celebración en la plataforma.
- Aviso de protección de datos (Ley 1581 de 2012) y autorización de tratamiento en la radicación y en el formulario.
- **QR del formulario** con afiche imprimible, creación del formulario nuevo y diagnóstico de la puesta en marcha.
- Acceso sin cuenta de Google (usuario y contraseña por técnico y sedes) y **portal** opcional con dirección propia.
- Migración del histórico 2026 (`tools/migrar_historico.py`): conserva SIAU hasta 3514 y da radicado SIAU (3515–16379) a felicitaciones y respuestas del QR que no lo tenían.

## Empezar

```bash
npm install
npm run verificar      # lint + pruebas (v7 y v8, dos configuraciones regionales) + recorrido E2E + portal
npm run preview        # tests/salida/Vista_Previa_Plataforma.html · usuarios demo: siau.admin / tecnico.playa / consulta · clave Demo2026
```

## Documentación

| Archivo | Para qué |
|---|---|
| `docs/DESPLIEGUE.md` | Puesta en marcha paso a paso, accesos, formulario QR, portal |
| `docs/GUIA_TECNICOS.md` | Guía de una página para los técnicos de sede |
| `docs/NORMATIVA.md` | Circulares, leyes y cómo las aplica la plataforma |
| `docs/ARQUITECTURA.md` | Código, API, hojas, columnas, automatizaciones |
| `docs/CONTEXTO.md` | Requisitos por versión y decisiones |
| `docs/PENDIENTES.md` | Riesgos y próximos pasos |
| `CLAUDE.md` | Reglas del proyecto para Claude Code |

## Seguridad

Política de seguridad, cifrado, auditoría y respuesta a incidentes: [`docs/SEGURIDAD.md`](docs/SEGURIDAD.md).
