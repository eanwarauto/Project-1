import json, numpy as np, wave
SR = 44100
d = json.load(open('sfx.json'))
DUR = d['frames'] / 30
N = int(DUR * SR) + SR
out = np.zeros(N)
rng = np.random.default_rng(7)

def env(n, vol, d):
    t = np.arange(n) / SR
    a = np.minimum(1, t / 0.01)
    return vol * a * np.exp(np.log(1e-4) * t / d)

def osc(f, f2, d, typ):
    n = int(d * SR); t = np.arange(n) / SR
    fr = f * (f2 / f) ** (t / d) if f2 else np.full(n, f)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    if typ == 'square': w = np.sign(np.sin(ph)) * .6
    elif typ == 'triangle': w = 2 / np.pi * np.arcsin(np.sin(ph))
    elif typ == 'sawtooth': w = 2 * ((ph / (2 * np.pi)) % 1) - 1
    else: w = np.sin(ph)
    return w

def add(at, sig):
    i = int(at * SR)
    if i >= N: return
    j = min(N, i + len(sig)); out[i:j] += sig[:j - i]

def tone(at, f, d, typ='sine', vol=.15, f2=None, delay=0):
    w = osc(f, f2, d, typ); add(at + delay, w * env(len(w), vol, d))

def noise(at, d, vol=.2, freq=1000, typ='lowpass', delay=0):
    n = int(d * SR); x = rng.uniform(-1, 1, n)
    a = np.exp(-2 * np.pi * freq / SR); y = np.zeros(n); acc = 0.0
    for k in range(n):
        acc = (1 - a) * x[k] + a * acc; y[k] = acc
    if typ == 'highpass': y = x - y
    else: y = y * 2.5
    add(at + delay, y * env(n, vol, d))

def sfx(at, k):
    if k == 'chop': noise(at,.09,.4,1400); tone(at,150,.12,'square',.07,70); noise(at,.09,.35,1400,delay=.2); tone(at,140,.12,'square',.06,70,.2)
    elif k == 'fall': noise(at,.55,.3,450); tone(at,95,.45,'sine',.22,40)
    elif k == 'stone': noise(at,.06,.35,2500,'highpass'); tone(at,820,.06,'triangle',.12); noise(at,.06,.3,2500,'highpass',.18); tone(at,700,.06,'triangle',.1,None,.18)
    elif k == 'crumble': noise(at,.4,.35,800); tone(at,120,.3,'sine',.12,60)
    elif k == 'plant': tone(at,330,.12,'sine',.12,520)
    elif k == 'harvest': tone(at,520,.09,'sine',.14,880); tone(at,700,.1,'sine',.12,1200,.08)
    elif k == 'coin': tone(at,1318,.07,'square',.05); tone(at,1760,.18,'square',.05,None,.07)
    elif k == 'ok': [tone(at,f,.18,'triangle',.13,None,i*.09) for i,f in enumerate([660,880,1175])]
    elif k == 'bad': tone(at,240,.3,'sawtooth',.06,150)
    elif k == 'build': [noise(at,.07,.35,1800,delay=dd) for dd in (0,.15,.3)]; [tone(at,f,.24,'triangle',.13,None,.5+i*.12) for i,f in enumerate([523,659,784,1046])]
    elif k == 'tap': tone(at,620,.05,'sine',.06)
    elif k == 'cluck': tone(at,900,.06,'square',.04,600); tone(at,1000,.07,'square',.04,650,.11); tone(at,820,.06,'square',.035,560,.22)
    elif k == 'moo': tone(at,170,.7,'sawtooth',.045,115); tone(at,85,.7,'sine',.09,60)
    elif k == 'sweep': [noise(at,.16,.28,3000,'highpass',d) for d in (0,.2,.4)]
    elif k == 'rooster': tone(at,520,.18,'sawtooth',.035,700); tone(at,700,.22,'sawtooth',.035,900,.2); tone(at,900,.5,'sawtooth',.03,620,.44)
    elif k == 'bird': b = 2200 + rng.random()*800; tone(at,b,.08,'sine',.025,b*1.3); tone(at,b*1.1,.08,'sine',.025,b*1.4,.12)

for at, k in d['events']:
    if at >= 0: sfx(at, k)
sfx_bus = out.copy() * 2.2

# soft background loop: C - Am - F - G, 104 bpm plucked arpeggio + pad
out[:] = 0
bpm = 104; beat = 60 / bpm
chords = [[60,64,67],[57,60,64],[53,57,60],[55,59,62]]
mid = lambda m: 440 * 2 ** ((m - 69) / 12)
t = 0.0; bar = 0
while t < DUR + 1:
    ch = chords[bar % 4]
    tone(t, mid(ch[0] - 12), beat * 4, 'sine', .07)
    for i in range(8):
        note = ch[[0,1,2,1,0,2,1,2][i]] + (12 if i in (2,5) else 0)
        tone(t + i * beat / 2, mid(note), .45, 'triangle', .045)
    t += beat * 4; bar += 1
music = out.copy()
mix = sfx_bus + music
n = int(DUR * SR); mix = mix[:n]
fade = int(1.5 * SR); mix[:int(.3*SR)] *= np.linspace(0,1,int(.3*SR)); mix[-fade:] *= np.linspace(1,0,fade)
mix = mix / max(1e-9, np.max(np.abs(mix))) * .89
pcm = (mix * 32767).astype(np.int16)
w = wave.open('audio.wav','wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok', DUR)
