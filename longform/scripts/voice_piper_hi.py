"""Smoother Hindi narration with Piper hi_IN-rohan-medium (local, free, offline).

Writes the same data/narration.wav + data/lines.json as voice_hi.py, so every
renderer and words.py keeps working.

  scripts/py scripts/voice_piper_hi.py --download
  scripts/py scripts/voice_piper_hi.py --test "नमस्ते! आज मौसम बहुत सुहाना है।"
  scripts/py scripts/voice_piper_hi.py <project>

script.json: "voice": "hi_piper" (or "piper"), "speed": 1.0, lead/gap/outro.
Sentence-level length-scale variation keeps the delivery from sounding flat.
"""
import argparse
import json
import os
import re
import sys
import urllib.request
from pathlib import Path

import numpy as np
from scipy.io import wavfile

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from voice import trim, silences  # noqa: E402

HOME = Path(os.environ.get('FACELESS_HOME', Path.home() / '.faceless-shorts'))
PDIR = Path(os.environ.get('PIPER_HI_HOME', HOME / 'piper-hi'))
MODEL = PDIR / 'hi_IN-rohan-medium.onnx'
CONFIG = PDIR / 'hi_IN-rohan-medium.onnx.json'
BASE = 'https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/rohan/medium/'
FILES = [(MODEL, 'hi_IN-rohan-medium.onnx'), (CONFIG, 'hi_IN-rohan-medium.onnx.json')]

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass


def ensure_model():
    if MODEL.is_file() and CONFIG.is_file() and MODEL.stat().st_size > 1000000:
        return True
    print('downloading Piper Hindi voice (~63 MB, once)...', flush=True)
    PDIR.mkdir(parents=True, exist_ok=True)
    for dest, name in FILES:
        urllib.request.urlretrieve(BASE + name, dest)
    return True


def get_voice():
    ensure_model()
    import piper
    return piper.PiperVoice.load(str(MODEL), str(CONFIG))


def sentence_end(text):
    return bool(re.search(r'[।.?!]["\')]*$', text.strip()))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('project', nargs='?')
    ap.add_argument('--download', action='store_true')
    ap.add_argument('--test')
    ap.add_argument('--voice', default=None)
    ap.add_argument('--speed', type=float, default=None)
    ap.add_argument('--out', default='piper_hi_test.wav')
    a = ap.parse_args()

    if a.download:
        ensure_model()
        print(f'Piper Hindi voice ready at {PDIR}')
        return
    voice_obj = get_voice()
    SR = int(voice_obj.config.sample_rate)

    def synth(text, length_scale, seed=0):
        import piper
        cfg = piper.SynthesisConfig(length_scale=length_scale, noise_scale=0.667, noise_w_scale=0.8)
        chunks = list(voice_obj.synthesize(text, syn_config=cfg))
        x = np.concatenate([np.asarray(c.audio_float_array, dtype=np.float64) for c in chunks])
        return trim(x)

    if a.test:
        speed = float(a.speed or 1.0)
        x = synth(a.test, 1.0 / speed)
        out = Path(a.out)
        wavfile.write(out, SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))
        print(f'{out} ({len(x) / SR:.2f} s, piper hi_IN-rohan x{speed})')
        return

    if not a.project:
        ap.error('project folder missing')
    P = Path(a.project)
    S = json.loads((P / 'script.json').read_text(encoding='utf-8'))
    speed = float(a.speed or S.get('speed', 1.0))
    base_scale = 1.0 / speed

    groups, cur = [], []
    for i, ln in enumerate(S['lines']):
        cur.append(i)
        if sentence_end(ln['text']) or ln.get('break') or i == len(S['lines']) - 1:
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)

    out = [np.zeros(int(float(S.get('lead', 0.35)) * SR))]
    t = len(out[0]) / SR
    lines = [None] * len(S['lines'])
    for g in groups:
        sentence = ' '.join(S['lines'][i]['text'].strip() for i in g)
        # gentle phrase-to-phrase variation: natural, not robotic
        vary = (len(g) % 3 - 1) * 0.018
        x = synth(sentence, max(0.75, min(1.4, base_scale + vary)))
        cuts = [0.0]
        if len(g) > 1 and len(x) > 0:
            # estimate line lengths from text (no extra synthesis — keeps the full episode fast)
            lens = np.array([max(sum(1 for c in S['lines'][i]['text'] if not c.isspace()), 1) for i in g], dtype=float)
            pauses = silences(x)
            for c in np.cumsum(lens)[:-1] / lens.sum() * len(x) / SR:
                near = [p for p in pauses if abs((p[0] + p[1]) / 2 - c) < 0.4]
                if near:
                    p = min(near, key=lambda p: abs((p[0] + p[1]) / 2 - c))
                    cuts.append((p[0], p[1]))
                else:
                    cuts.append((c, c))
            cuts.append((len(x) / SR, len(x) / SR))
        n = len(x) / SR
        for j, i in enumerate(g):
            lo = 0.0 if j == 0 else cuts[j][1]
            hi = n if j == len(g) - 1 else cuts[j + 1][0]
            lines[i] = {'i': i, 'text': S['lines'][i]['text'], 'start': round(t + lo, 3), 'end': round(t + hi, 3)}
        gap = np.zeros(int(float(S['lines'][g[-1]].get('gap', S.get('gap', 0.24))) * SR))
        out += [x, gap]
        t += (len(x) + len(gap)) / SR

    out.append(np.zeros(int(float(S.get('outro', 1.0)) * SR)))
    y = np.concatenate(out)
    y = y / (np.abs(y).max() + 1e-9) * 0.92
    (P / 'data').mkdir(exist_ok=True)
    wavfile.write(P / 'data/narration.wav', SR, (y * 32767).astype(np.int16))
    dur = len(y) / SR
    (P / 'data/lines.json').write_text(
        json.dumps({'duration': round(dur, 3), 'voice': 'hi_piper', 'speed': speed, 'lines': lines}, indent=1),
        encoding='utf-8',
    )
    print(f'data/narration.wav ({dur:.2f} s, piper rohan x{speed}) + data/lines.json. Next: words.py')


if __name__ == '__main__':
    main()
