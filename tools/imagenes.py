"""Genera las imágenes incrustadas de la plataforma a partir de assets/.

- frontend/vendor/imagenes.js  → IMG_MASCOTA (pantalla de ingreso, afiche del QR, celebración de felicitaciones)
- apps-script/Codigo.gs        → MASCOTA_BASE64 (acuse de las felicitaciones por correo, liviana)

Uso: python3 tools/imagenes.py   (requiere Pillow: pip install pillow)
"""
import base64, io, pathlib, re
from PIL import Image

R = pathlib.Path(__file__).resolve().parents[1]
mascota = Image.open(R / "assets" / "mascota_siau.png").convert("RGBA")

def png_b64(im, alto):
    ancho = round(im.width * alto / im.height)
    im = im.resize((ancho, alto), Image.LANCZOS)
    im = im.quantize(colors=96, method=Image.FASTOCTREE, dither=Image.NONE)   # paleta: mucho más liviana
    b = io.BytesIO(); im.save(b, "PNG", optimize=True)
    return base64.b64encode(b.getvalue()).decode()

web = png_b64(mascota, 420)
correo = png_b64(mascota, 200)
(R / "frontend" / "vendor" / "imagenes.js").write_text(
    "/* Generado por tools/imagenes.py a partir de assets/mascota_siau.png — no editar a mano. */\n"
    'var IMG_MASCOTA = "data:image/png;base64,' + web + '";\n', encoding="utf-8")
gs = R / "apps-script" / "Codigo.gs"
t = gs.read_text(encoding="utf-8")
t, n = re.subn(r'^var MASCOTA_BASE64 = ".*";$', 'var MASCOTA_BASE64 = "' + correo + '";', t, flags=re.M)
assert n == 1, "No encontré la línea MASCOTA_BASE64 en Codigo.gs"
gs.write_text(t, encoding="utf-8")
print(f"imagenes.js: {len(web)//1024} KB · MASCOTA_BASE64 (correo): {len(correo)//1024} KB")
