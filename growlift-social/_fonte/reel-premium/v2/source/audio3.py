# Sound for the Reel 001 v3: music and effects synthesised here, note by note, so there is nothing licensed
# from anyone (no samples, no library tracks). Times follow reel3.mjs.
#   python3 growlift-social/_fonte/reel-premium/v2/source/audio3.py   → renders/v3/trilha-v3.wav (48 kHz, stereo)
from pathlib import Path
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
DUR = 25.5
OUT = Path(__file__).resolve().parent.parent / 'renders' / 'v3' / 'trilha-v3.wav'
rng = np.random.default_rng(7)
N = int(DUR * SR)
mix = np.zeros((N, 2))

BPM = 110
BEAT = 60 / BPM


def add(sig, at, gain=1.0, pan=0.0):
    """Mixes a mono or stereo signal in at time `at` (s), with constant-power pan (-1 left … 1 right)."""
    i = int(at * SR)
    if i >= N:
        return
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        sig = np.stack([sig * np.cos(a), sig * np.sin(a)], axis=1)
    sig = sig[: N - i]
    mix[i : i + len(sig)] += sig * gain


def env(n, attack, release, curve=4.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(attack, 1e-4))
    tail = np.clip((t - attack) / max(release, 1e-4), 0, 1)
    return e * np.exp(-curve * tail)


def filt(sig, kind, f):
    sos = butter(2, f, btype=kind, fs=SR, output='sos')
    return sosfilt(sos, sig, axis=0)


def note(freq, dur, partials=((1, 1.0), (2, 0.35), (3, 0.15)), attack=0.01, release=None, detune=0.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * freq * k * (1 + detune) * t) for k, a in partials)
    return s * env(n, attack, release or dur, 3.5)


def kick(gain=1.0):
    n = int(0.42 * SR)
    t = np.arange(n) / SR
    f = 45 + 95 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * gain


def boom():
    """The opening hits: a deep body, a short noise attack and a little air on top."""
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * np.cumsum(38 + 70 * np.exp(-t * 18)) / SR) * np.exp(-t * 3.2)
    crack = filt(rng.standard_normal(n), 'bandpass', [900, 5000]) * np.exp(-t * 40) * 0.5
    return body + crack


def whoosh(dur, lo=300, hi=4000, rise=0.6):
    n = int(dur * SR)
    noise = rng.standard_normal(n)
    a = filt(noise, 'bandpass', [lo, hi])
    t = np.arange(n) / SR
    shape = np.where(t < dur * rise, (t / (dur * rise)) ** 2, np.exp(-6 * (t - dur * rise) / (dur * (1 - rise))))
    return a * shape


def click(gain=1.0):
    """A refined UI tap: a 2 kHz tick with a soft low thump."""
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    tick = np.sin(2 * np.pi * 2100 * t) * np.exp(-t * 160)
    thump = np.sin(2 * np.pi * 180 * t) * np.exp(-t * 45) * 0.5
    return (tick + thump) * gain


def swipe(dur=0.45):
    return whoosh(dur, 1200, 7000, 0.45) * 0.6


def hat():
    n = int(0.05 * SR)
    return filt(rng.standard_normal(n), 'highpass', 7000) * np.exp(-np.arange(n) / SR * 90)


# --- music -----------------------------------------------------------------------------------------
# A minor colour, chords of two bars: Am9 · Fmaj7 · Cmaj7 · G6 (frequencies of the voicings, Hz).
CHORDS = [
    [110.0, 220.0, 261.6, 329.6, 392.0, 493.9],
    [87.3, 174.6, 220.0, 261.6, 329.6, 392.0],
    [65.4, 130.8, 196.0, 246.9, 329.6, 392.0],
    [98.0, 196.0, 246.9, 293.7, 329.6, 440.0],
]
BAR = 4 * BEAT


def intensity(t):
    """Loud in the opening and in the signature, quieter while the projects are shown."""
    if t < 2.3:
        return 1.0
    if t < 21.4:
        return 0.55
    return 0.85


# pad: soft detuned stack, under everything from 1.0 s
for b in range(int(DUR / (2 * BAR)) + 1):
    at = 1.0 + b * 2 * BAR
    if at >= DUR:
        break
    ch = CHORDS[b % 4]
    dur = 2 * BAR + 0.6
    pad = sum(note(f, dur, ((1, 1), (2, 0.2)), attack=0.6, release=dur * 3, detune=d) for f in ch for d in (-0.003, 0.003))
    pad = filt(pad, 'lowpass', 1800) * 0.028 * intensity(at)
    add(pad, at, pan=0.0)

