"""تصميم صوتي لأفلام «الصحبة الصالحة»: مؤثرات وأجواء + موسيقى تصويرية (video/music.py) مع صمت مقصود.
الاستخدام: python3 video/audio.py <film>  ->  build/video/<film>.wav
"""
import sys, os, wave
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 44100
rng = np.random.default_rng(7)
OUT = os.path.join(os.path.dirname(__file__), '..', 'build', 'video')
CURRENT = None  # اسم الفيلم الحالي لإضافة موسيقاه
MUSIC_LEVEL = 1.25


# ---------- أدوات ----------
def T(d):
    return np.arange(int(d * SR)) / SR


def noise(d, color='white'):
    n = rng.standard_normal(int(d * SR))
    if color == 'brown':
        n = np.cumsum(n); n -= np.convolve(n, np.ones(2000) / 2000, 'same'); n /= (np.abs(n).max() + 1e-9)
    if color == 'pink':
        n = bp(n, 40, 8000)
    return n


def lp(x, f, o=2):
    return sosfilt(butter(o, min(f, SR / 2 - 100), 'low', fs=SR, output='sos'), x)


def hp(x, f, o=2):
    return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)


def bp(x, f0, f1, o=2):
    return sosfilt(butter(o, [f0, min(f1, SR / 2 - 100)], 'band', fs=SR, output='sos'), x)


def env(n, a, r, hold=None):
    e = np.ones(n)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na) ** 2 if na < n else np.linspace(0, 1, n) ** 2
    if nr < n: e[-nr:] *= np.linspace(1, 0, nr) ** 1.5
    return e


class Track:
    def __init__(self, dur):
        self.n = int(dur * SR)
        self.L = np.zeros(self.n); self.R = np.zeros(self.n)
        self.wetL = np.zeros(self.n); self.wetR = np.zeros(self.n)

    def add(self, t, x, gain=1.0, pan=0.0, wet=0.25):
        i = int(t * SR)
        if i >= self.n or len(x) == 0: return
        if i < 0: x = x[-i:]; i = 0
        x = x[: self.n - i] * gain
        gl, gr = np.sqrt((1 - pan) / 2), np.sqrt((1 + pan) / 2)
        self.L[i:i + len(x)] += x * gl; self.R[i:i + len(x)] += x * gr
        self.wetL[i:i + len(x)] += x * gl * wet; self.wetR[i:i + len(x)] += x * gr * wet

    def automate(self, curve):
        """منحنى صوت عام [(t, v), ...]"""
        ts = np.array([c[0] for c in curve]); vs = np.array([c[1] for c in curve])
        g = np.interp(np.arange(self.n) / SR, ts, vs)
        return g

    def render(self, master_curve, rev=2.6):
        if CURRENT:
            import music
            m = Track(self.n / SR)
            music.SCORES[CURRENT](m)
            rms = lambda a: np.sqrt(np.mean(a[np.abs(a) > 1e-4] ** 2)) if np.any(np.abs(a) > 1e-4) else 1.0
            g = MUSIC_LEVEL * rms(self.L + self.R) / rms(m.L + m.R)
            self.L += m.L * g; self.R += m.R * g; self.wetL += m.wetL * g; self.wetR += m.wetR * g
        ir_n = int(rev * SR)
        tt = np.arange(ir_n) / SR
        irL = rng.standard_normal(ir_n) * np.exp(-tt * 6.9 / rev); irR = rng.standard_normal(ir_n) * np.exp(-tt * 6.9 / rev)
        irL = lp(irL, 5000); irR = lp(irR, 5000)
        irL /= np.sqrt((irL ** 2).sum()); irR /= np.sqrt((irR ** 2).sum())
        L = self.L + fftconvolve(self.wetL, irL)[: self.n] * 0.9
        R = self.R + fftconvolve(self.wetR, irR)[: self.n] * 0.9
        g = self.automate(master_curve)
        L *= g; R *= g
        st = np.stack([L, R], 1)
        st = hp(st.T, 25).T
        peak = np.abs(st).max()
        st = np.tanh(st / peak * 1.4) / np.tanh(1.4) * 0.89
        return st


# ---------- مؤثرات ----------
def step(soft=1.0, crunch=0.0):
    d = 0.16
    x = noise(d) * env(int(d * SR), 0.004, 0.14)
    y = lp(x, 900 + crunch * 3000) * 1.4 + hp(x, 3000) * crunch * 0.6
    return y * soft


