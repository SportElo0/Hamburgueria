# Grades the four source photos the same way (warm, gentle contrast) and writes responsive WebP sizes.
# Usage: python3 scripts/images.py <source-dir>
import sys
from pathlib import Path
from PIL import Image, ImageEnhance

SRC = Path(sys.argv[1])
OUT = Path(__file__).resolve().parent.parent / 'public' / 'img'
# name -> (saturation, contrast, warmth); the pool photo is oversaturated cyan, so it is pulled back
PHOTOS = {
    'fachada': ('hero-fachada.jpg', 1.0, 1.04, 0.0),
    'piscina': ('piscina.jpg', 0.82, 1.03, 0.05),
    'quarto-verde': ('quarto-verde.jpg', 0.95, 1.05, 0.04),
    'quarto-amarelo': ('quarto-amarelo.jpg', 0.92, 1.05, 0.02),
}

def warm(im, amount):
    if not amount:
        return im
    r, g, b = im.split()
    r = r.point(lambda v: min(255, int(v * (1 + amount))))
    b = b.point(lambda v: int(v * (1 - amount)))
    return Image.merge('RGB', (r, g, b))

for name, (file, sat, con, w) in PHOTOS.items():
    im = Image.open(SRC / file).convert('RGB')
    im = ImageEnhance.Color(im).enhance(sat)
    im = ImageEnhance.Contrast(im).enhance(con)
    im = warm(im, w)
    # -960 for phones, -1600 for laptops (when the source is that big), -full at source size
    for label, width in (('960', 960), ('1600', 1600), ('full', im.width)):
        if width > im.width:
            continue
        h = round(im.height * width / im.width)
        im.resize((width, h), Image.LANCZOS).save(OUT / f'{name}-{label}.webp', quality=80, method=6)
    print(name, im.size)
