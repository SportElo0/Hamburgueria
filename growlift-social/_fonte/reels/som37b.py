# Som do Reel 37, versão misteriosa (teste): grave contínuo, pulso lento de sintetizador, tique-taque, sinos distantes
# e subidas de tensão; batida só nas partes de jogo, mais contida. Mesmos efeitos (whoosh, estrondo no GTA 6, avisos).
# Começa só depois do "pelo GTA 6", como a versão normal. Saída: som-37b.mp3.
import numpy as np, wave, json
T = json.load(open('tempos37.json'))
SR = 48000; DUR = T['fim']; N = int(SR * DUR); t = np.arange(N) / SR
L = np.zeros(N); R = np.zeros(N); rng = np.random.default_rng(371)
def tt(d): return np.arange(int(d * SR)) / SR
def add(sig, s, pan=0, g=1.0):
    i = int(s * SR); j = min(N, i + len(sig))
    if j <= i: return
    x = sig[:j - i] * g; L[i:j] += x * (1 - max(0, pan)); R[i:j] += x * (1 + min(0, pan))
def env(d, a=.005, dec=.2): x = tt(d); return np.minimum(1, x / a) * np.exp(-x / dec)
def lp(x, c):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / (1 + (f / c) ** 4); return np.fft.irfft(X, len(x))
def kick():
    x = tt(.5); f = 40 + 90 * np.exp(-x * 25); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 6)
def whoosh(d=.6):
    n = int(d * SR); e = np.sin(np.pi * np.arange(n) / n) ** 2; return lp(rng.standard_normal(n), 3500) * e
def ding(f=1320): return (np.sin(2*np.pi*f*tt(.6)) + .5*np.sin(2*np.pi*f*1.5*tt(.6))) * env(.6, .002, .15)
def boom(): x = tt(2.0); f = 28 + 55*np.exp(-x*7); return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-x*1.8) + lp(rng.standard_normal(len(x)),1200)*np.exp(-x*8)*.5
start = T['gta'] - .02
on = (t >= start) & ~((t >= T['porque']) & (t < T['perdido'] - .05))
# grave contínuo em ré menor, com batimento lento
drone = np.sin(2*np.pi*36.7*t) + .6*np.sin(2*np.pi*36.9*t) + .4*np.sin(2*np.pi*73.4*t) + .2*np.sin(2*np.pi*110.2*t)
L += drone * .22 * on; R += drone * .22 * on
# pulso de sintetizador em colcheias, filtro abrindo e fechando
bpm = 96; step = 60 / bpm / 2; notes = [146.8, 146.8, 174.6, 146.8, 130.8, 146.8, 196, 174.6]
i = 0; s = start
while s < T['segue'] + 3:
    if on[min(N - 1, int(s * SR))]:
        f = notes[i % 8]; x = tt(.22)
        p = (2 * ((x * f) % 1) - 1) * np.exp(-x * 9)
        cut = 600 + 900 * (.5 + .5 * np.sin(s * .7))
        add(lp(p, cut), s, pan=.35 if i % 2 else -.35, g=.22)
    i += 1; s += step
# tique-taque (relógio) a cada batida
s = start
while s < T['segue']:
    if on[int(s * SR)]: add(np.sin(2*np.pi*3000*tt(.02)) * env(.02, .0005, .004), s, pan=.5 if int(s/ (60/bpm)) % 2 else -.5, g=.12)
    s += 60 / bpm
# sinos distantes nas trocas
for k in ['lancou', 'perdido', 'cliente', 'prende']:
    for f, dt in [(587.3, 0), (880, .25), (698.5, .5)]: add(ding(f) * .7, T[k] + dt, pan=np.sin(f) * .6, g=.12)
# batida contida só nas partes de jogo
s = T['perdido']
while s < T['segue']:
    game = (T['perdido'] <= s < T['cliente']) or (T['prende'] <= s < T['segue'])
    if game: add(kick(), s, g=.4)
    s += 60 / bpm
# subidas de tensão antes do "Sabe por quê?" e antes do fim
for a, b in [(T['porque'] - 1.6, T['porque']), (T['segue'] - 2.0, T['segue'])]:
    x = tt(b - a); f = 80 * (14 ** (x / (b - a))); add(np.sin(2*np.pi*np.cumsum(f)/SR) * (x / (b - a)) ** 2 * .3 + lp(rng.standard_normal(len(x)), 6000) * (x/(b-a))**3 * .3, a, g=.6)
for k in ['lancou', 'porque', 'perdido', 'cliente', 'prende', 'segue']: add(whoosh(), T[k] - .35, g=.4)
add(whoosh(.9), T['gta'] - .7, g=.6)
add(boom(), T['gta'] - .05, g=.95)
for k, dt in [('msg', 1.0), ('liga', 1.4), ('orc', 2.2)]: add(ding(1320), T[k] + dt, g=.35); add(ding(1760), T[k] + dt + .12, g=.25)
add(ding(880), T['segue'] + 1.4, g=.3)
fade = np.clip((DUR - t) / 1.5, 0, 1)
mix = np.stack([L * fade, R * fade], 1); mix /= np.max(np.abs(mix)) / .89
with wave.open('som-37b.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
print('ok', DUR)
