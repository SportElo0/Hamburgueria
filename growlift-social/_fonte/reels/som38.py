# Som do Reel 38: clima escuro e tecnológico, como o vídeo de referência (grave contínuo, pulso de sintetizador,
# tique-taque, batida contida), whoosh em cada peça, impacto quando a IA entra e no "tudo junto", avisos sonoros nos
# cards. Tudo sintetizado aqui. Lê tempos38.json; saída som-38.mp3.
import numpy as np, wave, json
T = json.load(open('tempos38.json'))
SR = 48000; DUR = T['fim']; N = int(SR * DUR); t = np.arange(N) / SR
L = np.zeros(N); R = np.zeros(N); rng = np.random.default_rng(38)
def tt(d): return np.arange(int(d * SR)) / SR
def add(sig, s, pan=0, g=1.0):
    i = int(s * SR); j = min(N, i + len(sig))
    if j <= i: return
    x = sig[:j - i] * g; L[i:j] += x * (1 - max(0, pan)); R[i:j] += x * (1 + min(0, pan))
def env(d, a=.005, dec=.2): x = tt(d); return np.minimum(1, x / a) * np.exp(-x / dec)
def lp(x, c):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / (1 + (f / c) ** 4); return np.fft.irfft(X, len(x))
def kick(): x = tt(.45); f = 42 + 100 * np.exp(-x * 28); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 7)
def whoosh(d=.55): n = int(d * SR); e = np.sin(np.pi * np.arange(n) / n) ** 2; return lp(rng.standard_normal(n), 4000) * e
def blip(f=1500): return np.sin(2*np.pi*f*tt(.12)) * env(.12, .001, .03)
def ding(f=1320): return (np.sin(2*np.pi*f*tt(.6)) + .5*np.sin(2*np.pi*f*1.5*tt(.6))) * env(.6, .002, .15)
def boom(): x = tt(1.8); f = 30 + 60*np.exp(-x*8); return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-x*2) + lp(rng.standard_normal(len(x)),1300)*np.exp(-x*9)*.5
build = np.clip(t / T['junto'], 0, 1)
drone = np.sin(2*np.pi*41.2*t) + .6*np.sin(2*np.pi*41.5*t) + .35*np.sin(2*np.pi*82.4*t) + .15*np.sin(2*np.pi*123.6*t)
L += drone * (.15 + .1 * build); R += drone * (.15 + .1 * build)
bpm = 100; beat = 60 / bpm; step = beat / 2
notes = [164.8, 164.8, 196, 164.8, 146.8, 164.8, 220, 196]
i = 0; s = 0.1
while s < T['segue'] + 2.5:
    x = tt(.2); f = notes[i % 8]
    p = (2 * ((x * f) % 1) - 1) * np.exp(-x * 10)
    add(lp(p, 700 + 1200 * min(1, s / T['junto'])), s, pan=.35 if i % 2 else -.35, g=.2)
    if i % 2 == 0: add(np.sin(2*np.pi*3200*tt(.02)) * env(.02, .0005, .004), s, g=.08)
    if s >= T['ia'] and i % 2 == 0 and s < T['segue']: add(kick(), s, g=.45 if s < T['junto'] else .6)
    i += 1; s += step
for k in ['cinquenta', 'atendente', 'ia', 'filtro', 'agenda', 'lembrete', 'some', 'retoma', 'junto', 'segue']: add(whoosh(), T[k] - .3, g=.4)
add(boom(), T['ia'], g=.85); add(boom(), T['junto'], g=.9)
for k in range(12): add(blip(1200 + 60 * k), T['cinquenta'] + .2 + k * .12, pan=(k % 3 - 1) * .5, g=.12)
for j in range(3): add(blip(1800), T['filtro'] + .5 + j * .45, g=.2)
add(ding(1320), T['lembrete'] + .1, g=.35); add(ding(1760), T['lembrete'] + .22, g=.25)
add(ding(1046), T['retoma'] + .2, g=.3)
fade = np.clip((DUR - t) / 1.5, 0, 1) * np.clip(t / .4, 0, 1)
mix = np.stack([L * fade, R * fade], 1); mix /= np.max(np.abs(mix)) / .89
with wave.open('som-38.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
print('ok', DUR)
