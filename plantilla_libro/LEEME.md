# Plantilla del consolidado

`PQRS_BaseDatos_plantilla.xlsx` es la estructura del libro real (versión v6), **sin datos personales**. Se borraron la Trazabilidad, los nombres, cargos, correos y teléfonos de Responsables, las respuestas del formulario y el ID del formulario.

- Conserva los encabezados, las listas de Config, los términos, los festivos, los parámetros, las plantillas de respuesta, el mapeo del formulario, las validaciones y los formatos.
- Las fórmulas de este archivo son las **anteriores a la reparación de v6**: en la fila 5 apuntan a la fila 18, que es el desplazamiento de 13 filas del error original. La plataforma las reescribe al abrirse (`_migrar_` / `_saludFormulas_`, con el separador correcto). Sirve para entender la estructura, no para leer los valores calculados.
- Las hojas `Usuarios`, `Entidades_Correo`, `Categorias_Correo` y `Gestion_Correo` no están: la plataforma las crea la primera vez que las necesita.
- Para usarla con la plataforma: súbela a Google Drive, ábrela como Hoja de cálculo de Google, pega el código (Extensiones ▸ Apps Script) e implementa (ver `docs/DESPLIEGUE.md`).
