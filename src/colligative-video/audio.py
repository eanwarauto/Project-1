# يولّد الموسيقى الخلفية والمؤثرات الصوتية لفيديو «الخواص المجمعة» (بدون أي ملفات صوتية خارجية).
# التشغيل (يستدعيه render.js تلقائياً): python3 audio.py sfx.json out.wav
import json
import sys
import wave

import numpy as np

SR = 44100
rng = np.random.default_rng(7)


def t_axis(d):
    return np.arange(int(d * SR)) / SR


def env(n, a=0.005, r=None):
    """غلاف بسيط: صعود سريع ثم تلاشٍ أسي."""
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    if r:
        e *= np.exp(-t / r)
    return e


def sweep(f0, f1, d, shape=np.sin):
    t = t_axis(d)
    f = f0 * (f1 / f0) ** (t / d)
    return shape(2 * np.pi * np.cumsum(f) / SR)


def lowpass(x, k):
    """مرشح تمرير منخفض بسيط أحادي القطب (k بين 0 و1)."""
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += k * (v - acc)
        y[i] = acc
    return y


def tri(ph):
    return 2 / np.pi * np.arcsin(np.sin(ph))


# ---------- المؤثرات ----------
def s_pop(p=1):
    d = .12
    return sweep(900 * p, 260 * p, d) * env(int(d * SR), .002, .03) * .8


def s_plop(p=1):
    d = .18
    x = sweep(520 * p, 140 * p, d) * env(int(d * SR), .002, .05)
    return x * .9


def s_boing(p=1):
    t = t_axis(.6)
    f = (180 + 420 * t / .6) * (1 + .12 * np.sin(2 * np.pi * 14 * t)) * p
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), .01, .25) * .7


def s_whoosh(p=1):
    d = .7
    n = int(d * SR)
    t = np.arange(n) / SR
    e = np.sin(np.pi * t / d) ** 2
    x = lowpass(rng.standard_normal(n), .08) * e
    return x / (np.abs(x).max() + 1e-9) * .45


def s_swish(p=1):
    d = .4
    n = int(d * SR)
    t = np.arange(n) / SR
    x = lowpass(rng.standard_normal(n), .25) * np.sin(np.pi * t / d) ** 3
    return x / (np.abs(x).max() + 1e-9) * .35


def s_fall(p=1):
    d = .7
    return sweep(1400, 420, d, tri) * env(int(d * SR), .01) * np.linspace(1, .3, int(d * SR)) * .35


def s_ding(p=1):
    d = 1.6
    t = t_axis(d)
    f = 1046.5 * p
    x = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / (dec)) for m, a, dec in [(1, 1, .6), (2.0, .45, .3), (3.01, .25, .18), (4.2, .12, .1)])
    return x * env(len(t), .002) * .45


def s_blip(p=1):
    d = .1
    return np.sign(sweep(600 * p, 1100 * p, d)) * env(int(d * SR), .002, .03) * .18


def s_alert(p=1):
    t = t_axis(.16)
    a = tri(2 * np.pi * 620 * t) * env(len(t), .005, .08)
    b = tri(2 * np.pi * 440 * t) * env(len(t), .005, .1)
    return np.concatenate([a, b]) * .4


def s_flame(p=1):
    d = 1.0
    n = int(d * SR)
    x = lowpass(rng.standard_normal(n), .04) * env(n, .05, .35)
    return x / (np.abs(x).max() + 1e-9) * .4


def s_bubbles(p=1, dur=5, gain=.5):
    n = int(dur * SR)
    out = np.zeros(n + SR)
    tt = 0.0
    while tt < dur:
        f = rng.uniform(300, 750)
        b = sweep(f, f * 1.8, .05) * env(int(.05 * SR), .002, .015) * rng.uniform(.3, 1)
        i = int(tt * SR)
        out[i:i + len(b)] += b
        tt += rng.exponential(1 / 14)
    fade = np.ones_like(out)
    k = int(.4 * SR)
    fade[:k] = np.linspace(0, 1, k)
    fade[n - k:n] = np.linspace(1, 0, k)
    fade[n:] = 0
    return out * fade * gain * .5