def footsteps(tr, t0, t1, rate, gain=0.25, pan=0.0, crunch=0.0, jitter=0.03):
    t = t0
    k = 0
    while t < t1:
        tr.add(t + rng.uniform(-jitter, jitter), step(rng.uniform(0.7, 1.0), crunch), gain, pan + (0.05 if k % 2 else -0.05), 0.15)
        t += rate; k += 1


def whoosh(d=1.2, f0=300, f1=3000, peak=0.6):
    n = int(d * SR); x = noise(d)
    # تصفية متحركة تقريبية: مزج نطاقات حسب الزمن
    lo = bp(x, f0, f0 * 3); hi = bp(x, f1 / 3, f1)
    m = np.linspace(0, 1, n)
    y = lo * (1 - m) + hi * m
    e = np.concatenate([np.linspace(0, 1, int(n * peak)) ** 2, np.linspace(1, 0, n - int(n * peak)) ** 2])
    return y * e * 1.6


def riser(d=2.0):
    n = int(d * SR); x = noise(d); m = np.linspace(0, 1, n)
    y = bp(x, 200, 800) * (1 - m) + bp(x, 2000, 9000) * m
    return y * m ** 2.2 * 1.4


def boom(d=2.5, f=48, gain=1.0):
    t = T(d)
    fr = f * (1 + 1.5 * np.exp(-t * 10))
    ph = 2 * np.pi * np.cumsum(fr) / SR
    s = np.sin(ph) * np.exp(-t * 2.2)
    s += lp(noise(d), 300) * np.exp(-t * 8) * 0.8
    return s * gain


def shimmer(d=3.0, density=40, hi=1.0):
    """بريق: حبيبات عالية التردد غير نغمية"""
    n = int(d * SR); y = np.zeros(n)
    g = int(0.03 * SR)
    for _ in range(int(density * d)):
        i = rng.integers(0, max(1, n - g))
        y[i:i + g] += hp(noise(0.03), 5000 + 3000 * rng.random()) * np.hanning(g) * rng.uniform(0.3, 1)
    y = hp(y, 4000)
    return y * env(n, d * 0.3, d * 0.5) * hi


def crackle(d, density=30, gain=1.0):
    n = int(d * SR); y = np.zeros(n)
    for _ in range(int(density * d)):
        i = rng.integers(0, max(1, n - 400)); L = rng.integers(40, 400)
        y[i:i + L] += rng.standard_normal(L) * np.exp(-np.arange(L) / (L / 4)) * rng.uniform(0.2, 1)
    return bp(y, 800, 9000) * gain


def fire(d, gain=1.0):
    base = lp(noise(d), 500) * 0.8 * (1 + 0.4 * np.sin(2 * np.pi * 0.7 * T(d)))
    return (base + crackle(d, 25, 0.8)) * gain


def wind(d, f0=250, f1=1200, mod=0.15, gain=1.0):
    x = bp(noise(d), f0, f1)
    t = T(d)
    m = 0.6 + 0.4 * np.sin(2 * np.pi * mod * t + rng.uniform(0, 6)) * np.sin(2 * np.pi * mod * 0.37 * t + 1)
    return x * m * gain * 1.5


def howl(d, gain=1.0):
    """عواء ريح جبلي: رنين ضيق متحرك"""
    x = noise(d); t = T(d); y = np.zeros_like(x)
    seg = int(0.25 * SR)
    for i in range(0, len(x), seg):
        f = 500 + 300 * np.sin(2 * np.pi * 0.07 * i / SR) + 150 * np.sin(2 * np.pi * 0.23 * i / SR)
        part = x[max(0, i - 2000): i + seg]
        yy = bp(part, f * 0.85, f * 1.15, 2)[i - max(0, i - 2000):]
        y[i:i + len(yy)] = yy
    y = lp(y, 2000)
    return (y * 3 + bp(x, 150, 600) * 0.6) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * t)) * gain


def crickets(d, gain=1.0, pan=0.0):
    n = int(d * SR); y = np.zeros(n); t = 0.0
    while t < d - 0.3:
        f = rng.uniform(4200, 5200)
        for k in range(3):
            tt = T(0.025)
            ch = np.sin(2 * np.pi * f * tt) * np.hanning(len(tt))
            i = int((t + k * 0.05) * SR)
            if i + len(ch) < n: y[i:i + len(ch)] += ch
        t += rng.uniform(0.35, 0.9)
    return y * gain


