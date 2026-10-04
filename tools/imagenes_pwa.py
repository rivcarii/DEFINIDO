"""Imágenes de la app (íconos, favicon, imagen para compartir) con la mascota del SIAU y las PQRS como planetas que la orbitan.
Uso: python3 tools/imagenes_pwa.py   (requiere Pillow)
Genera en assets/pwa/: icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png (180), favicon.png (64), og.png (1200x630), imagen_app_1024.png"""
import math, pathlib
from PIL import Image, ImageDraw, ImageFilter, ImageFont

R = pathlib.Path(__file__).resolve().parents[1]
OUT = R / "assets" / "pwa"
mas = Image.open(R / "assets" / "mascota" / "mascota_siau.png").convert("RGBA")
busto = mas.crop((0, 0, mas.width, int(mas.height * 0.60)))               # cabeza, camiseta SIAU y megáfono
_a = busto.split()[3]; _w, _h = busto.size                                  # el borde inferior se desvanece (sin corte seco)
_g = Image.new("L", (_w, _h), 255); _gd = ImageDraw.Draw(_g)
for _y in range(int(_h * .86), _h): _gd.line((0, _y, _w, _y), fill=int(255 * (1 - (_y - _h * .86) / (_h * .14))))
from PIL import ImageChops
busto.putalpha(ImageChops.multiply(_a, _g))
FUENTE = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
PLANETAS = [("P", "#7B4FB8", 205, 0.40), ("Q", "#E20A31", 318, 0.43), ("R", "#F29D00", 150, 0.46), ("S", "#1F6FD1", 28, 0.41)]   # color de cada tipo, ángulo, radio de órbita

def fondo(w, h):
    im = Image.new("RGBA", (w, h))
    px = im.load()
    for y in range(h):
        for x in range(w):
            t = (x / w * 0.55 + y / h * 0.45)
            px[x, y] = (int(4 + 8 * t), int(112 - 46 * t), int(152 - 60 * t), 255)   # #04709A → #0C4A5C
    return im

def planeta(d, color, letra):
    """Esfera con brillo y sombra, con la sigla de la PQRS."""
    S = 4; n = d * S
    base = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    m = Image.new("L", (n, n), 0); ImageDraw.Draw(m).ellipse((0, 0, n - 1, n - 1), fill=255)
    cap = Image.new("RGBA", (n, n), color); base.paste(cap, (0, 0), m)
    sombra = Image.new("RGBA", (n, n), (0, 0, 0, 0)); ImageDraw.Draw(sombra).ellipse((n * .18, n * .30, n * 1.25, n * 1.25), fill=(0, 0, 0, 70))
    base.alpha_composite(Image.composite(sombra.filter(ImageFilter.GaussianBlur(n * .10)), Image.new("RGBA", (n, n), (0, 0, 0, 0)), m))
    brillo = Image.new("RGBA", (n, n), (0, 0, 0, 0)); ImageDraw.Draw(brillo).ellipse((n * .12, n * .08, n * .52, n * .42), fill=(255, 255, 255, 190))
    base.alpha_composite(Image.composite(brillo.filter(ImageFilter.GaussianBlur(n * .05)), Image.new("RGBA", (n, n), (0, 0, 0, 0)), m))
    f = ImageFont.truetype(FUENTE, int(n * .52))
    dr = ImageDraw.Draw(base); b = dr.textbbox((0, 0), letra, font=f)
    dr.text(((n - (b[2] - b[0])) / 2 - b[0], (n - (b[3] - b[1])) / 2 - b[1] + n * .02), letra, font=f, fill="white")
    return base.resize((d, d), Image.LANCZOS)

def sistema(lienzo, cx, cy, u, mascota_h):
    """Dibuja órbitas, mascota y planetas. u = unidad (alto del lienzo cuadrado)."""
    d = ImageDraw.Draw(lienzo, "RGBA")
    for r in (0.36, 0.41, 0.46):
        rr = r * u; d.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), outline=(255, 255, 255, 48), width=max(1, int(u / 190)))
    b = busto.resize((round(busto.width * mascota_h / busto.height), round(mascota_h)), Image.LANCZOS)   # sin deformar
    lienzo.alpha_composite(b, (round(cx - b.width / 2), round(cy - b.height / 2 + u * 0.03)))
    pd = round(u * 0.15)
    for letra, color, ang, rad in PLANETAS:
        px = cx + math.cos(math.radians(ang)) * rad * u; py = cy - math.sin(math.radians(ang)) * rad * u
        lienzo.alpha_composite(planeta(pd, color, letra), (round(px - pd / 2), round(py - pd / 2)))

def icono(n, escala=1.0, redondo=False):
    im = fondo(n, n)
    sistema(im, n / 2, n / 2, n * escala, n * escala * 0.60)
    if escala < 1:   # el resto del cuadrado ya es fondo: zona segura de los íconos «maskable»
        pass
    return im

def guardar(im, nombre, tam=None):
    if tam: im = im.resize((tam, tam), Image.LANCZOS)
    im.convert("RGBA").save(OUT / nombre, optimize=True)

grande = icono(1024, 1.0)
guardar(grande, "imagen_app_1024.png")
guardar(grande, "icon-512.png", 512); guardar(grande, "icon-192.png", 192)
guardar(grande, "apple-touch-icon.png", 180); guardar(grande, "favicon.png", 64)
guardar(icono(1024, 0.80), "icon-maskable-512.png", 512)

# Imagen para compartir el enlace (WhatsApp, correo): 1200 × 630
og = fondo(1200, 630); d = ImageDraw.Draw(og, "RGBA")
sistema(og, 935, 315, 520, 310)
fg = ImageFont.truetype(FUENTE, 56); fp = ImageFont.truetype(FUENTE.replace("-Bold", ""), 25); fs = ImageFont.truetype(FUENTE, 22)
d.text((70, 190), "Sistema de PQRS", font=fg, fill="white")
d.text((70, 268), "Peticiones · Quejas · Reclamos · Sugerencias", font=fp, fill=(255, 255, 255, 215))
d.text((70, 330), "SIAU · MiRed Barranquilla IPS", font=fs, fill=(254, 220, 0, 255))
for i, c in enumerate(["#006081", "#E20A31", "#FEDC00", "#009C4D"]):
    d.rectangle((i * 300, 618, i * 300 + 300, 630), fill=c)
og.convert("RGB").save(OUT / "og.png", optimize=True)
print("imágenes de la app en", OUT)
