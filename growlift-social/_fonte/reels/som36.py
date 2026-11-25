# Som do Reel 36 "A skill que acha as outras": clima de trailer, tudo sintetizado aqui (sem samples, sem música de
# terceiros). Grave de fundo e coração (0-2 s), subida + contador + BRAAM no 4.500.000 (4,55 s), três impactos com
# "glitch" nos X (5-8 s), estrondo no "ELA ACHA" (8,85), silêncio total (9,7-11), vento e sussurros no labirinto,
# radar na varredura (17-21), subida de tensão, corte seco e explosão de luz (22,6), fechamento com clique no SKILL.
# A narração entra depois por cima (o som já deixa espaço nos médios).
#   python3 som36.py && ffmpeg -y -i som-36.wav -b:a 192k som-36.mp3
import numpy as np, wave

SR = 48000
DUR = 30.0
N = int(SR * DUR)
t = np.arange(N) / SR
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(36)


def add(sig, start, pan=0.0, gain=1.0):
    i = int(start * SR); j = min(N, i + len(sig))
    if j <= i: return
    s = sig[: j - i] * gain
    L[i:j] += s * (1 - max(0, pan)); R[i:j] += s * (1 + min(0, pan))


def tt(d): return np.arange(int(d * SR)) / SR


def env(n, a=0.005, d=0.2):
    x = np.arange(n) / SR
    return np.minimum(1, x / max(a, 1e-4)) * np.exp(-x / d)


def lp(x, cutoff):
    # filtro passa-baixa simples no domínio da frequência
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, len(x))


def bp(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= ((f > lo) & (f < hi))
    return np.fft.irfft(X, len(x))


def reverb(x, secs=2.5, mix=0.35):
    n = int(secs * SR)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR / (secs / 5))
    ir = lp(ir, 5000); ir /= np.sqrt(np.sum(ir ** 2))
    m = len(x) + n
    y = np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m), m)
    out = np.zeros(m); out[: len(x)] += x * (1 - mix); out += y * mix
    return out


def saw(f, d):
    x = tt(d); return 2 * ((x * f) % 1) - 1


def boom(d=1.6, f0=70, f1=32):
    x = tt(d); f = f1 + (f0 - f1) * np.exp(-x * 9)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-x * 2.2) * np.minimum(1, x / 0.004)


def braam(d=3.2):
    x = tt(d)
    s = sum(saw(fr, d) * w for fr, w in [(49, 1), (49.3, .8), (73.5, .6), (98, .5), (36.7, .7)])
    s = lp(s, 700) * np.minimum(1, x / 0.03) * np.exp(-x * 0.9)
    s = s / np.max(np.abs(s)); b = boom(min(d, 2.2)); s[: len(b)] += b * 0.9
    return s


def impact(d=1.4):
    n = int(d * SR); x = tt(d)
    noise = lp(rng.standard_normal(n), 2500) * np.exp(-x * 12)
    ring = np.sin(2 * np.pi * 340 * x) * np.exp(-x * 5) * .25 + np.sin(2 * np.pi * 517 * x) * np.exp(-x * 7) * .15
    return boom(d, 90, 38) + noise * .8 + ring


def glitch(d=0.22):
    n = int(d * SR)
    s = rng.standard_normal(n); s = np.round(s * 3) / 3  # "bitcrush"
    gate = (np.floor(np.arange(n) / (SR * 0.018)) % 2)
    tone = np.sign(np.sin(2 * np.pi * 1800 * tt(d))) * .3
    return (bp(s, 800, 9000) * .6 + tone) * gate * np.exp(-tt(d) * 6)


def whoosh(d=0.9, up=True):
    n = int(d * SR); x = tt(d)
    e = np.sin(np.pi * np.clip(x / d, 0, 1)) ** 2
    s = bp(rng.standard_normal(n), 300, 6000) * e
    return s if up else s[::-1]


def riser(d, f0=60, f1=900):
    x = tt(d); f = f0 * (f1 / f0) ** (x / d)
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = (np.sin(ph) + .5 * np.sin(2 * ph) + .3 * np.sin(3.01 * ph)) * (x / d) ** 2
    noise = bp(rng.standard_normal(len(x)), 1500, 9000) * (x / d) ** 3
    return tone * .35 + noise * .5


# ---------------- 0-2 s: grave de fundo + coração
drone = (np.sin(2 * np.pi * 41 * t) + .5 * np.sin(2 * np.pi * 41.3 * t) + .25 * np.sin(2 * np.pi * 82.2 * t))
g = np.interp(t, [0, .5, 2.0, 2.05, 4.5, 4.55, 9.6, 9.7, 11.0, 12, 17, 21.9, 21.95, 22.6, 25, 29, 30],
              [0, .5, .6, .4, .6, .3, .35, 0, 0, .35, .45, .7, 0, .4, .3, .25, 0])
L += drone * .16 * g; R += drone * .16 * g
for s in [0.15, 1.05]:
    for k, gg in [(0, 1), (0.22, .7)]:
        add(boom(.5, 60, 40), s + k, gain=.75 * gg)

