#!/usr/bin/env bash
# Deterministic build + publish for one 2D animated Hindi short (mythology, ~35 s).
# Reuses the longform/ 2D Dream-Toon engine but with a short script and a short duration gate.
set -euo pipefail

SLUG="${1:?usage: build_short_2d.sh <slug>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJ="$ROOT/work/$SLUG"
LONG="$ROOT/longform"
PY="${PYTHON:-python3}"

echo "==> preparing project $PROJ"
mkdir -p "$PROJ" "$PROJ/tools" "$PROJ/fonts" "$PROJ/data" "$PROJ/renders" "$PROJ/review"
cp -f "$LONG/index.html" "$LONG/main.js" "$PROJ/"
cp -f "$LONG/tools/capture.mjs" "$LONG/tools/mix.py" "$PROJ/tools/"
cp -f "$LONG/fonts/NotoSansDevanagari-Bold.ttf" "$PROJ/fonts/"
cp -f "$LONG/make_cues.py" "$PROJ/"
[ -f "$PROJ/script.json" ] || { echo "missing $PROJ/script.json" >&2; exit 2; }
[ -f "$PROJ/publish.json" ] || { echo "missing $PROJ/publish.json" >&2; exit 2; }

echo "==> Neural Hindi voice (Piper rohan, offline)"
"$PY" "$LONG/scripts/voice_piper_hi.py" "$PROJ"
"$PY" - "$PROJ/data/lines.json" <<'PY'
import json, sys
d = json.load(open(sys.argv[1], encoding='utf-8'))
dur = d['duration']
print(f'narration duration: {dur:.1f}s')
if not (25 <= dur <= 55):
    sys.exit('duration outside 25-55 s; refusing to render')
PY
"$PY" "$LONG/scripts/words.py" "$PROJ" --spread
(cd "$PROJ" && "$PY" make_cues.py && "$PY" tools/mix.py)

echo "==> render (1080x1920, 24 fps)"
export SOFTWARE_GL=1 QS='&res=0.7&aa=0&shadow=1024' FPS=24
(cd "$PROJ" && node tools/capture.mjs video "renders/$SLUG.mp4")
MP4="$PROJ/renders/$SLUG.mp4"
[ -s "$MP4" ] || { echo "render missing" >&2; exit 2; }

echo "==> publish"
if [ "${SKIP_PUBLISH:-0}" = "1" ]; then
  echo "SKIP_PUBLISH=1 (no channel token yet, or review-only run): MP4 kept in renders/ and uploaded as a QA artifact"
else
  COVER_TIME="$(jq -r '.cover_time // 1.8' "$PROJ/publish.json" 2>/dev/null || echo 1.8)"
  ffmpeg -v error -y -ss "$COVER_TIME" -i "$MP4" -frames:v 1 -q:v 2 "$PROJ/review/cover.jpg"
  TITLE=$("$PY" -c 'import json,sys; print(json.load(open(sys.argv[1],encoding="utf-8"))["title"])' "$PROJ/publish.json")
  DESC=$("$PY" -c 'import json,sys; d=json.load(open(sys.argv[1],encoding="utf-8")); print(d.get("description",""))' "$PROJ/publish.json")
  TAGS=$("$PY" -c 'import json,sys; d=json.load(open(sys.argv[1],encoding="utf-8")); print(",".join(d.get("tags",["hindi","kahani","mythology","kathasutra"])))' "$PROJ/publish.json")
  "$PY" "$ROOT/scripts/publish.py" --project "$PROJ" --mode hindi-mythology-2d --lang hi
fi