def heartbeat(t0, t1, tr, bpm=70, gain=0.6):
    t = t0
    while t < t1:
        for k, a in ((0, 1.0), (0.28, 0.7)):
            tt = T(0.25)
            s = np.sin(2 * np.pi * (55 + 30 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 16)
            tr.add(t + k, s, gain * a, 0, 0.1)
        t += 60 / bpm


def cough():
    d = 0.5
    x = bp(noise(d), 250, 2200) * env(int(d * SR), 0.01, 0.2)
    x[int(0.18 * SR):] *= 0.2
    y = np.zeros(int(0.8 * SR)); y[: len(x)] += x; y[int(0.24 * SR): int(0.24 * SR) + len(x)] += x * 0.6
    return y * 1.4


def pop(f=900, d=0.12):
    t = T(d)
    return (np.sin(2 * np.pi * f * (1 - t * 3) * t) * np.exp(-t * 40) + bp(noise(d), 500, 3000) * np.exp(-t * 60) * 0.5)


def flaps(d=1.2, rate=11, gain=1.0):
    t = T(d)
    m = np.clip(np.sin(2 * np.pi * rate * t), 0, 1) ** 3
    return bp(noise(d), 300, 3000) * m * env(len(t), 0.05, d * 0.6) * gain * 1.5


def crash(d=1.4):
    t = T(d)
    x = hp(noise(d), 1500) * np.exp(-t * 5) * 0.8 + crackle(d, 80, 0.8) * np.exp(-t * 3)
    x += lp(noise(d), 400) * np.exp(-t * 18) * 1.2
    return x


def ice_crack():
    d = 0.35; t = T(d)
    x = np.zeros(len(t))
    for _ in range(14):
        i = rng.integers(0, len(t) - 300)
        x[i:i + 300] += rng.standard_normal(300) * np.exp(-np.arange(300) / 50)
    return (bp(x, 1500, 9000) + bp(x, 200, 900) * 0.6) * 1.5


def rumble(d, gain=1.0):
    return lp(noise(d), 120, 4) * env(int(d * SR), d * 0.2, d * 0.5) * gain * 4


def creak(d=0.8, f=180):
    t = T(d)
    fr = f * (1 + 0.2 * np.sin(2 * np.pi * 1.3 * t))
    pulses = (np.sin(2 * np.pi * np.cumsum(fr) / SR) > 0.97).astype(float)
    return bp(pulses, 300, 3000) * env(len(t), 0.1, 0.3) * 2


def coo(d=0.7):
    t = T(d)
    f = 340 + 40 * np.sin(2 * np.pi * 3 * t)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * t)) * env(len(t), 0.08, 0.3)
    return lp(s + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.08, 0.3), 1500)


