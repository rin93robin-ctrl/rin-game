# 凜界異聞錄 BGM 合成器：小型加法合成 + 殘響，輸出可無縫循環的音軌
import numpy as np, scipy.signal as ss

SR = 44100
NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
QUAL = {'': [0, 4, 7], 'm': [0, 3, 7], '7': [0, 4, 7, 10], 'm7': [0, 3, 7, 10], 'maj7': [0, 4, 7, 11],
        'm9': [0, 3, 7, 10, 14], '9': [0, 4, 7, 10, 14], 'maj9': [0, 4, 7, 11, 14], 'add9': [0, 4, 7, 14],
        'm6': [0, 3, 7, 9], '7b9': [0, 4, 7, 10, 13], 'm7b5': [0, 3, 6, 10], 'dim': [0, 3, 6],
        'sus4': [0, 5, 7], 'sus2': [0, 2, 7]}


def m2f(m): return 440.0 * 2 ** ((m - 69) / 12)


def pc(s):
    n = NOTE[s[0]]; i = 1
    while i < len(s) and s[i] in '#b':
        n += 1 if s[i] == '#' else -1; i += 1
    return n % 12, i


def nm(s):
    p, i = pc(s); return p + 12 * (int(s[i:]) + 1)


def chord(sym):
    bass = None
    if '/' in sym: sym, b = sym.split('/'); bass, _ = pc(b)
    root, i = pc(sym); q = sym[i:]
    return root, QUAL[q], (root if bass is None else bass)


def voice(sym, low):
    root, iv, _ = chord(sym)
    r = low + ((root - low) % 12)
    return [r + x for x in iv]


def bassnote(sym, low=36):
    _, _, b = chord(sym); return low + ((b - low) % 12)


def mel(s):
    out, t = [], 0.0
    for tok in s.replace('|', ' ').split():
        n, d = tok.split(':'); d = float(d)
        if n != 'r': out.append((t, nm(n), d))
        t += d
    return out, t


# ---------------- 樂器 ----------------
R = np.random.default_rng(7)


def _t(sec): return np.arange(int(sec * SR)) / SR


def env(n, a, r, total):
    e = np.ones(n); A = max(1, int(a * SR)); Rr = max(1, int(r * SR)); hold = int(total * SR)
    e[:A] = np.linspace(0, 1, A) ** 1.5 if A < n else np.linspace(0, 1, n)
    if hold < n: e[hold:] *= np.exp(-np.arange(n - hold) / (Rr / 4.6))
    return e


def additive(f, dur, harm, a, r, vib=0.0, vibr=5.0, det=(0,), bright=None):
    t = _t(dur + r); n = len(t); out = np.zeros(n)
    vibenv = np.clip(t / 0.6, 0, 1) * vib
    for c in det:
        fc = f * 2 ** (c / 1200)
        ph = 2 * np.pi * np.cumsum(fc * (1 + vibenv * np.sin(2 * np.pi * vibr * t + R.random() * 6)) ) / SR
        for k, amp in harm:
            if fc * k > 9000: break
            w = amp * (bright(t, k) if bright else 1)
            out += w * np.sin(k * ph + R.random() * 6)
    return out / len(det) * env(n, a, r, dur)


def pad(f, dur, v=1):
    return v * 0.5 * additive(f, dur, [(k, 1 / k ** 1.5) for k in range(1, 14)], 0.9, 1.4, vib=0.003, det=(-8, 0, 7))


def strings(f, dur, v=1):
    return v * 0.5 * additive(f, dur, [(k, 1 / k ** 1.15) for k in range(1, 18)], 0.35, 0.8, vib=0.004, det=(-10, -3, 4, 11))


def choir(f, dur, v=1):
    def fw(k): fk = f * k; return np.exp(-((fk - 450) / 180) ** 2) + 0.6 * np.exp(-((fk - 1000) / 260) ** 2) + 0.15
    return v * 0.6 * additive(f, dur, [(k, fw(k) / k ** 0.5) for k in range(1, 16)], 0.6, 1.2, vib=0.006, vibr=5.3, det=(-6, 0, 6))


