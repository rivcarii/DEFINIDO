"""Genera las imágenes del SIAU (logos del portafolio de imagen del SIAU) a partir de assets/siau/ y de la marca MiRed ya incrustada.

- frontend/vendor/imagenes_siau.js → IMG_SIAU (azul), IMG_SIAU_B (blanco), IMG_SIAU_FICHA (alta resolución para el afiche) e IMG_SIAU_MEDALLA
- apps-script/Codigo.gs            → LOGO_SIAU_B_BASE64 / LOGO_SIAU_BASE64 / LOGO_MIRED_B_BASE64 (encabezados de los correos)

Uso: python3 tools/imagenes_siau.py   (requiere Pillow: pip install pillow)
"""
import base64, io, pathlib, re
from PIL import Image

R = pathlib.Path(__file__).resolve().parents[1]
A = R / "assets" / "siau"

def png_b64(archivo, ancho, colores=None):
    im = Image.open(A / archivo).convert("RGBA")
    im = im.crop(im.getbbox())                     # sin margen transparente sobrante
    alto = round(im.height * ancho / im.width)
    im = im.resize((ancho, alto), Image.LANCZOS)
    if colores:
        im = im.quantize(colors=colores, method=Image.FASTOCTREE, dither=Image.NONE)
    b = io.BytesIO(); im.save(b, "PNG", optimize=True)
    return base64.b64encode(b.getvalue()).decode()

web = {
    "IMG_SIAU": png_b64("Logo_SIAU_azul_medalla_dorada.png", 640, 160),
    "IMG_SIAU_B": png_b64("Logo_SIAU_blanco_medalla_dorada.png", 640, 160),
    "IMG_SIAU_FICHA": png_b64("Logo_SIAU_azul_medalla_dorada.png", 1100, 192),
    "IMG_SIAU_MEDALLA": png_b64("Medalla_SIAU_dorada.png", 240, 128),
    "IMG_MEDALLA_AZUL": png_b64("Medalla_SIAU_azul.png", 360, 64),
    "IMG_MEDALLA_DORADA": png_b64("Medalla_SIAU_dorada.png", 420, 128),   # medalla sobre fondos oscuros (ingreso y pantalla de inicio), sin disco ni fondo   # medalla azul: avatar de Riverino, pantalla de inicio y centro del ingreso
}
js = "/* Generado por tools/imagenes_siau.py a partir de assets/siau — no editar a mano. */\n" + "".join(
    'var %s = "data:image/png;base64,%s";\n' % (k, v) for k, v in web.items())
(R / "frontend" / "vendor" / "imagenes_siau.js").write_text(js, encoding="utf-8")

# Correos: logo SIAU (claro y blanco) y MiRed en blanco (se extrae de la marca ya incrustada)
marca = (R / "frontend" / "vendor" / "imagenes_marca.js").read_text(encoding="utf-8")
mired_b = re.search(r'var IMG_MIRED_B = "data:image/png;base64,([A-Za-z0-9+/=]+)"', marca).group(1)
correo = {
    "LOGO_SIAU_B_BASE64": png_b64("Logo_SIAU_blanco_medalla_dorada.png", 340, 128),
    "LOGO_SIAU_BASE64": png_b64("Logo_SIAU_azul_medalla_dorada.png", 340, 128),
    "LOGO_MIRED_B_BASE64": mired_b,
    "LOGO_SIAU_MEDALLA_BASE64": png_b64("Medalla_SIAU_dorada.png", 96, 64),
}
gs = R / "apps-script" / "Codigo.gs"
t = gs.read_text(encoding="utf-8")
for nombre, valor in correo.items():
    t, n = re.subn(r'^var %s = ".*";$' % nombre, 'var %s = "%s";' % (nombre, valor), t, flags=re.M)
    assert n == 1, "No encontré la línea %s en Codigo.gs" % nombre
gs.write_text(t, encoding="utf-8")
print("imagenes_siau.js: %d KB · correo: %s" % (len(js) // 1024, ", ".join("%s %d KB" % (k, len(v) // 1024) for k, v in correo.items())))
