# Pendientes, riesgos y próximos pasos (v8)

Antes de cerrar cualquier punto: `npm run verificar` y su prueba.

## P1 · Puesta en marcha (depende de la cuenta SIAU)

1. Subir el consolidado migrado y pegar el código (`docs/DESPLIEGUE.md` §1–§3). Validar en incógnito desde un celular.
2. **Correos de las áreas y reglas del directorio** en Áreas responsables: sin correo no se puede direccionar ni entregar felicitaciones.
3. **Revisar la hoja Migración_Revisar**: 119 casos QR y 1 HIS sin radicado SIAU. El consecutivo SIAU **3422** no existe en el histórico: confirmar si se anuló.
4. Verificar dominios supuestos de entes: `@personeriabarranquilla.gov.co`, `@contraloriabarranquilla.gov.co`, `@atlantico.gov.co`, `@icbf.gov.co` (Configuración ▸ Entidades).
5. Publicar la **política de tratamiento de datos** de MiRed IPS y pegar su enlace en Config B21 (aparece en el formulario y en los correos).
6. Si Workspace no permite «Cualquier persona»: gestionar con TI (§4 de DESPLIEGUE).

## P2 · Rendimiento con el volumen real

- Con 13.200 filas cada lectura completa del consolidado (57 columnas) toma del orden de 2–4 s en Apps Script. Inicio hace 2 lecturas. Si se vuelve lento:
  - **Archivo anual**: mover a un libro «Histórico AAAA» las felicitaciones cerradas del año anterior (~16.000/año) conservando el radicado; el tablero puede leer ambos.
  - Leer solo las columnas necesarias en Inicio/Prioritarias.
- `setFormulas` sobre 13.400 filas en la primera migración: 1–2 min (una sola vez).

## P3 · Mejoras funcionales

- Reportes exportables (Excel/PDF) por sede, tipo, oportunidad y nivel de riesgo (indicadores SOGCS y Supersalud).
- Tablero: gráfico por nivel de riesgo y tiempo de respuesta de las prioritarias en horas.
- Encuesta de satisfacción automática al cerrar.
- Recuperación de contraseña sin administrador; auditoría de ingresos.
- Redacción asistida con IA (Gemini de Google Workspace o Claude) **solo** con acuerdo de tratamiento de datos y anonimización; hoy el redactor es por reglas para no enviar datos de salud a terceros.

## P4 · Limitaciones conocidas (aceptadas)

- Sesiones máx. 6 h (CacheService). Hash SHA-256 con sal ×150.
- Cuotas de Google: correos/día (Workspace ~1.500 destinatarios), 6 min por ejecución (la importación del formulario corta a los 4 min y sigue en la siguiente), UrlFetch.
- El motor de riesgo es por palabras: puede fallar con textos ambiguos. Por eso muestra las señales, avisa al SIAU y permite ajustar.
- La vista previa y las pruebas no evalúan fórmulas (el simulador del navegador las emula).
