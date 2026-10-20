"""Clean up the four pousada photos into high-resolution masters.

Per photo: upscale with Real-ESRGAN x4 (tiled, CPU), downsample to the target size, level the
verticals measured from the photo's own door and window frames, neutralise the white balance,
pull back oversaturated hues, lift shadows with local contrast (CLAHE on lightness), then a
light unsharp mask. Writes JPEG masters to pousada/assets/photos/ and a before/after sheet.

  pip install onnxruntime opencv-python-headless pillow numpy
  python3 pousada/scripts/enhance.py <source-dir> <RealESRGAN_x4.onnx> [cache-dir]

Real-ESRGAN alone paints water, skies and plaster, so its output is blended with a plain
Lanczos upscale (mix per photo, 0 = Lanczos only). Gray-world white balance is skipped on the
warm photos: their warm light is the point of them.
"""
import sys
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort
from PIL import Image

SRC = Path(sys.argv[1])
MODEL = sys.argv[2]
CACHE = Path(sys.argv[3]) if len(sys.argv) > 3 else None
OUT = Path(__file__).resolve().parent.parent / 'assets' / 'photos'
OUT.mkdir(parents=True, exist_ok=True)
LONG_SIDE = 3200
INPUT_CAP = 1200

# file, saturation multipliers per hue band (OpenCV hue 0-180), CLAHE clip, max auto-rotation (deg),
# share of Real-ESRGAN in the upscale, gray-world white balance strength
PHOTOS = {
    'fachada': ('hero-fachada.jpg', {}, 1.3, 0.0, 0.0, 0.0),  # dusk sky is the subject: no ESRGAN, no white balance
    'piscina': ('piscina.jpg', {(80, 105): 0.86}, 1.15, 1.5, 0.35, 0.0),  # cyan water, smallest source
    'quarto-verde': ('quarto-verde.jpg', {}, 1.3, 2.0, 0.35, 0.4),
    'quarto-amarelo': ('quarto-amarelo.jpg', {(18, 34): 0.9}, 1.2, 2.0, 0.3, 0.0),  # keep the warm walls
}


def upscale(sess, img, tile=192, pad=12):
    """Real-ESRGAN x4 over overlapping tiles so memory stays flat on large photos."""
    h, w, _ = img.shape
    out = np.zeros((h * 4, w * 4, 3), np.float32)
    x = img.astype(np.float32) / 255.0
    for y0 in range(0, h, tile):
        for x0 in range(0, w, tile):
            ya, xa = max(0, y0 - pad), max(0, x0 - pad)
            yb, xb = min(h, y0 + tile + pad), min(w, x0 + tile + pad)
            patch = x[ya:yb, xa:xb].transpose(2, 0, 1)[None]
            res = sess.run(None, {'input': patch})[0][0].transpose(1, 2, 0)
            cy, cx = (y0 - ya) * 4, (x0 - xa) * 4
            th, tw = min(tile, h - y0) * 4, min(tile, w - x0) * 4
            out[y0 * 4:y0 * 4 + th, x0 * 4:x0 * 4 + tw] = res[cy:cy + th, cx:cx + tw]
    return (np.clip(out, 0, 1) * 255).round().astype(np.uint8)


def vertical_tilt(img, limit):
    """Median deviation from vertical of long, near-vertical edges (door frames, windows)."""
    if not limit:
        return 0.0
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    edges = cv2.Canny(gray, 60, 160)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 720, 120, minLineLength=img.shape[0] // 6, maxLineGap=8)
    if lines is None:
        return 0.0
    angles = []
    for x1, y1, x2, y2 in lines.reshape(-1, 4):
        a = np.degrees(np.arctan2(x2 - x1, y2 - y1))
        a = (a + 90) % 180 - 90
        if abs(a) < limit:
            angles.append(a)
    return float(np.median(angles)) if len(angles) >= 4 else 0.0