# plucks: a quiet arpeggio in eighths during the demonstrations
step = BEAT / 2
t = 2.6
k = 0
while t < 21.2:
    ch = CHORDS[int((t - 1.0) // (2 * BAR)) % 4]
    f = ch[2 + (k % 4)] * (2 if k % 8 >= 4 else 1)
    add(note(f, 0.5, ((1, 1), (2, 0.4), (4, 0.1)), attack=0.004, release=0.18), t, gain=0.05, pan=0.35 * np.sin(k))
    t += step
    k += 1

# rhythm: kick on the beat with the opening, then a lighter pulse; hats on the off-beats
t = 0.0
while t < DUR - 0.5:
    if t < 2.3:
        pass  # the opening is carried by the three hits
    elif t < 21.4:
        if int(round(t / BEAT)) % 2 == 0:
            add(kick(0.32), t)
        add(hat(), t + BEAT / 2, gain=0.035, pan=0.25)
    elif t < 24.6:
        add(kick(0.45), t)
        add(hat(), t + BEAT / 2, gain=0.045, pan=-0.25)
    t += BEAT

# bass: root of each chord, one note per half bar from the first site to the signature
for b in range(int(DUR / (BAR / 2))):
    at = 2.3 + b * BAR / 2
    if at >= 24.6:
        break
    root = CHORDS[int((at - 1.0) // (2 * BAR)) % 4][0]
    add(filt(note(root, BAR / 2 - 0.05, ((1, 1), (2, 0.5)), attack=0.01, release=0.5), 'lowpass', 400), at, gain=0.09 * intensity(at))

# --- the opening ------------------------------------------------------------------------------------
for at, g in [(0.0, 0.55), (0.34, 0.5), (0.72, 0.75)]:   # SUA MARCA · MERECE · MAIS.
    add(boom(), at, gain=g)
add(whoosh(0.75, 800, 9000, 0.85) * 0.25, 1.35)            # rises into the dot
add(note(880, 1.2, ((1, 1), (2.01, 0.3)), attack=0.002, release=0.5), 0.72, gain=0.05, pan=0.2)  # bright edge on MAIS.

# --- transitions -----------------------------------------------------------------------------------
for at, d, g, pan in [(2.0, 0.8, 0.35, -0.3), (4.25, 0.5, 0.18, 0.3), (7.05, 0.65, 0.3, 0.0), (12.95, 0.6, 0.3, 0.6),
                      (16.65, 0.6, 0.22, 0.0), (17.2, 0.4, 0.15, 0.0), (21.4, 0.7, 0.25, 0.0)]:
    add(whoosh(d) * g, at, pan=pan)

# --- interactions (the real taps and swipes of the recordings) --------------------------------------
for at in [4.85, 5.7]:                                        # Salinho thumbnails
    add(click(0.16), at, pan=0.1)
for rt in [0.45, 1.8, 2.3, 2.85, 3.55, 4.45]:                 # Chapa 77: Personalizar, 2 add-ons, Adicionar, Ver sacola, Gerar
    add(click(0.18), 8.3 + rt / 1.15, pan=0.15)
add(note(1320, 0.35, ((1, 1), (2, 0.2)), attack=0.002, release=0.25), 8.3 + 2.95 / 1.15, gain=0.05)  # item in the bag
for at in [15.0, 16.0]:                                       # Swell Club: board swipes
    add(swipe(), at, gain=0.5, pan=-0.4)
for rt in [0.45, 1.85, 2.45]:                                 # Fornada: day, croissant, pain au chocolat
    add(click(0.15), 18.45 + rt, pan=0.15)

# --- the signature ---------------------------------------------------------------------------------
add(boom() * 0.6, 22.6)                                       # the mark fills with blue
bell = sum(note(f, 2.6, ((1, 1), (2.76, 0.25), (5.4, 0.08)), attack=0.004, release=1.6) for f in (523.3, 659.3, 784.0, 987.8))
add(bell, 23.15, gain=0.07)                                   # GROWLIFT
add(whoosh(0.9, 3000, 12000, 0.5) * 0.1, 24.15, pan=0.5)      # light across the mark
end_chord = sum(note(f, 2.2, ((1, 1), (2, 0.2)), attack=0.3, release=4) for f in CHORDS[0])
add(filt(end_chord, 'lowpass', 2500), 23.3, gain=0.05)

# --- master ----------------------------------------------------------------------------------------
fade = np.ones(N)
fade[-int(0.5 * SR):] = np.linspace(1, 0, int(0.5 * SR))
mix *= fade[:, None]
mix = filt(mix, 'highpass', 28)
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.25) / np.tanh(1.25) * 0.89  # gentle soft clip, peak about -1 dBFS
OUT.parent.mkdir(parents=True, exist_ok=True)
wavfile.write(OUT, SR, (mix * 32767).astype(np.int16))
rms = 20 * np.log10(np.sqrt(np.mean(mix ** 2)))
print(f'{OUT.name}: {DUR} s, 48 kHz estéreo, pico {20 * np.log10(np.max(np.abs(mix))):.1f} dBFS, RMS {rms:.1f} dBFS')
