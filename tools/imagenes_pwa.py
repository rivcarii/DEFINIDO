"""Imágenes de la app (íconos, favicon, imagen para compartir): medalla dorada del SIAU sobre fondo azul MiRed con la franja de la marca.
Uso: python3 tools/imagenes_pwa.py   (requiere Pillow)
Genera en assets/pwa/: icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png (180), favicon.png (64), og.png (1200x630), imagen_app_1024.png"""
import math, pathlib
from PIL import Image, ImageDraw, ImageFilter, ImageFont

R = pathlib.Path(__file__).resolve().parents[1]
OUT = R / "assets" / "pwa"
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


MEDALLA = Image.open(R / "assets" / "siau" / "Medalla_SIAU_dorada.png").convert("RGBA")
MEDALLA = MEDALLA.crop(MEDALLA.getbbox())

def icono(n, escala=1.0, redondo=False):
    """Ícono de la app: medalla dorada del SIAU sobre fondo azul MiRed, con halo claro y la franja roja · amarilla · verde de la marca."""
    im = fondo(n, n)
    d = ImageDraw.Draw(im, "RGBA")
    c = n / 2
    # halo claro detrás de la medalla
    halo = Image.new("RGBA", (n, n), (0, 0, 0, 0)); hd = ImageDraw.Draw(halo)
    r = n * 0.40 * escala
    hd.ellipse((c - r, c - r * 1.02, c + r, c + r * 0.98), fill=(255, 255, 255, 34))
    im.alpha_composite(halo.filter(ImageFilter.GaussianBlur(n * 0.012)))
    r2 = n * 0.43 * escala
    anillo = Image.new("RGBA", (n, n), (0, 0, 0, 0)); ImageDraw.Draw(anillo).ellipse((c - r2, c - r2, c + r2, c + r2), outline=(255, 255, 255, 60), width=max(1, int(n / 200)))
    im.alpha_composite(anillo)
    # los tres puntos de la marca MiRed (rojo, verde y amarillo) orbitando sobre el anillo
    for col, ang in [(XROJO, 52), (XVERDE, 196), (XAMA, 306)]:
        px = c + math.cos(math.radians(ang)) * r2; py = c - math.sin(math.radians(ang)) * r2; pr = n * 0.052 * escala
        punto = Image.new("RGBA", (n, n), (0, 0, 0, 0)); pd = ImageDraw.Draw(punto)
        pd.ellipse((px - pr * 1.35, py - pr * 1.35, px + pr * 1.35, py + pr * 1.35), fill=(255, 255, 255, 235))
        pd.ellipse((px - pr, py - pr, px + pr, py + pr), fill=col)
        im.alpha_composite(punto)
    # medalla (sin deformar)
    alto = n * 0.56 * escala
    m = MEDALLA.resize((round(MEDALLA.width * alto / MEDALLA.height), round(alto)), Image.LANCZOS)
    sombra = Image.new("RGBA", (n, n), (0, 0, 0, 0)); sombra.paste((0, 0, 0, 90), (round(c - m.width / 2), round(c - m.height / 2 + n * 0.015)), m)
    im.alpha_composite(sombra.filter(ImageFilter.GaussianBlur(n * 0.012)))
    im.alpha_composite(m, (round(c - m.width / 2), round(c - m.height / 2 - n * 0.005)))
    # franja de la marca al pie (en el ícono «maskable» queda dentro de la zona segura)
    h = max(3, round(n * 0.045 * escala)); y0 = round(c + n * 0.5 * escala - h) if escala < 1 else n - h
    for i, (col, x0, x1) in enumerate([("#006081", 0, .55), (XROJO, .55, .70), (XAMA, .70, .85), (XVERDE, .85, 1)]):
        d.rectangle((round(n * x0), y0, round(n * x1), y0 + h), fill=col)
    return im

XROJO, XAMA, XVERDE = "#E20A31", "#FEDC00", "#009C4D"

def guardar(im, nombre, tam=None):
    if tam: im = im.resize((tam, tam), Image.LANCZOS)
    im.convert("RGBA").save(OUT / nombre, optimize=True)

grande = icono(1024, 1.0)
guardar(grande, "imagen_app_1024.png")
guardar(grande, "icon-512.png", 512); guardar(grande, "icon-192.png", 192)
guardar(grande, "apple-touch-icon.png", 180)
# favicon: sin puntos ni anillo (a 16–32 px no se distinguirían): medalla grande sobre azul con la franja de la marca
fav = fondo(256, 256); m = MEDALLA.resize((round(MEDALLA.width * 190 / MEDALLA.height), 190), Image.LANCZOS)
fav.alpha_composite(m, ((256 - m.width) // 2, 24)); fd = ImageDraw.Draw(fav)
for col, x0, x1 in [("#006081", 0, .55), (XROJO, .55, .70), (XAMA, .70, .85), (XVERDE, .85, 1)]: fd.rectangle((round(256 * x0), 238, round(256 * x1), 256), fill=col)
fav.resize((64, 64), Image.LANCZOS).save(OUT / "favicon.png", optimize=True)
guardar(icono(1024, 0.80), "icon-maskable-512.png", 512)

# Imagen para compartir el enlace (WhatsApp, correo): 1200 × 630
og = fondo(1200, 630); d = ImageDraw.Draw(og, "RGBA")
ic = icono(1024, 1.0).resize((430, 430), Image.LANCZOS)
mask = Image.new("L", (430, 430), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, 429, 429), 86, fill=255)
og.paste(ic, (690, 100), mask)
fg = ImageFont.truetype(FUENTE, 56); fp = ImageFont.truetype(FUENTE.replace("-Bold", ""), 25); fs = ImageFont.truetype(FUENTE, 22)
d.text((70, 190), "Sistema de PQRS", font=fg, fill="white")
d.text((70, 268), "Peticiones · Quejas · Reclamos · Sugerencias", font=fp, fill=(255, 255, 255, 215))
d.text((70, 330), "SIAU · MiRed Barranquilla IPS", font=fs, fill=(254, 220, 0, 255))
for i, c in enumerate(["#006081", "#E20A31", "#FEDC00", "#009C4D"]):
    d.rectangle((i * 300, 618, i * 300 + 300, 630), fill=c)
og.convert("RGB").save(OUT / "og.png", optimize=True)
print("imágenes de la app en", OUT)
