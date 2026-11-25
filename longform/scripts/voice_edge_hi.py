"""Expressive Hindi narration with free Microsoft Edge neural voices (online, no API key).

Voices close to the warm, conversational style of Hindi animated kahani channels:
  narrator : hi-IN-MadhurNeural (male storyteller)
  mother   : hi-IN-SwaraNeural  (female character voice)

Writes the same data/narration.wav + data/lines.json, so words.py, mix.py and the
renderer keep working unchanged.

  scripts/py voice_edge_hi.py --test "नमस्ते! आज मौसम बहुत सुहाना है।"
  scripts/py voice_edge_hi.py <project>
"""
import argparse
import asyncio
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from scipy.io import wavfile

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from voice import trim  # noqa: E402

import edge_tts  # noqa: E402

MALE = 'hi-IN-MadhurNeural'
FEMALE = 'hi-IN-SwaraNeural'
SR = 24000

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

FEMALE_LABELS = ('MOTHER', 'MOTHER_VOICE', 'MOTHER_VOICE2', 'MOTHER_VOICE3')
HUSH_LABELS = ('WHISPER', 'WHISPER_BACK', 'ECHO_CALL', 'SHAKE', 'FEAR', 'DARK_SPEAKS', 'SILENCE', 'STOP')
SOFT_LABELS = ('TITLE', 'EP_TITLE', 'PROMISE', 'PROMISE2', 'OUTRO', 'SOURCES', 'SOURCE_NAMES')


async def synth(text, voice, rate, pitch, volume):
    last = None
    for attempt in range(5):
        # retry with progressively simpler prosody; the neural service sometimes
        # drops a websocket connection mid-request
        r, p, v = (rate, pitch, volume) if attempt < 2 else (0, 0, 0)
        try:
            comm = edge_tts.Communicate(text, voice, rate=f'{r:+d}%', pitch=f'{p:+d}Hz', volume=f'{v:+d}%')
            mp3 = b''.join([c['data'] async for c in comm.stream() if c['type'] == 'audio'])
            if not mp3:
                raise RuntimeError('no audio chunks')
            proc = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'mp3', '-i', 'pipe:0', '-ac', '1', '-ar', str(SR),
                                   '-f', 's16le', 'pipe:1'], input=mp3, capture_output=True, check=True)
            x = np.frombuffer(proc.stdout, dtype='<i2').astype(np.float64) / 32768.0
            if len(x) < SR // 4:
                raise RuntimeError('audio too short')
            return trim(x), mp3
        except Exception as exc:
            last = exc
            await asyncio.sleep(1.2 * (attempt + 1))
    raise RuntimeError(f'edge-tts failed after 5 tries ({last}): {text[:80]}')


def settings(label, speed):
    rate0 = round((speed - 1.0) * 100)
    female = any(k in label for k in FEMALE_LABELS)
    if female:
        return FEMALE, rate0 - 4 + (-3 if any(k in label for k in HUSH_LABELS) else 0), 2, -2
    rate, pitch, vol = rate0 - 5, -2, 0
    if any(k in label for k in HUSH_LABELS):
        rate, pitch, vol = rate0 - 11, -6, -9
    elif any(k in label for k in SOFT_LABELS):
        rate, pitch = rate0 - 9, -4
    return MALE, rate, pitch, vol


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('project', nargs='?')
    ap.add_argument('--test')
    ap.add_argument('--voice', default=MALE)
    ap.add_argument('--speed', type=float, default=1.0)
    ap.add_argument('--out', default='edge_hi_test.mp3')
    a = ap.parse_args()

    if a.test:
        x, mp3 = asyncio.run(synth(a.test, a.voice, round((a.speed - 1) * 100), -2, 0))
        Path(a.out).write_bytes(mp3)
        print(f'{a.out} ({len(x)/SR:.2f} s, {a.voice} x{a.speed})')
        return
    if not a.project:
        ap.error('project folder missing')

    P = Path(a.project)
    S = json.loads((P / 'script.json').read_text(encoding='utf-8'))
    speed = float(a.speed or S.get('speed', 1.0))

    async def build():
        out = [np.zeros(int(float(S.get('lead', 0.35)) * SR))]
        t = len(out[0]) / SR
        lines = [None] * len(S['lines'])
        for i, ln in enumerate(S['lines']):
            lab = (S.get('visual_labels') or [''] * len(S['lines']))[i] if i < len(S.get('visual_labels') or []) else ''
            voice, rate, pitch, vol = settings(lab, speed)
            x, _ = await synth(ln['text'], voice, rate, pitch, vol)
            dur = len(x) / SR
            lines[i] = {'i': i, 'text': ln['text'], 'start': round(t, 3), 'end': round(t + dur, 3)}
            out.append(x)
            gap = float(ln.get('gap', S.get('gap', 0.24)))
            if i < len(S['lines']) - 1 and gap > 0:
                out.append(np.zeros(int(gap * SR)))
                t += gap
            t += dur
            if (i + 1) % 25 == 0:
                print(f'  {i+1}/{len(S["lines"])} lines, {t:.0f}s audio', flush=True)
        out.append(np.zeros(int(float(S.get('outro', 1.0)) * SR)))
        y = np.concatenate(out)
        y = y / (np.abs(y).max() + 1e-9) * 0.92
        (P / 'data').mkdir(exist_ok=True)
        wavfile.write(P / 'data/narration.wav', SR, (y * 32767).astype(np.int16))
        dur = len(y) / SR
        (P / 'data/lines.json').write_text(
            json.dumps({'duration': round(dur, 3), 'voice': 'hi_edge_neural', 'speed': speed, 'lines': lines}, indent=1),
            encoding='utf-8')
        print(f'data/narration.wav ({dur:.2f} s, edge neural male+female x{speed}) + data/lines.json')

    asyncio.run(build())


if __name__ == '__main__':
    main()