def s_freeze(p=1):
    notes = [1568, 1760, 2093, 2349, 2637, 3136, 3520, 4186]
    out = np.zeros(int(1.6 * SR))
    for i, f in enumerate(notes):
        t = t_axis(.6)
        b = np.sin(2 * np.pi * f * t) * np.exp(-t / .15) * .25
        j = int(i * .06 * SR)
        out[j:j + len(b)] += b
    return out


def s_tada(p=1):
    d = 1.8
    t = t_axis(d)
    out = np.zeros(len(t))
    for f in [523.25, 659.25, 783.99, 1046.5]:
        ph = 2 * np.pi * f * t
        out += (np.sin(ph) + .5 * np.sin(2 * ph) + .3 * np.sin(3 * ph)) * .18
    e = env(len(t), .02) * np.where(t < 1.2, 1, np.exp(-(t - 1.2) / .2))
    intro = np.zeros(int(.18 * SR))
    ti = t_axis(.09)
    intro[:len(ti)] = np.sin(2 * np.pi * 392 * ti) * .3 * env(len(ti), .005, .05)
    return np.concatenate([intro, out * e])


SFX = {k[2:]: v for k, v in globals().items() if k.startswith('s_')}


# ---------- الموسيقى الخلفية ----------
def music(total):
    bpm = 112
    beat = 60 / bpm
    n = int(total * SR)
    out = np.zeros(n + 2 * SR)
    midi = lambda m: 440 * 2 ** ((m - 69) / 12)
    # C  G  Am  F
    chords = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]
    bass = [36, 43, 45, 41]

    def add(x, at, g):
        i = int(at * SR)
        if i >= n:
            return
        out[i:i + len(x)] += x[:len(out) - i] * g

    def pluck(f, d=.35):
        t = t_axis(d)
        return (np.sin(2 * np.pi * f * t) + .3 * np.sin(4 * np.pi * f * t)) * np.exp(-t / .12) * env(len(t), .003)

    def bassnote(f, d):
        t = t_axis(d)
        return (np.sin(2 * np.pi * f * t) + .2 * np.sin(4 * np.pi * f * t)) * env(len(t), .01) * np.exp(-t / (d * .8))

    def kick():
        t = t_axis(.25)
        return sweep(130, 45, .25) * np.exp(-t / .07)

    def hat():
        m = int(.05 * SR)
        x = rng.standard_normal(m)
        x = x - lowpass(x, .3)
        return x * np.exp(-np.arange(m) / SR / .012)

    bar, b = 0, 0.0
    pattern = [0, 1, 2, 1, 2, 0, 1, 2]
    while b < total:
        ci = bar % 4
        ch = chords[ci]
        for s in range(8):
            note = ch[pattern[s]] + (12 if s in (3, 6) else 0)
            add(pluck(midi(note + 12)), b + s * beat / 2, .16)
        add(bassnote(midi(bass[ci]), beat * 1.8), b, .32)
        add(bassnote(midi(bass[ci] + 7), beat * 1.8), b + 2 * beat, .26)
        for s in range(4):
            if s in (0, 2):
                add(kick(), b + s * beat, .35)
            add(hat(), b + s * beat + beat / 2, .07)
        b += 4 * beat
        bar += 1
    out = out[:n]
    fade = np.ones(n)
    fi, fo = int(1.0 * SR), int(2.5 * SR)
    fade[:fi] = np.linspace(0, 1, fi)
    fade[-fo:] = np.linspace(1, 0, fo)
    return out * fade


def main(src, dst):
    data = json.load(open(src, encoding='utf-8'))
    total = data['duration']
    n = int(total * SR)
    mix = music(total) * .55
    fx = np.zeros(n + 3 * SR)
    for e in data['events']:
        fn = SFX[e['type']]
        kw = {'p': e.get('pitch', 1)}
        if e['type'] == 'bubbles':
            kw.update(dur=e.get('dur', 5), gain=e.get('gain', .5))
        x = fn(**kw)
        i = int(e['t'] * SR)
        fx[i:i + len(x)] += x[:len(fx) - i]
    mix = mix + fx[:n]
    mix = mix / (np.abs(mix).max() + 1e-9) * .89
    pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
    stereo = np.repeat(pcm[:, None], 2, axis=1)
    with wave.open(dst, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(stereo.tobytes())


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
