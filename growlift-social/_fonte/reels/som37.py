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
# pad synth (acordes que mudam a cada 2 s)
chords = [[220, 277.2, 329.6], [196, 246.9, 293.7], [174.6, 220, 261.6], [196, 246.9, 311.1]]
pad = np.zeros(N)
for k in range(int(DUR / 2) + 1):
    a, b = int(k * 2 * SR), min(N, int((k + 1) * 2 * SR)); x = t[a:b]
    for f in chords[k % 4]: pad[a:b] += (2 * ((x * f) % 1) - 1) * .15 + np.sin(2 * np.pi * f / 2 * x) * .2
pad = lp(pad, 1400)
g = np.where(game, .55, np.where(phone, .3, .18)); g[(t >= T['porque']) & (t < T['perdido'])] = 0
L += pad * g * .5; R += pad * g * .5
# batida 112 bpm nas partes de jogo e de celular
beat = 60 / 112; s = 0.15
while s < T['segue']:
    if not (T['porque'] <= s < T['perdido']): add(kick(), s, g=.55 if (game[int(s*SR)] or phone[int(s*SR)]) else .3)
    s += beat
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