def chirp():
    d = 0.18; t = T(d)
    f = 3200 + 1800 * np.sin(np.pi * t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.hanning(len(t))


def owl():
    out = []
    for d, f in ((0.35, 420), (0.12, 0), (0.6, 400)):
        t = T(d)
        out.append(np.sin(2 * np.pi * f * t) * np.hanning(len(t)) if f else np.zeros(len(t)))
    return lp(np.concatenate(out) + 0.2 * noise(sum(len(o) for o in out) / SR) * 0, 900)


def air_pad(d, f0=200, f1=900, gain=1.0):
    """جو هوائي سينمائي غير نغمي"""
    return bp(noise(d), f0, f1) * env(int(d * SR), d * 0.3, d * 0.4) * gain


def whisper(d=1.5):
    x = bp(noise(d), 1500, 5000); t = T(d)
    m = np.clip(np.sin(2 * np.pi * rng.uniform(5, 9) * t), 0, 1) * env(len(t), 0.3, 0.6)
    return x * m


def ending(tr, t0, end, nlines):
    tr.add(t0, air_pad(end - t0 + 1, 150, 700, 0.35), 1, 0, 0.6)
    for i in range(nlines + 2):
        tt = t0 + 1 + i * 1.4 if i < nlines else t0 + 1.2 + nlines * 1.4 + (i - nlines) * 1.2
        tr.add(tt - 0.3, whoosh(1.4, 400, 6000, 0.3), 0.18, (-0.3 if i % 2 else 0.3), 0.6)
        tr.add(tt, shimmer(2.0, 25), 0.18, 0, 0.7)


# ---------- الأفلام ----------
def musk():
    D = 58.5; tr = Track(D)
    tr.add(0, lp(noise(D, 'brown'), 400) * 0.6, 0.5, 0, 0.1)  # همهمة سوق بعيدة
    tr.add(0, crickets(41, 0.12, 0), 1, -0.4, 0.3); tr.add(0, crickets(41, 0.1), 1, 0.5, 0.3)
    tr.add(0, fire(41, 0.25), 1, -0.6, 0.2)
    tr.add(13, fire(12, 0.5) * env(int(12 * SR), 1, 3), 1, -0.3, 0.2)
    footsteps(tr, 0.4, 8, 0.45, 0.22); footsteps(tr, 11, 13, 0.45, 0.3, -0.2); footsteps(tr, 24.3, 26.2, 0.38, 0.3, 0); footsteps(tr, 27.2, 29, 0.45, 0.3, 0.2)
    for p in [13.6, 15.0, 16.4, 17.8, 19.2, 20.6, 22.0]:
        tr.add(p - 0.5, whoosh(0.9, 80, 600, 0.55), 0.7, -0.4, 0.2)
        tr.add(p, crackle(1.4, 60, 1.0) * np.exp(-T(1.4) * 2), 0.6, -0.1, 0.3)
        tr.add(p, boom(0.8, 60, 0.5), 0.5, 0, 0.1)
    tr.add(13, rumble(12, 0.5), 1, 0, 0.2)
    for cg in [16.6, 19.4, 22.1]: tr.add(cg, cough(), 0.45, 0.1, 0.3)
    tr.add(28.4, riser(2.0), 0.35, 0.3, 0.4)
    tr.add(30.4, pop(700), 0.6, 0.3, 0.4)
    tr.add(30.5, whoosh(3.5, 300, 5000, 0.4), 0.35, 0.2, 0.6)
    tr.add(30.6, shimmer(10, 45), 0.45, 0.1, 0.7)
    for i in range(9): tr.add(33.2 + i * 0.35, pop(1200 + i * 90, 0.08), 0.18, (-0.4 if i % 2 else 0.4), 0.5)
    tr.add(37.8, whoosh(1.5, 800, 6000, 0.5), 0.25, 0.3, 0.5)
    tr.add(39.2, riser(2.0), 0.6, 0, 0.5)
    tr.add(41.2, boom(3, 42, 1.0), 0.8, 0, 0.4); tr.add(41.2, shimmer(4, 60), 0.5, 0, 0.8)
    tr.add(41.2, air_pad(9, 150, 600, 0.6), 0.5, 0, 0.6)
    tr.add(41.2, rumble(6, 0.4), 1, -0.6, 0.3)
    tr.add(42.6, whisper(1.6), 0.15, -0.7, 0.6)
    footsteps(tr, 44.8, 46.6, 0.42, 0.22, 0.2)
    tr.add(46.2, whoosh(2.4, 100, 1500, 0.3), 0.4, -0.6, 0.5)
    footsteps(tr, 47.4, 50.5, 0.5, 0.15, 0.2)
    tr.add(47.5, shimmer(4, 30), 0.3, 0.2, 0.7)
    ending(tr, 50, 57.2, 2)
    return tr.render([(0, 0), (1.5, 1), (57.2, 1), (58.5, 0)])


def lantern():
    D = 58; tr = Track(D)
    tr.add(0, wind(D, 200, 900, 0.1, 0.18), 1, 0, 0.3)
    amb = crickets(D, 0.1) + crickets(D, 0.08)
    gate = np.interp(np.arange(len(amb)) / SR, [0, 10, 14, 18.4, 18.6, 37, 38, 58], [1, 1, 0.3, 0.2, 0, 0, 1.2, 1.2])
    tr.add(0, amb * gate, 1, -0.3, 0.4); tr.add(0, crickets(D, 0.07) * gate, 1, 0.5, 0.4)
    tr.add(4.5, owl(), 0.15, 0.7, 0.6)
    tr.add(0, fire(18.3, 0.08), 1, 0, 0.1)
    footsteps(tr, 0.3, 9, 0.48, 0.2, 0, 0.5); footsteps(tr, 9, 16, 0.6, 0.18, 0, 0.5)
    tr.add(8.5, wind(10.5, 300, 2500, 0.5, 0.6) * env(int(10.5 * SR), 2, 2), 1, 0.4, 0.4)
    for g in (10.2, 13.1, 15.8, 17.6): tr.add(g, whoosh(1.6, 200, 2500, 0.5), 0.35, 0.6, 0.4)
    for w in (12.5, 15, 17, 20.5, 23): tr.add(w, whisper(1.8), 0.12, rng.uniform(-0.8, 0.8), 0.7)
    tr.add(18.2, whoosh(0.7, 500, 3000, 0.2), 0.45, 0, 0.4)
    heartbeat(19.2, 27, tr, 66, 0.55)
    tr.add(19, rumble(8, 0.35), 1, 0, 0.3)
    footsteps(tr, 24, 30.2, 0.48, 0.2, -0.5, 0.5)
    tr.add(35.2, riser(1.9), 0.45, 0, 0.4)
    tr.add(35.3, crackle(1.8, 50, 0.5), 1, 0, 0.4)
    tr.add(37.0, boom(3, 45, 1.0), 0.7, 0, 0.4); tr.add(37.0, whoosh(1.2, 200, 4000, 0.15), 0.6, 0, 0.5)
    tr.add(37.0, shimmer(6, 50), 0.45, 0, 0.8)
    tr.add(37.2, fire(20, 0.12), 1, 0, 0.1)
    tr.add(38, air_pad(12, 300, 1200, 0.4), 0.6, 0, 0.6)
    tr.add(38.5, shimmer(10, 20), 0.25, 0, 0.8)
    footsteps(tr, 41, 49.5, 0.48, 0.18, 0, 0.5); footsteps(tr, 41.2, 49.5, 0.48, 0.15, 0.1, 0.5)
    ending(tr, 50, 56.8, 2)
    return tr.render([(0, 0), (1, 1), (57, 1), (58, 0)])


def rope():
    D = 58; tr = Track(D)
    tr.add(0, howl(7.5, 0.5), 1, 0.2, 0.3)
    tr.add(6.3, whoosh(1.6, 300, 6000, 0.45), 0.8, 0, 0.4)
    h = howl(30, 0.45); tr.add(7, h, 1, -0.1, 0.3)
    footsteps(tr, 7, 16.2, 0.57, 0.3, 0, 1.0)
    for i, c in enumerate([15.6, 16.0, 16.4, 16.75]): tr.add(c, ice_crack(), 0.5 + i * 0.1, 0, 0.4)
    tr.add(16.95, ice_crack(), 0.9, 0, 0.5); tr.add(16.95, rumble(3, 1.0), 1, 0, 0.4); tr.add(17, crash(2.0), 0.5, 0, 0.6)
    tr.add(17.0, whoosh(0.8, 300, 3000, 0.9), 0.5, 0, 0.3)
    tr.add(17.75, boom(2.5, 55, 1.0), 0.9, 0, 0.3); tr.add(17.75, pop(300, 0.1), 0.8, 0, 0.3)
    for k in range(6): tr.add(18.3 + k * 1.0, creak(0.7, 160 + k * 5), 0.2, 0, 0.3)
    heartbeat(18.6, 24, tr, 90, 0.5)
    tr.add(19, air_pad(4, 80, 300, 0.8), 0.7, 0, 0.5)
    for k, hv in enumerate([24.4, 25.8, 27.2, 28.6, 30.0]):
        tr.add(hv, step(1, 1.0), 0.6, -0.3, 0.2); tr.add(hv + 0.05, step(1, 1.0), 0.5, 0.4, 0.2)
        tr.add(hv + 0.1, creak(0.6, 200), 0.35, 0, 0.3); tr.add(hv + 0.1, boom(0.6, 70, 0.4), 0.4, 0, 0.1)
    tr.add(29.6, riser(1.0), 0.3, 0, 0.4)
    tr.add(30.6, shimmer(3, 40), 0.5, 0, 0.7); tr.add(30.6, boom(1.6, 60, 0.6), 0.6, 0, 0.4)
    tr.add(31.6, crash(0.8) * 0.3, 0.6, 0, 0.3)
    tr.add(32, air_pad(5, 300, 1500, 0.4), 0.6, 0, 0.6)
    tr.add(35.8, whoosh(1.8, 300, 6000, 0.4), 0.8, 0, 0.4)
    tr.add(36.5, wind(12, 200, 900, 0.1, 0.3), 1, 0, 0.4)
    tr.add(37, riser(5), 0.3, 0, 0.5)
    for k in range(10): tr.add(38 + k * 0.7 + rng.uniform(0, 0.3), chirp(), 0.05, 0.5, 0.5)
    tr.add(42, boom(3, 44, 0.8), 0.7, 0, 0.5); tr.add(42, shimmer(5, 50), 0.45, 0, 0.8)
    tr.add(42, air_pad(6, 200, 1000, 0.5), 0.6, 0, 0.6)
    ending(tr, 48.5, 56.6, 2)
    return tr.render([(0, 0), (1, 1), (57, 1), (58, 0)])


def shadow():
    D = 58; tr = Track(D)
    tr.add(0, lp(noise(D, 'brown'), 500) * 0.5, 0.5, 0, 0.1)
    for k in range(8): tr.add(1 + k * 1.6 + rng.uniform(0, 0.5), coo(), 0.12, rng.uniform(-0.5, 0.5), 0.4)
    footsteps(tr, 0.2, 21, 0.5, 0.2, 0.1)
    footsteps(tr, 7, 21, 0.5, 0.17, -0.3)
    tr.add(10.5, rumble(10, 0.45), 1, 0, 0.3)
    tr.add(10.5, air_pad(10, 60, 220, 0.6), 0.8, 0, 0.4)
    for k in range(8): tr.add(12 + k * 1.0 + rng.uniform(0, 0.3), ice_crack() * 0.7, 0.35, rng.uniform(-0.5, 0.5), 0.4)
    tr.add(13.6, flaps(2.2, 12, 1.0), 0.4, -0.4, 0.4); tr.add(13.9, flaps(2.0, 10, 1.0), 0.3, -0.2, 0.4)
    tr.add(16.8, whoosh(0.7, 400, 3000, 0.8), 0.3, 0.2, 0.3)
    tr.add(17.5, crash(1.4), 0.7, 0.2, 0.4)
    tr.add(17.8, riser(1.4), 0.45, 0, 0.5)
    tr.add(19.2, boom(2.5, 40, 1.0), 0.9, 0, 0.4); tr.add(19.2, whisper(2.5), 0.25, -0.2, 0.7)
    heartbeat(19.4, 22.5, tr, 100, 0.5)
    for k in range(5): tr.add(21.2 + k * 0.8, creak(0.9, 120 + k * 10), 0.3, -0.2, 0.3)
    footsteps(tr, 22, 25, 0.5, 0.2, 0.1)
    tr.add(25.4, pop(250, 0.15), 1.0, 0, 0.3); tr.add(25.4, boom(1.8, 50, 0.8), 0.7, 0, 0.4); tr.add(25.4, whoosh(1.0, 300, 3000, 0.1), 0.4, 0, 0.4)
    footsteps(tr, 26, 29, 0.5, 0.18, -0.6)
    tr.add(27, wind(6, 200, 800, 0.2, 0.3), 1, 0, 0.4)
    footsteps(tr, 27.5, 32.5, 0.5, 0.2, 0.6)
    tr.add(32.6, shimmer(2, 25), 0.3, 0.2, 0.7)
    tr.add(33.2, air_pad(14, 300, 1400, 0.45), 0.6, 0, 0.6)
    footsteps(tr, 33.5, 44, 0.5, 0.18, 0); footsteps(tr, 33.7, 44, 0.5, 0.15, 0.2)
    tr.add(36, shimmer(6, 40), 0.4, 0, 0.8)
    tr.add(38, pop(1300, 0.1), 0.3, 0.4, 0.4)
    for t0 in (38.2, 40.2, 42.2, 44.2): tr.add(t0, flaps(1.4, 11, 0.8), 0.22, -0.2, 0.5)
    for k in range(7): tr.add(39 + k * 0.3, flaps(1.0, 12, 0.6), 0.15, 0.4, 0.5)
    for k in range(5): tr.add(42 + k * 1.3, coo(), 0.1, rng.uniform(-0.4, 0.4), 0.4)
    tr.add(44.5, air_pad(6, 200, 1000, 0.5), 0.5, 0, 0.6)
    ending(tr, 50, 56.8, 2)
    return tr.render([(0, 0), (1, 1), (57, 1), (58, 0)])


def save(name, st):
    os.makedirs(OUT, exist_ok=True)
    data = (np.clip(st, -1, 1) * 32767).astype(np.int16)
    with wave.open(os.path.join(OUT, name + '.wav'), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())


if __name__ == '__main__':
    sys.modules['audio'] = sys.modules['__main__']
    for name in sys.argv[1:]:
        CURRENT = name
        save(name, globals()[name]())
        print('audio ->', name)
