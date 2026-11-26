"""Narration for $0 on this computer: Kokoro-82M text-to-speech (Apache-2.0) via kokoro-onnx. No account, no API.

  scripts/py scripts/voice.py <project>          script.json -> data/narration.wav + data/lines.json (exact line times)
  scripts/py scripts/voice.py --list             voices that narrate well
  scripts/py scripts/voice.py --download         only fetch the model files (~340 MB, once)

script.json: { "voice": "am_michael", "speed": 1.05, "lead": 0.45, "outro": 0.9, "gap": 0.32,
               "lines": [ { "text": "What if you swallow gum?", "caps": "...", "gap": 0.3 }, ... ] }
One line = one CUT, not one sentence: a sentence can run across several lines ("It slides down your throat and lands
in your stomach," / "where acid gets to work on it."). Lines are grouped into whole sentences and each sentence is
spoken in ONE pass, so the intonation flows naturally; then every cut inside a sentence is found in the audio (snapped
to the nearest pause, else placed by length). "gap" (on a sentence's last line) = the pause after that sentence.
Write numbers the way they're SAID. Then run words.py for the word timings.
"""
import argparse, json, os, re, sys, urllib.request
from pathlib import Path
import numpy as np
from scipy.io import wavfile

try: sys.stdout.reconfigure(encoding='utf-8')   # Hindi text in line logs (Windows defaults to cp1252)
except Exception: pass

HOME = Path(os.environ.get('FACELESS_HOME', Path.home() / '.faceless-shorts'))
KDIR = HOME / 'kokoro'
FILES = {
    'kokoro-v1.0.onnx': 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx',
    'voices-v1.0.bin': 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin',
}
GOOD = {
    'am_michael': 'US male, steady explainer (default)', 'am_puck': 'US male, lively, playful', 'am_fenrir': 'US male, deeper',
    'am_onyx': 'US male, low', 'af_heart': 'US female, warm (best overall)', 'af_bella': 'US female, bright',
    'af_nicole': 'US female, soft and close', 'bm_george': 'UK male, documentary', 'bm_fable': 'UK male, storyteller',
    'bf_emma': 'UK female, calm',
    # Hindi voices (Devanagari script). "hi-*" = Piper, offline, no account.
    'hi-pratham': 'Hindi male, offline (default for Hindi)', 'hi-priyamvada': 'Hindi female, offline',
    'hi-rohan': 'Hindi male, deeper, offline',
    # Azure needs AZURE_SPEECH_KEY + AZURE_SPEECH_REGION; best prose, needs network.
    'az:hi-IN-ArjunNeural': 'Hindi male, Azure neural', 'az:hi-IN-AaravNeural': 'Hindi male, Azure neural',
    'az:hi-IN-KavyaNeural': 'Hindi female, Azure neural', 'az:hi-IN-AnanyaNeural': 'Hindi female, Azure neural',
}
SR = 24000
PIPER_DIR = Path(os.environ.get('FACELESS_HOME') or HOME) / 'piper-hi'
PIPER_URL = 'https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/{v}/medium/hi_IN-{v}-medium.onnx'


def ensure_models():
    KDIR.mkdir(parents=True, exist_ok=True)
    for name, url in FILES.items():
        p = KDIR / name
        if p.exists() and p.stat().st_size > 1_000_000: continue
        print(f'downloading {name} (once)...', flush=True)
        tmp = p.with_suffix('.part'); urllib.request.urlretrieve(url, tmp); tmp.rename(p)


