# التعليق الصوتي لفيديو «إلكترونات التكافؤ» بصوت Piper العربي (ar_JO-kareem) دون اتصال بالإنترنت.
# synth <texts.json> <out_dir> <model.onnx>  ← يولّد مقطع WAV لكل جملة ويطبع مدده بصيغة JSON
# mix <plan.json> <out.wav> <total_seconds>  ← يضع المقاطع على الخط الزمني في ملف واحد
import hashlib, json, sys, wave
from pathlib import Path
import numpy as np

RATE = 22050


def synth(texts_path, out_dir, model):
    from piper import PiperVoice, SynthesisConfig
    voice = PiperVoice.load(model)
    voice.use_tashkeel = False  # النصوص مشكولة يدوياً
    cfg = SynthesisConfig(length_scale=0.95, noise_scale=0.6, noise_w_scale=0.7)
    out = Path(out_dir); out.mkdir(parents=True, exist_ok=True)
    durs = {}
    for item in json.load(open(texts_path, encoding='utf-8')):
        h = hashlib.sha1((item['text'] + repr(cfg)).encode()).hexdigest()[:12]
        f = out / f'{h}.wav'
        if not f.exists():
            with wave.open(str(f), 'wb') as w:
                voice.synthesize_wav(item['text'], w, syn_config=cfg)
        with wave.open(str(f)) as w:
            durs[item['key']] = {'file': str(f), 'dur': w.getnframes() / w.getframerate()}
    print(json.dumps(durs))


def mix(plan_path, out_path, total):
    buf = np.zeros(int(float(total) * RATE) + RATE, dtype=np.float32)
    for c in json.load(open(plan_path)):
        with wave.open(c['file']) as w:
            assert w.getframerate() == RATE
            a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        i = int(c['at'] * RATE)
        buf[i:i + len(a)] += a[:len(buf) - i]
    buf = np.clip(buf * 0.9, -1, 1)
    with wave.open(out_path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
        w.writeframes((buf * 32767).astype(np.int16).tobytes())


if __name__ == '__main__':
    {'synth': synth, 'mix': mix}[sys.argv[1]](*sys.argv[2:])
