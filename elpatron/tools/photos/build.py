"""Cut the El Patron burgers and logo out of the restaurant's own menu screenshots (tools/photos/src).

Per burger: crop, upscale with Real-ESRGAN x4 (tiled, CPU), remove the black background with
rembg (isnet), keep the main object (burger on its board; drops menu text the matting picked up),
trim, centre on a transparent square and save WebP in two sizes. The logo is gold on black, so its
alpha comes from luminance instead of matting.

  pip install rembg onnxruntime opencv-python-headless pillow numpy
  python3 elpatron/tools/photos/build.py <RealESRGAN_x4.onnx>
  python3 elpatron/tools/photos/build.py --manifest-only   # rewrite photos.json from the saved WebPs
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort
from PIL import Image
from rembg import new_session, remove

HERE = Path(__file__).resolve().parent
SRC = HERE / 'src'
OUT = HERE.parents[1] / 'public' / 'photos'
OUT.mkdir(parents=True, exist_ok=True)

# Boxes in the 1170x2532 screenshots.
BURGERS = {
    'cardapio-chefoes.png': {
        'el-patron': (190, 481, 684, 836),
        'al-capone': (532, 855, 1019, 1158),
        'ochoa': (190, 1190, 646, 1500),
        'el-chapo': (563, 1519, 1013, 1823),
        'abadia': (190, 1848, 665, 2171),
    },
    'cardapio-especiais.png': {
        'dimas': (525, 570, 975, 899),
        'velasquez': (171, 994, 671, 1393),
        'nomura': (494, 1456, 962, 1798),
        'lucchese': (215, 1874, 652, 2178),
    },
}
LOGO = ('perfil.png', (430, 652, 741, 792))


def upscale(sess, img, tile=192, pad=12):
    h, w, _ = img.shape
    out = np.zeros((h * 4, w * 4, 3), np.float32)
    x = img.astype(np.float32) / 255.0
    for y0 in range(0, h, tile):
        for x0 in range(0, w, tile):
            ya, xa = max(0, y0 - pad), max(0, x0 - pad)
            yb, xb = min(h, y0 + tile + pad), min(w, x0 + tile + pad)
            res = sess.run(None, {'input': x[ya:yb, xa:xb].transpose(2, 0, 1)[None]})[0][0].transpose(1, 2, 0)
            cy, cx = (y0 - ya) * 4, (x0 - xa) * 4
            th, tw = min(tile, h - y0) * 4, min(tile, w - x0) * 4
            out[y0 * 4:y0 * 4 + th, x0 * 4:x0 * 4 + tw] = res[cy:cy + th, cx:cx + tw]
    return Image.fromarray((np.clip(out, 0, 1) * 255).round().astype(np.uint8))


def main_object(rgba):
    """Keep the largest opaque blob plus anything resting inside its box (chillies, crumbs)."""
    a = np.asarray(rgba.getchannel('A'))
    n, lab, stats, _ = cv2.connectedComponentsWithStats((a > 24).astype(np.uint8), 8)
    if n <= 2:
        return rgba
    big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    x, y, w, h = stats[big, :4]
    keep = np.zeros_like(a, dtype=bool)
    for i in range(1, n):
        cx, cy, cw, ch, area = stats[i]
        inside = cx >= x and cy >= y and cx + cw <= x + w and cy + ch <= y + h
        if i == big or (inside and area > 200):
            keep |= lab == i
    out = np.asarray(rgba).copy()
    out[..., 3] = np.where(keep, out[..., 3], 0)
    return Image.fromarray(out)


def place(rgba, canvas, pad=0.04):
    box = rgba.getbbox()
    rgba = rgba.crop(box)
    side = int(max(rgba.size) * (1 + 2 * pad))
    sq = Image.new('RGBA', (side, side))
    sq.paste(rgba, ((side - rgba.width) // 2, (side - rgba.height) // 2))
    return sq.resize((canvas, canvas), Image.LANCZOS)


def save(img, name, sizes):
    for label, size in sizes:
        im = img if img.width == size else img.resize((size, round(img.height * size / img.width)), Image.LANCZOS)
        im.save(OUT / f'{name}{label}.webp', quality=86, method=6)


def entry(key):
    """Manifest entry; `box` is the burger's opaque bounds in % of the square, used to line the photo up with the 3D layers."""
    im = Image.open(OUT / f'{key}.webp')
    x0, y0, x1, y1 = im.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox()
    pct = lambda v: round(v / im.width * 100, 3)
    return {'src': f'/photos/{key}.webp', 'srcSm': f'/photos/{key}.sm.webp', 'size': im.width,
            'box': {'x': pct(x0), 'y': pct(y0), 'w': pct(x1 - x0), 'h': pct(y1 - y0)}}


def main():
    manifest = {'note': "Cut from the restaurant's own menu (tools/photos/src), upscaled and background removed.", 'items': {}}
    if sys.argv[1] == '--manifest-only':
        for items in BURGERS.values():
            for key in items:
                manifest['items'][key] = entry(key)
        logo = Image.open(OUT / 'logo.webp')
        manifest['logo'] = {'src': '/photos/logo.webp', 'w': logo.width, 'h': logo.height}
        (HERE.parents[1] / 'src' / 'content' / 'photos.json').write_text(json.dumps(manifest, indent=1) + '\n')
        return
    sr = ort.InferenceSession(sys.argv[1], providers=['CPUExecutionProvider'])
    seg = new_session('isnet-general-use')
    for file, items in BURGERS.items():
        sheet = np.asarray(Image.open(SRC / file).convert('RGB'))
        for key, (x0, y0, x1, y1) in items.items():
            up = upscale(sr, sheet[y0:y1, x0:x1])
            cut = main_object(remove(up, session=seg))
            sq = place(cut, 1200)
            save(sq, key, (('', 1200), ('.sm', 480)))
            manifest['items'][key] = entry(key)
            print(key, up.size)

    file, (x0, y0, x1, y1) = LOGO
    logo = upscale(sr, np.asarray(Image.open(SRC / file).convert('RGB'))[y0:y1, x0:x1])
    a = np.asarray(logo, dtype=np.float32)
    # gold on near-black: brightness becomes opacity, colour is kept un-premultiplied
    alpha = np.clip((a.max(axis=2) - 28) / 120, 0, 1)
    rgba = np.dstack([a, alpha * 255]).astype(np.uint8)
    logo = Image.fromarray(rgba)
    logo = logo.crop(logo.getbbox())
    save(logo, 'logo', (('', min(1200, logo.width)),))
    manifest['logo'] = {'src': '/photos/logo.webp', 'w': min(1200, logo.width), 'h': round(logo.height * min(1200, logo.width) / logo.width)}
    (HERE.parents[1] / 'src' / 'content' / 'photos.json').write_text(json.dumps(manifest, indent=1) + '\n')
    print('logo', logo.size)


if __name__ == '__main__':
    main()
