# Sound design for Reel 32 "O balão" (no narration), made from som31.py: tension drone + countdown ticks while the
# needle presses the balloon, a cut when the counter appears, digital blips on the wireframe, a light beat under the
# Growlift part, a riser and the POP (sharp crack + air burst + rubber flaps).
# Everything is synthesized here (no samples, no third-party music). Output: som-32.wav (48 kHz, stereo), then: ffmpeg -i som-32.wav -b:a 192k som-32.mp3
import numpy as np, wave, os

SR = 48000
DUR = 27.0
N = int(SR * DUR)
t = np.arange(N) / SR
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(32)

def add(sig, start, pan=0.0, gain=1.0):
    i = int(start * SR); j = min(N, i + len(sig))
    if j <= i: return
    s = sig[: j - i] * gain
    L[i:j] += s * (1 - max(0, pan)); R[i:j] += s * (1 + min(0, pan))

def env(n, a=0.005, d=0.2):
    x = np.arange(n) / SR
    return np.minimum(1, x / max(a, 1e-4)) * np.exp(-x / d)

def lowpass(x, k):
    # one-pole low-pass; k in (0,1], smaller = darker
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += k * (v - acc); y[i] = acc
    return y

# --- 0–7.0 and 7.0–22.6: drone that grows (cuts at 7.0, comes back lower, almost off under the phone part)
seg = (t < 22.6)
grow = np.clip(t / 7.0, 0, 1) ** 1.6
drone = (np.sin(2*np.pi*55*t) + .6*np.sin(2*np.pi*55.4*t) + .35*np.sin(2*np.pi*110.3*t) + .15*np.sin(2*np.pi*164.7*t))
shimmer = .12 * np.sin(2*np.pi*880*t) * (0.5 + 0.5*np.sin(2*np.pi*5.5*t))
g = np.where(t < 6.95, 0.10 + 0.38*grow, np.where(t < 7.25, 0.0, np.where((t > 16.2) & (t < 21.3), 0.05, 0.16 + 0.2*np.clip((t-7.25)/15, 0, 1))))
d = (drone * 0.22 + shimmer * np.where(t < 6.95, grow, 0.3)) * g * seg
fade_in = np.clip(t / 0.4, 0, 1)
L += d * fade_in; R += d * fade_in

# --- clock ticks, one per second (louder after the counter appears), stop at the burst
tick = np.sin(2*np.pi*2600*np.arange(int(.03*SR))/SR) * env(int(.03*SR), .0005, .006)
tock = np.sin(2*np.pi*1900*np.arange(int(.03*SR))/SR) * env(int(.03*SR), .0005, .006)
for k, s in enumerate(list(np.arange(0.25, 16.2, 1.0)) + list(np.arange(21.3, 22.6, 0.25))):
    add(tick if k % 2 == 0 else tock, s, pan=0.25 if k % 2 else -0.25, gain=0.18 if s < 7 else 0.32)

# --- heartbeat thumps speeding up 3.5–6.9 s
s = 3.5; gap = 0.95
while s < 6.9:
    n = int(.25*SR); x = np.arange(n)/SR
    thump = np.sin(2*np.pi*(62 - 20*x/0.25)*x) * env(n, .004, .07)
    add(thump, s, gain=0.55); add(thump*.6, s+0.2, gain=0.45)
    s += gap; gap = max(0.55, gap*0.86)

# --- the cut: a soft sub hit when the text appears
n = int(1.2*SR); x = np.arange(n)/SR
add(np.sin(2*np.pi*(48 - 10*x)*x) * env(n, .01, .45), 7.02, gain=0.55)

# --- riser 21.8–22.6 (into the pop)
n = int(0.8*SR); x = np.arange(n)/SR
noise = rng.standard_normal(n)
riser = lowpass(noise, 0.02) * 4 * (x/0.8)**2 + np.sin(2*np.pi*(200 + 900*(x/0.8)**2)*x)*0.08*(x/0.8)
add(riser, 21.8, gain=0.5)