def rotate_crop(img, deg):
    if abs(deg) < 0.15:
        return img
    h, w = img.shape[:2]
    m = cv2.getRotationMatrix2D((w / 2, h / 2), -deg, 1.0)
    rot = cv2.warpAffine(img, m, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    r = np.radians(abs(deg))  # largest axis-aligned crop free of reflected borders
    cw = int((w * np.cos(r) - h * np.sin(r)) / (np.cos(2 * r) or 1))
    ch = int((h * np.cos(r) - w * np.sin(r)) / (np.cos(2 * r) or 1))
    cw, ch = min(w, abs(cw)), min(h, abs(ch))
    y0, x0 = (h - ch) // 2, (w - cw) // 2
    return rot[y0:y0 + ch, x0:x0 + cw]


def white_balance(img, strength=0.6):
    """Partial gray-world on mid-tones: removes casts without bleaching warm light."""
    f = img.astype(np.float32)
    lum = f.mean(axis=2)
    mask = (lum > 40) & (lum < 220)
    means = f[mask].mean(axis=0)
    gain = 1 + strength * (means.mean() / means - 1)
    return np.clip(f * gain, 0, 255).astype(np.uint8)


def tame_hues(img, bands):
    if not bands:
        return img
    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV).astype(np.float32)
    for (lo, hi), k in bands.items():
        sel = (hsv[..., 0] >= lo) & (hsv[..., 0] <= hi)
        hsv[..., 1][sel] *= k
    return cv2.cvtColor(np.clip(hsv, 0, 255).astype(np.uint8), cv2.COLOR_HSV2RGB)


def tone(img, clip):
    lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    l2 = cv2.createCLAHE(clipLimit=clip, tileGridSize=(8, 8)).apply(l)
    l = cv2.addWeighted(l, 0.45, l2, 0.55, 0)  # blend: local contrast without the HDR look
    return cv2.cvtColor(cv2.merge((l, a, b)), cv2.COLOR_LAB2RGB)


def sharpen(img, amount=0.35, radius=1.2):
    blur = cv2.GaussianBlur(img, (0, 0), radius)
    return cv2.addWeighted(img, 1 + amount, blur, -amount, 0)


def main():
    sess = ort.InferenceSession(MODEL, providers=['CPUExecutionProvider'])
    pairs = []
    for name, (file, bands, clip, limit, mix, wb) in PHOTOS.items():
        src = np.asarray(Image.open(SRC / file).convert('RGB'))
        # x4 from a 1200px input lands near the 3200px target with headroom to supersample down;
        # feeding the full 2000px source would only cost minutes for detail thrown away below.
        k = min(1.0, INPUT_CAP / max(src.shape[:2]))
        small = cv2.resize(src, None, fx=k, fy=k, interpolation=cv2.INTER_AREA) if k < 1 else src
        size = (round(src.shape[1] * LONG_SIDE / max(src.shape[:2])), round(src.shape[0] * LONG_SIDE / max(src.shape[:2])))
        img = cv2.resize(src, size, interpolation=cv2.INTER_LANCZOS4)
        if mix:
            cached = CACHE / f'{name}-x4.png' if CACHE else None
            if cached and cached.exists():
                up = np.asarray(Image.open(cached).convert('RGB'))
            else:
                up = upscale(sess, small)
                if cached:
                    CACHE.mkdir(parents=True, exist_ok=True)
                    Image.fromarray(up).save(cached)
            up = cv2.resize(up, size, interpolation=cv2.INTER_AREA)
            img = cv2.addWeighted(up, mix, img, 1 - mix, 0)
        tilt = vertical_tilt(img, limit)
        img = rotate_crop(img, tilt)
        if wb:
            img = white_balance(img, wb)
        img = tame_hues(img, bands)
        img = tone(img, clip)
        img = sharpen(img)
        Image.fromarray(img).save(OUT / f'{name}.jpg', quality=90, optimize=True, progressive=True)
        print(f'{name}: {src.shape[1]}x{src.shape[0]} -> {img.shape[1]}x{img.shape[0]}, levelled {tilt:+.2f} deg')
        pairs.append((src, img))

    # before/after sheet, same height per row
    rows = []
    for before, after in pairs:
        h = 520
        b = cv2.resize(before, (int(before.shape[1] * h / before.shape[0]), h), interpolation=cv2.INTER_AREA)
        a = cv2.resize(after, (int(after.shape[1] * h / after.shape[0]), h), interpolation=cv2.INTER_AREA)
        rows.append(np.hstack([b, np.full((h, 16, 3), 255, np.uint8), a]))
    width = max(r.shape[1] for r in rows)
    rows = [np.hstack([r, np.full((r.shape[0], width - r.shape[1], 3), 255, np.uint8)]) for r in rows]
    sheet = np.vstack([np.vstack([r, np.full((16, width, 3), 255, np.uint8)]) for r in rows])
    Image.fromarray(sheet).save(OUT.parent / 'antes-depois.jpg', quality=85)


if __name__ == '__main__':
    main()
