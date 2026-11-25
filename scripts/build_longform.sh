#!/usr/bin/env bash
# Deterministic build + unattended YouTube publish of one Hindi long-form episode.
set -euo pipefail
SLUG="$1"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJ="$ROOT/work/$SLUG"
TOOLS="$ROOT/longform"
PY="${PYTHON:-python3}"

echo "==> preparing project $PROJ"
cp -f "$TOOLS/index.html" "$TOOLS/main.js" "$PROJ/"
mkdir -p "$PROJ/tools" "$PROJ/fonts" "$PROJ/data" "$PROJ/renders"
cp -f "$TOOLS/tools/capture.mjs" "$TOOLS/tools/mix.py" "$PROJ/tools/"
cp -f "$TOOLS/fonts/NotoSansDevanagari-Bold.ttf" "$PROJ/fonts/"
cp -f "$TOOLS/make_cues.py" "$PROJ/"

echo "==> Neural Hindi voices (male storyteller + female character)"
"$PY" "$TOOLS/scripts/voice_edge_hi.py" "$PROJ"
"$PY" - "$PROJ/data/lines.json" <<'PY'
import json, sys
d = json.load(open(sys.argv[1], encoding='utf-8'))
dur = d['duration']
print(f'narration duration: {int(dur//60)}:{int(dur%60):02d}')
if not (570 <= dur <= 750):
    sys.exit('duration outside 9.5-12.5 min; refusing to render')
PY
"$PY" "$TOOLS/scripts/words.py" "$PROJ" --spread
(cd "$PROJ" && "$PY" make_cues.py && "$PY" tools/mix.py)

echo "==> render (1080x1920, 20 fps, high quality)"
export SOFTWARE_GL=1 QS='&res=0.7&aa=0&shadow=1024' FPS=20
(cd "$PROJ" && node tools/capture.mjs video "renders/$SLUG.mp4")
MP4="$PROJ/renders/$SLUG.mp4"
[ -s "$MP4" ] || { echo "render missing" >&2; exit 2; }

echo "==> publish"
TITLE=$("$PY" -c 'import json,sys; print(json.load(open(sys.argv[1],encoding="utf-8"))["title"])' "$PROJ/publish.json")
DESC=$("$PY" -c 'import json,sys; d=json.load(open(sys.argv[1],encoding="utf-8")); print(d.get("description",""))' "$PROJ/publish.json")
TAGS=$("$PY" -c 'import json,sys; d=json.load(open(sys.argv[1],encoding="utf-8")); print(",".join(d.get("tags",["hindi","kahani","suspense","taledrop"])))' "$PROJ/publish.json")
"$PY" "$ROOT/scripts/publish_longform.py" "$MP4" --title "$TITLE" --description "$DESC" --tags "$TAGS"
