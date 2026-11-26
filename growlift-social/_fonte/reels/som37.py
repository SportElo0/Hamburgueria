# Som do Reel 37: clima de jogo ao pôr do sol (synth + batida), whoosh nas trocas, impacto no "GTA 6", silêncio no
# "Sabe por quê?", notificações nas "missões completas" e moedas no fim. Tudo sintetizado aqui. Lê tempos37.json.
import numpy as np, wave, json
T = json.load(open('tempos37.json'))
SR = 48000; DUR = T['fim']; N = int(SR * DUR); t = np.arange(N) / SR
L = np.zeros(N); R = np.zeros(N); rng = np.random.default_rng(37)
def tt(d): return np.arange(int(d * SR)) / SR
def add(sig, s, pan=0, g=1.0):
    i = int(s * SR); j = min(N, i + len(sig))
    if j <= i: return
    x = sig[:j - i] * g; L[i:j] += x * (1 - max(0, pan)); R[i:j] += x * (1 + min(0, pan))
def env(d, a=.005, dec=.2): x = tt(d); return np.minimum(1, x / a) * np.exp(-x / dec)
def lp(x, c):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / (1 + (f / c) ** 4); return np.fft.irfft(X, len(x))
def kick():
    x = tt(.4); f = 45 + 110 * np.exp(-x * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 8)
def whoosh(d=.6):
    n = int(d * SR); e = np.sin(np.pi * np.arange(n) / n) ** 2; return lp(rng.standard_normal(n), 4000) * e
def ding(f=1320): return (np.sin(2*np.pi*f*tt(.6)) + .5*np.sin(2*np.pi*f*1.5*tt(.6))) * env(.6, .002, .15)
def boom(): x = tt(1.5); f = 30 + 60*np.exp(-x*8); return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-x*2.5) + lp(rng.standard_normal(len(x)),1500)*np.exp(-x*10)*.5
game = ((t < T['porque']) | ((t >= T['perdido']) & (t < T['cliente'])) | ((t >= T['prende']) & (t < T['segue'])))
phone = (t >= T['cliente']) & (t < T['prende'])
# trilha animada (128 bpm): bumbo, palmas, chimbal, baixo pulsando e um arpejo de sintetizador; some no "Sabe por quê?"
bpm = 128; beat = 60 / bpm; step = beat / 4
prog = [(110, [440, 554.4, 659.3]), (98, [392, 493.9, 587.3]), (87.3, [349.2, 440, 523.3]), (98, [392, 493.9, 622.3])]
def hat(): n = int(.05 * SR); return np.diff(np.concatenate([[0], rng.standard_normal(n)])) * np.exp(-np.arange(n) / SR / .012)
def clap(): n = int(.18 * SR); x = rng.standard_normal(n); return lp(x, 3500) * np.exp(-np.arange(n) / SR / .045)
def pluck(f, d=.16): x = tt(d); return (np.sin(2*np.pi*f*x) + .4*np.sin(4*np.pi*f*x)) * np.exp(-x * 18)
def bass(f, d=.2): x = tt(d); return (2*((x*f) % 1)-1) * np.exp(-x * 9) * .8
mute = lambda s: T['porque'] <= s < T['perdido'] - .05
i = 0; s = 0.15
while s < T['segue'] + 3.2:
    bar = int(i // 16) % 4; root, ch = prog[bar]; pos = i % 16
    level = .55 if s < T['segue'] else .35
    if not mute(s):
        if pos % 4 == 0: add(kick(), s, g=.75 * level)
        if pos in (4, 12): add(clap(), s, g=.35 * level)
        if pos % 2 == 1: add(hat(), s, pan=.3, g=.22 * level)
        if pos % 2 == 0: add(lp(bass(root), 900), s, g=.55 * level)
        add(pluck(ch[(i // 1) % 3] * (2 if pos % 8 >= 4 else 1)), s, pan=-.4 + .8 * ((i % 3) / 2), g=.13 * level)
    i += 1; s += step
for k in ['lancou', 'porque', 'perdido', 'cliente', 'prende', 'segue']: add(whoosh(), T[k] - .35, g=.45)
add(boom(), T['gta'] - .05, g=.9)
add(boom() * .7, T['lancou'] + .2, g=.6)
for k, dt in [('msg', 1.0), ('liga', 1.4), ('orc', 2.2)]: add(ding(1320), T[k] + dt, g=.4); add(ding(1760), T[k] + dt + .12, g=.3)
for i in range(8): add(ding(2093 + 200 * (i % 3)) * .6, T['prende'] + .3 + i * .12, pan=(i % 2) * .6 - .3, g=.18)
add(ding(880), T['segue'] + 1.4, g=.35)
fade = np.clip((DUR - t) / 1.2, 0, 1); fade *= np.clip(t / .3, 0, 1)
mix = np.stack([L * fade, R * fade], 1); mix /= np.max(np.abs(mix)) / .89
with wave.open('som-37.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
print('ok', DUR)
