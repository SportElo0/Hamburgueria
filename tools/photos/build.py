"""Cut the food illustrations out of the photographed printed menu (tools/photos/menu.jpg).

Per item: level the local tilt of the hand-held menu, neutralise the paper colour, upscale
(Real-ESRGAN x4, blended with Lanczos on the tiny thumbnails to keep it from looking painted),
remove the paper background (rembg / isnet), keep the main object, and centre it on a
transparent square canvas.

  pip install rembg onnxruntime pillow numpy
  python3 tools/photos/build.py <RealESRGAN_x4.onnx>
"""
import json, sys
from pathlib import Path
import numpy as np
import onnxruntime as ort
from PIL import Image, ImageEnhance, ImageFilter
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public' / 'photos'
SRC = Image.open(Path(__file__).with_name('menu.jpg')).convert('RGB')

# Bounding boxes in menu.jpg (1600x1200) and the canvas each asset is placed on.
ITEMS = {
    # The large burger at the top of the menu: two patties, cheese, bacon, lettuce, red onion = Holyfield.
    'holyfield': ((335, 45, 645, 300), 1200),
    'downtown-classic': ((808, 412, 918, 512), 900),
    'the-bacon-street': ((798, 503, 908, 606), 900),
    'australian-cheddar': ((792, 598, 898, 702), 900),
    'kill-bill': ((783, 692, 892, 802), 900),
    'golden-chicken': ((1172, 452, 1272, 556), 900),
    'green-burger': ((1152, 648, 1262, 756), 900),
    'little-downtown': ((1152, 742, 1262, 842), 900),
    'bacon-cheddar-fries': ((212, 338, 345, 472), 900),
    'croc-canoa': ((198, 462, 345, 568), 900),
    'downtown-nuggets': ((196, 562, 328, 668), 900),
    'classic-fries': ((192, 652, 322, 792), 900),
    'refrigerante': ((192, 802, 308, 1028), 700),
    'long-neck': ((1003, 832, 1072, 1022), 700),
    'brownie': ((1078, 842, 1212, 978), 900),
    'milkshake': ((1368, 838, 1468, 1032), 900),
}

# Local tilt of the curved, hand-held menu (degrees by y), measured from its printed rules.
YS, AS = [0, 150, 300, 450, 600, 750, 900, 1100], [10.7, 9.0, 7.5, 5.0, 4.5, 2.2, 0.0, 0.0]


def upscale(sr, im):
    x = (np.asarray(im, dtype=np.float32) / 255.0).transpose(2, 0, 1)[None]
    y = sr.run(None, {'input': x})[0][0].transpose(1, 2, 0)
    return Image.fromarray((np.clip(y, 0, 1) * 255).round().astype(np.uint8))


def balance(im):
    a = np.asarray(im, dtype=np.float32)
    edge = np.concatenate([a[:4].reshape(-1, 3), a[-4:].reshape(-1, 3), a[:, :4].reshape(-1, 3), a[:, -4:].reshape(-1, 3)])
    gain = np.clip(np.array([244, 236, 218], np.float32) / np.maximum(np.median(edge, axis=0), 1), 0.8, 1.35)
    return Image.fromarray(np.clip(a * gain, 0, 255).astype(np.uint8))


def main_object(rgba):
    """Keep the largest opaque blob (drops printed text the matting picked up)."""
    import cv2
    a = np.asarray(rgba.getchannel('A'))
    n, lab, stats, _ = cv2.connectedComponentsWithStats((a > 24).astype(np.uint8), 8)
    if n <= 2:
        return rgba
    big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    x, y, w, h = stats[big, :4]
    keep = np.zeros_like(a, dtype=bool)
    for i in range(1, n):
        cx, cy, cw, ch, area = stats[i]
        inside = cx >= x - w * 0.05 and cy >= y - h * 0.05 and cx + cw <= x + w * 1.05 and cy + ch <= y + h * 1.05
        if i == big or (inside and area > 30):
            keep |= lab == i
    out = np.asarray(rgba).copy()
    out[..., 3] = np.where(keep, out[..., 3], 0)
    return Image.fromarray(out)


def build(sr, seg, key, box, canvas, pad=14):
    x0, y0, x1, y1 = box
    c = SRC.crop((x0 - pad, y0 - pad, x1 + pad, y1 + pad)).rotate(float(np.interp((y0 + y1) / 2, YS, AS)), resample=Image.BICUBIC)
    c = balance(c.crop((pad, pad, c.width - pad, c.height - pad)))
    up = upscale(sr, c)
    if max(c.size) < 200:  # thumbnails: tame the hallucinated texture
        soft = c.resize(up.size, Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=3, percent=90, threshold=2))
        up = Image.blend(up, soft, 0.5)
    up = ImageEnhance.Color(ImageEnhance.Contrast(up).enhance(1.06)).enhance(1.12)
    cut = main_object(remove(up, session=seg, post_process_mask=True))
    cut = cut.crop(cut.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox())
    s = min(canvas * 0.86 / cut.width, canvas * 0.86 / cut.height)
    cut = cut.resize((round(cut.width * s), round(cut.height * s)), Image.LANCZOS)
    out = Image.new('RGBA', (canvas, canvas), (0, 0, 0, 0))
    out.alpha_composite(cut, ((canvas - cut.width) // 2, round(canvas * 0.93) - cut.height))
    out.save(OUT / f'{key}.webp', 'WEBP', quality=86, method=6)
    small = out.resize((canvas // 3, canvas // 3), Image.LANCZOS)
    small.save(OUT / f'{key}.sm.webp', 'WEBP', quality=84, method=6)
    a = np.asarray(out.getchannel('A')) > 24
    ys, xs = np.nonzero(a)
    return {'src': f'/photos/{key}.webp', 'srcSm': f'/photos/{key}.sm.webp', 'size': canvas,
            'box': {k: round(v * 100 / canvas, 3) for k, v in zip('xywh', (xs.min(), ys.min(), xs.max() - xs.min() + 1, ys.max() - ys.min() + 1))}}


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    sr = ort.InferenceSession(sys.argv[1], providers=['CPUExecutionProvider'])
    seg = new_session('isnet-general-use')
    manifest = {'note': 'Cut from a photo of the printed Downtown Burger menu (tools/photos/menu.jpg), upscaled and background removed.', 'items': {}}
    for key, (box, canvas) in ITEMS.items():
        manifest['items'][key] = build(sr, seg, key, box, canvas)
        print(key, manifest['items'][key]['box'], flush=True)
    (ROOT / 'src' / 'content' / 'photos.json').write_text(json.dumps(manifest, indent=2) + '\n')
