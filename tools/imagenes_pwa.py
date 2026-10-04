"""Íconos de la app instalable (PWA) a partir de la mascota del SIAU. Uso: python3 tools/imagenes_pwa.py
Genera assets/pwa/icon-192.png, icon-512.png e icon-maskable-512.png (zona segura del 80 %)."""
import pathlib
from PIL import Image, ImageDraw

R = pathlib.Path(__file__).resolve().parents[1]
mas = Image.open(R / "assets" / "mascota" / "mascota_siau.png").convert("RGBA")
busto = mas.crop((0, 0, mas.width, int(mas.height * 0.50)))          # cabeza, camiseta SIAU y megáfono

def fondo(n):
    im = Image.new("RGBA", (n, n))
    px = im.load()
    for y in range(n):
        for x in range(n):
            t = (x + y) / (2 * n)
            px[x, y] = (int(0 + 2 * t * 20), int(110 - 40 * t), int(150 - 55 * t), 255)   # #006E96 → #004A5F
    d = ImageDraw.Draw(im)
    h = max(2, n // 64)                                                    # franja de la marca al pie
    for i, c in enumerate(["#006081", "#E20A31", "#FEDC00", "#009C4D"]):
        x0 = [0, 0.55, 0.70, 0.85][i] * n; x1 = [0.55, 0.70, 0.85, 1][i] * n
        d.rectangle((x0, n - h, x1, n), fill=c)
    return im

def icono(n, escala):
    im = fondo(n)
    alto = int(n * escala)
    b = busto.resize((round(busto.width * alto / busto.height), alto), Image.LANCZOS)   # sin deformar
    im.alpha_composite(b, ((n - b.width) // 2, n - b.height - max(2, n // 64)))
    return im

out = R / "assets" / "pwa"
icono(512, 0.84).save(out / "icon-512.png", optimize=True)
icono(192, 0.84).save(out / "icon-192.png", optimize=True)
icono(512, 0.74).save(out / "icon-maskable-512.png", optimize=True)
print("íconos PWA en", out)