def resample(x, sr):
    """any sample rate -> SR, so the rest of the pipeline can assume 24 kHz"""
    if int(sr) == SR: return x
    from math import gcd
    from scipy.signal import resample_poly
    g = gcd(int(sr), SR)
    return resample_poly(x, SR // g, int(sr) // g)


def ensure_piper(name):
    PIPER_DIR.mkdir(parents=True, exist_ok=True)
    model = PIPER_DIR / f'hi_IN-{name}-medium.onnx'
    cfg = PIPER_DIR / f'hi_IN-{name}-medium.onnx.json'
    for p, suffix in ((model, ''), (cfg, '.json')):
        if p.exists() and p.stat().st_size > 1000: continue
        print(f'downloading {p.name} (once)...', flush=True)
        tmp = p.with_suffix(p.suffix + '.part')
        urllib.request.urlretrieve(PIPER_URL.format(v=name) + suffix, tmp)
        tmp.rename(p)
    return model, cfg


def piper_say(voice, text, speed):
    import io, wave
    from piper import PiperVoice
    model, cfg = ensure_piper(voice[3:])
    v = PiperVoice.load(str(model), config_path=str(cfg))
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wf:
        try:
            from piper.config import SynthesisConfig
            v.synthesize_wav(text, wf, syn_config=SynthesisConfig(length_scale=1.0 / speed))
        except Exception:
            v.synthesize_wav(text, wf, set_wav_format=True)
    buf.seek(0)
    sr, data = wavfile.read(buf)
    return resample(np.asarray(data, dtype=np.float64) / 32768.0, sr)


def azure_say(voice, text, speed):
    """Azure Speech REST. Needs AZURE_SPEECH_KEY + AZURE_SPEECH_REGION (F0 free tier: 500k chars/month)."""
    import io, urllib.error, wave
    key = os.environ.get('AZURE_SPEECH_KEY', '').strip()
    region = os.environ.get('AZURE_SPEECH_REGION', 'centralindia').strip()
    if not key: sys.exit('azure voice needs AZURE_SPEECH_KEY and AZURE_SPEECH_REGION')
    name = voice[3:]
    lang = '-'.join(name.split('-')[:2])
    rate = '' if abs(speed - 1) < 0.01 else f'<prosody rate="{speed - 1:+.0%}">'
    ssml = (f'<speak version="1.0" xml:lang="{lang}"><voice name="{name}">'
            f'{rate}{text}{"</prosody>" if rate else ""}</voice></speak>')
    req = urllib.request.Request(
        f'https://{region}.tts.speech.microsoft.com/cognitiveservices/v1',
        data=ssml.encode('utf-8'),
        headers={'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml',
                 'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm'})
    try:
        data = urllib.request.urlopen(req, timeout=90).read()
    except urllib.error.HTTPError as e:
        sys.exit(f'azure tts {e.code}: {e.read().decode("utf-8", "ignore")[:300]}')
    with wave.open(io.BytesIO(data)) as wf:
        sr, frames = wf.getframerate(), wf.readframes(wf.getnframes())
    return resample(np.frombuffer(frames, dtype=np.int16).astype(np.float64) / 32768.0, sr)


def trim(x, thr=0.008):
    """cut leading/trailing silence so line start/end times are exact"""
    idx = np.where(np.abs(x) > thr)[0]
    if not len(idx): return x
    a = max(0, idx[0] - int(0.01 * SR)); b = min(len(x), idx[-1] + int(0.03 * SR)); return x[a:b]


def silences(x, thr=0.012, min_len=0.06):
    """pauses inside speech: [(start_s, end_s)] where the 10 ms RMS stays under thr for >= min_len"""
    hop = int(0.01 * SR); n = len(x) // hop
    rms = np.sqrt(np.mean(x[:n * hop].reshape(n, hop) ** 2, axis=1)); quiet = rms < thr * np.abs(x).max()
    out, st = [], None
    for f, q in enumerate(quiet):
        if q and st is None: st = f
        if (not q or f == n - 1) and st is not None:
            if (f - st) * 0.01 >= min_len: out.append((st * 0.01, f * 0.01))
            st = None
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('project', nargs='?'); ap.add_argument('--list', action='store_true'); ap.add_argument('--download', action='store_true')
    ap.add_argument('--voice'); ap.add_argument('--speed', type=float)
    a = ap.parse_args()
    if a.list:
        for k, v in GOOD.items(): print(f'{k:12s} {v}')
        return
    if not a.project: ap.error('project folder missing')
    P = Path(a.project); S = json.loads((P / 'script.json').read_text(encoding='utf-8'))
    voice = a.voice or S.get('voice', 'am_michael'); speed = float(a.speed or S.get('speed', 1.0))
    if a.download:
        if not (voice.startswith('hi-') or voice.startswith('az:')): ensure_models()
        return
    if voice.startswith('hi-'):
        say = lambda text: trim(piper_say(voice, text, speed))
    elif voice.startswith('az:'):
        say = lambda text: trim(azure_say(voice, text, speed))
    else:
        ensure_models()
        from kokoro_onnx import Kokoro
        k = Kokoro(str(KDIR / 'kokoro-v1.0.onnx'), str(KDIR / 'voices-v1.0.bin'))
        lang = 'en-gb' if voice.startswith('b') else 'en-us'
        say = lambda text: trim(np.asarray(k.create(text, voice=voice, speed=speed, lang=lang)[0], dtype=np.float64))
    # group the lines into whole sentences (a line ending in . ? ! (or the Hindi danda) closes one; "break": true forces a close)
    groups, cur = [], []
    for i, ln in enumerate(S['lines']):
        cur.append(i)
        if re.search(r'[.?!।॥]["\')]*$', ln['text'].strip()) or ln.get('break') or i == len(S['lines']) - 1: groups.append(cur); cur = []
    out = [np.zeros(int(float(S.get('lead', 0.4)) * SR))]; t = len(out[0]) / SR; lines = [None] * len(S['lines'])
    for g in groups:
        x = say(' '.join(S['lines'][i]['text'] for i in g))
        cuts = [0.0]
        if len(g) > 1:                                    # find each cut inside the sentence
            lens = np.array([len(say(S['lines'][i]['text'])) for i in g], dtype=float)
            pauses = silences(x)
            for c in np.cumsum(lens)[:-1] / lens.sum() * len(x) / SR:
                near = [p for p in pauses if abs((p[0] + p[1]) / 2 - c) < 0.4]
                if near: p = min(near, key=lambda p: abs((p[0] + p[1]) / 2 - c)); cuts.append((p[0], p[1]))
                else: cuts.append((c, c))
        n = len(x) / SR
        for j, i in enumerate(g):
            a = 0.0 if j == 0 else cuts[j][1]; b = n if j == len(g) - 1 else cuts[j + 1][0]
            lines[i] = {'i': i, 'text': S['lines'][i]['text'], 'start': round(t + a, 3), 'end': round(t + b, 3)}
            print(f'{i:2d} {lines[i]["start"]:6.2f}-{lines[i]["end"]:6.2f}  {S["lines"][i]["text"]}', flush=True)
        gap = np.zeros(int(float(S['lines'][g[-1]].get('gap', S.get('gap', 0.3))) * SR))
        out += [x, gap]; t += (len(x) + len(gap)) / SR
    outro = np.zeros(int(float(S.get('outro', 0.9)) * SR)); out.append(outro)
    y = np.concatenate(out); y = y / (np.abs(y).max() + 1e-9) * 0.9
    (P / 'data').mkdir(exist_ok=True)
    wavfile.write(P / 'data/narration.wav', SR, (y * 32767).astype(np.int16))
    dur = len(y) / SR
    (P / 'data/lines.json').write_text(json.dumps({'duration': round(dur, 3), 'voice': voice, 'speed': speed, 'lines': lines}, indent=1, ensure_ascii=False), encoding='utf-8')
    print(f'data/narration.wav ({dur:.2f} s, {voice} x{speed}) + data/lines.json. Next: words.py')


if __name__ == '__main__':
    main()