# --- the POP at 22.6: a sharp crack, a burst of air and the rubber flapping away
n = int(1.4*SR); x = np.arange(n)/SR
crack = lowpass(rng.standard_normal(n), 0.85) * env(n, .0003, .018) * 2.2
air = lowpass(rng.standard_normal(n), 0.12) * env(n, .002, .22)
thump = np.sin(2*np.pi*(90*np.exp(-x*20) + 40)*x) * env(n, .001, .12)
flaps = sum(lowpass(rng.standard_normal(n), 0.5) * env(n, .001, .01) * (np.arange(n) >= int(d*SR)) * 0.4 for d in (0.05, 0.09, 0.16, 0.22))
add(np.tanh((crack + air + thump*0.8 + flaps) * 1.8), 22.6, gain=0.95)

# --- digital blips while the balloon is a wireframe (11.4–13.6)
for k, s0 in enumerate(np.arange(11.45, 13.6, 0.18)):
    n = int(.05*SR); x = np.arange(n)/SR
    add(np.sign(np.sin(2*np.pi*(900 + 300*(k % 4))*x)) * env(n, .001, .015), s0, pan=0.3 if k % 2 else -0.3, gain=0.08)

# --- whooshes: gather (12.5), screen swaps (15.25, 16.55), ending (18.1)
def whoosh(dur, up=True):
    n = int(dur*SR); x = np.arange(n)/SR
    nz = rng.standard_normal(n)
    k = np.linspace(0.01, 0.2, n) if up else np.linspace(0.2, 0.01, n)
    y = np.empty(n); acc = 0.0
    for i in range(n):
        acc += k[i]*(nz[i]-acc); y[i] = acc
    return y * np.sin(np.pi * x/dur) ** 2 * 3
add(whoosh(0.8), 10.5, gain=0.3)
add(whoosh(0.6, False), 13.5, gain=0.28)
add(whoosh(0.9), 16.0, gain=0.32)
add(whoosh(0.45, False), 18.35, pan=0.4, gain=0.28)
add(whoosh(0.45, False), 19.75, pan=-0.4, gain=0.28)

# --- small chimes: phone lands (13.75), ending card (18.15), the word (19.2)
def chime(freqs, dur=0.9):
    n = int(dur*SR); x = np.arange(n)/SR
    return sum(np.sin(2*np.pi*f*x) * (0.6 ** i) for i, f in enumerate(freqs)) * env(n, .003, .28)
add(chime([660, 990, 1320]), 16.75, gain=0.2)
add(chime([523.25, 784, 1046.5]), 23.65, gain=0.22)
add(chime([784, 1175, 1568]), 24.6, gain=0.24)

# --- light beat under the Growlift part (13.8–23.6): kick on the beat, soft hat on the off-beat, a warm pad
bpm = 120; beat = 60/bpm
kick_n = int(.3*SR); kx = np.arange(kick_n)/SR
kick = np.sin(2*np.pi*(110*np.exp(-kx*28) + 46)*kx) * env(kick_n, .002, .12)
hat_n = int(.05*SR)
for k, s in enumerate(list(np.arange(16.2, 21.3, beat)) + list(np.arange(23.6, 26.6, beat))):
    add(kick, s, gain=0.42 if s < 22 else 0.26)
    hat = lowpass(rng.standard_normal(hat_n), 0.9) - lowpass(rng.standard_normal(hat_n), 0.2)
    add(hat * env(hat_n, .001, .015), s + beat/2, pan=0.3, gain=0.18 if s < 22 else 0.1)
chords = [[220, 261.63, 329.63], [196, 246.94, 293.66], [174.61, 220, 261.63], [196, 246.94, 329.63]]
for k, s in enumerate([16.2, 18.2, 23.6, 25.6]):
    n = int(min(beat*4 if s < 20 else 2.0, DUR - s, 21.3 - s if s < 21.3 else 99)*SR); x = np.arange(n)/SR
    pad = sum(np.sin(2*np.pi*f*x) + .3*np.sin(2*np.pi*2*f*x) for f in chords[k % 4])
    a = np.minimum(1, x/0.4) * np.minimum(1, (n/SR - x)/0.4)
    add(pad * a, s, gain=0.035)

# --- master: soft limiter, fade out
fade = np.clip((DUR - t)/1.0, 0, 1)
L = np.tanh(L*1.1) * fade; R = np.tanh(R*1.1) * fade
peak = max(np.abs(L).max(), np.abs(R).max())
L /= peak/0.89; R /= peak/0.89
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'som-32.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.stack([L, R], 1) * 32767).astype('<i2').tobytes())
print(out)
