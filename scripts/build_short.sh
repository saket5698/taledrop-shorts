#!/usr/bin/env bash
# Deterministic build + publish for one generated short. Called by GitHub Actions.
set -euo pipefail

SLUG="${1:?usage: build_short.sh <slug> [mode]}"
MODE="${2:-}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJ="$ROOT/work/$SLUG"
SKILL="$ROOT/.opencode/skills/faceless-shorts"

export FACELESS_HOME="${FACELESS_HOME:-$ROOT/.cache/faceless}"
export SOFTWARE_GL="${SOFTWARE_GL:-1}"
export QS="${QS:-&res=0.6&aa=0&shadow=1024}"
export FPS="${FPS:-24}"
export CHROME="${CHROME:-/usr/bin/google-chrome}"

[ -f "$PROJ/script.json" ] || { echo "missing $PROJ/script.json" >&2; exit 2; }
[ -f "$PROJ/src/shots.js" ] || { echo "missing $PROJ/src/shots.js" >&2; exit 2; }
[ -f "$PROJ/publish.json" ] || { echo "missing $PROJ/publish.json" >&2; exit 2; }

python3 - "$PROJ/script.json" "$PROJ/publish.json" <<'PY'
import json, sys
for path, keys in ((sys.argv[1], ("speed", "lead", "outro", "gap")), (sys.argv[2], ("cover_time",))):
    data = json.load(open(path, encoding="utf-8"))
    for key in keys:
        if key in data:
            data[key] = float(data[key])
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)
PY

cd "$PROJ"
echo "== timing =="
bash "$SKILL/scripts/py" "$SKILL/scripts/voice.py" .
bash "$SKILL/scripts/py" "$SKILL/scripts/words.py" .

echo "== engine checks =="
node tools/capture.mjs check 2>&1 | tee check.log
grep -q 'CHECK OK' check.log || { echo "CHECK FAILED" >&2; exit 3; }

echo "== audio =="
node tools/capture.mjs cues
bash "$SKILL/scripts/py" tools/mix.py .
ffmpeg -hide_banner -i data/mix.wav -af volumedetect -f null - 2>&1 | tee audio.log
grep -q 'max_volume' audio.log || { echo "volumedetect failed" >&2; exit 4; }

echo "== contact sheet =="
node tools/capture.mjs sheet review/all.jpg 1 10

echo "== render =="
node tools/capture.mjs video "renders/$SLUG.mp4"

echo "== verify MP4 =="
MP4="renders/$SLUG.mp4"
[ -s "$MP4" ] || { echo "empty MP4" >&2; exit 5; }
clean_probe() { tr -d ',\r\n'; }
DUR="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$MP4" | clean_probe)"
W="$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$MP4" | clean_probe)"
H="$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$MP4" | clean_probe)"
VCODEC="$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 "$MP4" | clean_probe)"
ACODEC="$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of csv=p=0 "$MP4" | clean_probe)"
python3 - "$DUR" "$W" "$H" "$VCODEC" "$ACODEC" <<'PY'
import sys
dur, w, h, vcodec, acodec = sys.argv[1:6]
assert 29.0 <= float(dur) <= 46.0, f"bad duration {dur}"
assert (w, h) == ('1080', '1920'), f"bad size {w}x{h}"
assert vcodec == 'h264', f"bad video codec {vcodec}"
assert acodec == 'aac', f"bad audio codec {acodec}"
print(f"verified {dur}s {w}x{h} {vcodec}/{acodec}")
PY

echo "== cover =="
COVER_TIME="$(jq -r '.cover_time // 1.8' publish.json)"
ffmpeg -v error -y -ss "$COVER_TIME" -i "$MP4" -frames:v 1 -q:v 2 review/cover.jpg

echo "== publish =="
python3 "$ROOT/scripts/publish.py" --project "$PROJ" --mode "$MODE"