# ---------------- 2-4.55: subida + contador
add(whoosh(0.6), 1.75, gain=.6)
add(riser(2.5, 70, 1100), 2.05, gain=.8)
x = 2.1; gap = 0.16
while x < 4.5:
    add(np.sin(2 * np.pi * 2400 * tt(.012)) * env(int(.012 * SR), .0005, .003), x, pan=rng.uniform(-.4, .4), gain=.25)
    x += gap; gap = max(0.035, gap * 0.9)
br = reverb(braam(3.0), 3.0, .4)
add(br, 4.55, gain=1.0)

# ---------------- 5-8.75: três impactos + glitch nos X
for a in [5.0, 6.2, 7.4]:
    add(reverb(impact(1.0), 1.8, .35), a, gain=.8)
    add(glitch(), a + .45, pan=rng.uniform(-.5, .5), gain=.55)
    add(whoosh(.35, up=False), a - .3, gain=.35)

# ---------------- 8.85: ELA ACHA (subida invertida + estrondo); 9.7 corte seco
rev = whoosh(.7)[::-1] * np.linspace(0, 1, int(.7 * SR)) ** 2
add(rev, 8.15, gain=.7)
add(reverb(braam(1.2), 1.0, .3)[: int(.85 * SR)], 8.85, gain=.9)

# ---------------- 11-17: labirinto (vento, sussurros, metais distantes)
wind = lp(rng.standard_normal(N), 900) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.23 * t))
wg = np.interp(t, [11, 12, 17, 21.9, 21.95], [0, .5, .6, .8, 0]) * (t >= 11)
L += wind * .22 * wg; R += np.roll(wind, 2400) * .22 * wg
for k in range(14):
    s = 11.5 + k * 0.42 + rng.uniform(0, .2)
    if s > 16.8: break
    d = rng.uniform(.25, .5); n = int(d * SR)
    wsp = bp(rng.standard_normal(n), 2200, 6500) * np.sin(np.pi * np.arange(n) / n) ** 2 * (0.6 + .4 * np.sin(2 * np.pi * rng.uniform(5, 9) * tt(d)))
    add(reverb(wsp, 1.2, .5), s, pan=rng.uniform(-.9, .9), gain=.16)
for s in [12.3, 14.6]:
    add(reverb(impact(1.2), 2.5, .6), s, pan=rng.uniform(-.6, .6), gain=.25)
add(whoosh(1.2), 10.9, gain=.5)

# ---------------- 17-21.2: radar
for k, s in enumerate(np.arange(17.0, 21.2, 0.7)):
    ping = np.sin(2 * np.pi * 1320 * tt(.6)) * env(int(.6 * SR), .002, .12)
    add(reverb(ping, 1.0, .45), s, pan=-.7 + 1.4 * (k / 6), gain=.3)
sweep = whoosh(4.2)
add(sweep * np.linspace(1, .3, len(sweep)), 17.0, pan=-.5, gain=.4)
add(sweep[::-1] * np.linspace(.3, 1, len(sweep)), 17.0, pan=.5, gain=.4)

# ---------------- 19.3-21.95: tensão subindo, corte seco; 22.6: explosão de luz
add(riser(2.6, 50, 1600), 19.3, gain=.9)
cut = int(21.95 * SR)
L[cut:int(22.6 * SR)] = 0; R[cut:int(22.6 * SR)] = 0
add(reverb(braam(3.5), 3.5, .45), 22.6, gain=1.05)
for k in range(16):
    s = 22.65 + rng.uniform(0, 1.8)
    ch = np.sin(2 * np.pi * rng.choice([1568, 2093, 2637, 3136]) * tt(.9)) * env(int(.9 * SR), .002, .25)
    add(reverb(ch, 1.5, .5), s, pan=rng.uniform(-.9, .9), gain=.07)

# ---------------- 25-30: fechamento (pad + clique no SKILL + digitação + publicar)
pad = sum(np.sin(2 * np.pi * f * tt(5)) for f in [110, 164.8, 220, 277.2]) * np.minimum(1, tt(5) / 1.2) * np.exp(-tt(5) * .25)
add(lp(pad, 1800), 25.0, gain=.06)
add(whoosh(.5), 25.0, gain=.4)
add(np.sin(2 * np.pi * 880 * tt(.25)) * env(int(.25 * SR), .001, .05) + boom(.25, 120, 60) * .4, 26.6, gain=.45)
for k in range(5):
    add(bp(rng.standard_normal(int(.02 * SR)), 2000, 8000) * env(int(.02 * SR), .0005, .004), 27.6 + k * .14, gain=.35)
add(np.sin(2 * np.pi * 1760 * tt(.5)) * env(int(.5 * SR), .001, .12), 28.4, gain=.18)

# ---------------- saída
fade = np.clip((DUR - t) / 1.2, 0, 1)
mix = np.stack([L * fade, R * fade], axis=1)
mix /= np.max(np.abs(mix)) / 0.89
pcm = (mix * 32767).astype(np.int16)
with wave.open('som-36.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('som-36.wav', DUR, 's')