def horn(f, dur, v=1):
    br = lambda t, k: 1 if k <= 2 else (1 - np.exp(-t * 5)) * 0.9
    return v * 0.55 * additive(f, dur, [(k, 1 / k ** 1.7) for k in range(1, 12)], 0.12, 0.35, vib=0.003, det=(-4, 4), bright=br)


def flute(f, dur, v=1):
    x = additive(f, dur, [(1, 1), (2, 0.18), (3, 0.06)], 0.09, 0.25, vib=0.006, vibr=5.2); t = np.arange(len(x)) / SR
    noise = ss.lfilter(*ss.butter(2, [min(0.99, f * 0.9 / (SR / 2)), min(0.995, f * 3 / (SR / 2))], 'band'), R.normal(0, 1, len(t)))
    return v * 0.5 * (x + 0.04 * noise * env(len(t), 0.05, 0.2, dur))


def pluck(f, dur, v=1, bright=1.0, decay=1.0):
    t = _t(min(dur, 3.5) + 1.2); out = np.zeros(len(t))
    for k in range(1, 14):
        if f * k > 10000: break
        out += (1 / k ** (1.6 / bright)) * np.exp(-t * (0.9 + 0.55 * k) * decay) * np.sin(2 * np.pi * f * k * t + R.random() * 6)
    out *= np.clip(t / 0.003, 0, 1)
    return v * 0.45 * out


def harp(f, dur, v=1): return pluck(f, dur, v, 1.0, 0.8)
def dulcimer(f, dur, v=1): return pluck(f, dur, v, 1.8, 1.4)


def pizz(f, dur, v=1):
    t = _t(0.9); out = np.zeros(len(t))
    for k in range(1, 7): out += (1 / k ** 2) * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (5 + 3 * k))
    return v * 0.8 * out * np.clip(t / 0.004, 0, 1)


def bell(f, dur, v=1, parts=((1, 1, 2.2), (2.0, .35, 1.0), (3.0, .18, .6), (4.16, .12, .35), (5.43, .06, .25))):
    t = _t(max(dur, 1.5) + 2.5); out = np.zeros(len(t))
    for r, a, d in parts:
        if f * r < 12000: out += a * np.exp(-t / d) * np.sin(2 * np.pi * f * r * t)
    return v * 0.35 * out * np.clip(t / 0.002, 0, 1)


def celesta(f, dur, v=1): return bell(f, dur, v, ((1, 1, 1.3), (2.0, .3, .5), (3.0, .12, .3), (4.1, .08, .2)))
def musicbox(f, dur, v=1): return bell(f, dur, v, ((1, 1, 1.6), (3.98, .28, .35), (9.1, .07, .12), (2.0, .1, .5)))
def vibes(f, dur, v=1):
    x = bell(f, dur, v, ((1, 1, 2.4), (4.0, .25, .5), (10.0, .05, .15))); t = np.arange(len(x)) / SR
    return x * (1 - 0.25 * (0.5 + 0.5 * np.sin(2 * np.pi * 5.5 * t)))


def ep(f, dur, v=1):
    t = _t(dur + 1.0); idx = 1.6 * np.exp(-t * 3) + 0.25
    x = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t)) * np.exp(-t * 0.9)
    x += 0.12 * np.sin(2 * np.pi * f * 7 * t) * np.exp(-t * 8)
    return v * 0.4 * x * env(len(t), 0.004, 0.35, dur)


def square(f, dur, v=1):
    return v * 0.3 * additive(f, dur, [(k, 1 / k) for k in (1, 3, 5, 7, 9)], 0.005, 0.12)


def bowedbass(f, dur, v=1):
    return v * 0.6 * additive(f, dur, [(k, 1 / k ** 1.3) for k in range(1, 10)], 0.25, 0.6, det=(-5, 5))


def drone(f, dur, v=1):
    x = additive(f, dur, [(1, 1), (2, .5), (3, .25), (1.5, .35), (4, .1)], 2.0, 2.0, det=(-4, 4))
    t = np.arange(len(x)) / SR
    return v * 0.5 * x * (0.8 + 0.2 * np.sin(2 * np.pi * 0.1 * t))


