# legacy/ · solo referencia histórica

Así se construyó el código **hasta v7.3**. No se usa para compilar: la fuente de verdad ahora es `apps-script/Codigo.gs` más `frontend/`.

- `pipeline_parches/`: `patch.py` armaba el backend a partir de `base_v4.gs` más bloques (`*_bloque.gs`, `nuevas.gs`, `correo_v6.gs`). Después, `patch7.py` (v7: usuarios, clasificador, correo automático y fechas), `patch71.py` (notificaciones y confidencialidad) y `patch73.py` (permiso P_RADICAR) aplicaban reemplazos de texto con verificación. Las rutas del script apuntan al entorno donde se generó.
- `libro/build_v4.py`: generador (openpyxl) del libro v4 original, con hojas, fórmulas, validaciones y formatos condicionales.

Sirve para entender **por qué** una parte del código se ve como se ve, por ejemplo los comentarios `// v5`, `// v7.1`, etc.