def noise_hit(dur, lo, hi, a, d, v):
    t = _t(dur); n = R.normal(0, 1, len(t))
    n = ss.lfilter(*ss.butter(2, [lo / (SR / 2), min(0.99, hi / (SR / 2))], 'band'), n)
    return v * n * np.clip(t / a, 0, 1) * np.exp(-t / d)


def tick(v=1): return noise_hit(0.06, 3500, 9000, 0.0005, 0.008, v * 0.5)
def tock(v=1): return noise_hit(0.08, 1200, 3000, 0.0005, 0.012, v * 0.55)
def brush(v=1): return noise_hit(0.35, 2500, 9000, 0.03, 0.09, v * 0.18)
def hat(v=1): return noise_hit(0.07, 6000, 12000, 0.0005, 0.015, v * 0.25)


def timpani(f, v=1):
    t = _t(2.0); fr = f * (1 + 0.04 * np.exp(-t * 20))
    x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / 0.6) + 0.5 * np.sin(2 * np.pi * np.cumsum(fr * 1.5) / SR) * np.exp(-t / 0.3)
    return v * 0.7 * (x + noise_hit(2.0, 60, 600, 0.001, 0.05, 0.6))


def cymbal(v=1): return bell(1700, 2, v * 0.6, ((1, 1, 2.5), (1.47, .7, 2.0), (2.31, .5, 1.5), (3.1, .3, 1.0)))


def bloop(v=1):
    t = _t(0.16); f = 300 * (3 ** (t / 0.16))
    return v * 0.35 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.16)


# ---------------- 混音 ----------------
class Track:
    def __init__(self, bpm, beats, bars, tail=6.0):
        self.spb = 60 / bpm; self.beats = beats; self.bars = bars
        self.L = int(bars * beats * self.spb * SR); self.T = int(tail * SR)
        self.buf = np.zeros((2, self.L + self.T)); self.dry = np.zeros((2, self.L + self.T))

    def at(self, bar, beat=0.0): return (bar * self.beats + beat) * self.spb

    def add(self, x, sec, pan=0.0, gain=1.0, wet=True, human=0.006):
        i = int((sec + (R.normal(0, human) if human else 0)) * SR); i = max(0, i)
        if i >= self.L: return
        x = x[: self.L + self.T - i] * gain
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        tgt = self.buf if wet else self.dry
        tgt[0, i:i + len(x)] += x * l * 1.414 / 2 * 2 ** 0.5; tgt[1, i:i + len(x)] += x * r * 1.414 / 2 * 2 ** 0.5

    def note(self, inst, m, bar, beat, dur_beats, pan=0, gain=1, vel=1, wet=True):
        v = vel * (1 + R.normal(0, 0.06))
        self.add(inst(m2f(m), dur_beats * self.spb, v), self.at(bar, beat), pan, gain, wet)

    def melody(self, inst, s, bar0, pan=0, gain=1, octave=0, wet=True):
        notes, _ = mel(s)
        for t, m, d in notes:
            self.note(inst, m + 12 * octave, bar0 + int(t // self.beats), t % self.beats, d, pan, gain, wet=wet)

    def render(self, wet=0.32, rt=0.5, name='x', target_rms=0.085):
        n = int(3.2 * SR); t = np.arange(n) / SR
        ir = R.normal(0, 1, (2, n)) * np.exp(-t / rt)
        b, a = ss.butter(1, 5500 / (SR / 2)); ir = ss.lfilter(b, a, ir, axis=1)
        ir[:, :int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
        ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
        rev = np.stack([ss.fftconvolve(self.buf[c], ir[c])[: self.buf.shape[1]] for c in range(2)])
        out = self.buf + self.dry + wet * rev * 2.2
        out[:, : self.T] += out[:, self.L: self.L + self.T]; out = out[:, : self.L]   # 無縫循環
        out = ss.lfilter(*ss.butter(2, 35 / (SR / 2), 'high'), out, axis=1)
        out *= target_rms / (np.sqrt((out ** 2).mean()) + 1e-9)
        out = np.tanh(out * 1.2) / np.tanh(1.2)
        out *= min(1, 0.92 / np.abs(out).max())
        return out
