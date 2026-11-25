Create one fresh unattended TaleDrop Dark Mythology History short, in English. This is a tiny, bounded CI writer: use at most 8 tool calls and stop as soon as the three output files are written.

HARD LIMITS
- Do NOT load the `faceless-shorts` skill. Do NOT read `STYLE.md`. Do NOT open or edit `src/shots.js` or any file under `src/`, `tools/`, `data/`, `review/`, or `renders/`.
- Do NOT run any shell command. The workflow already created the project and will generate `src/shots.js` deterministically.
- Do NOT render, capture frames, read images, host, or upload. No `capture.mjs`, `voice.py`, `words.py`, `mix.py`, `ffmpeg`, or API calls.
- Do NOT ask questions. Decide and continue.
- Work only inside `work/<slug>/script.json`, `work/<slug>/publish.json`, and `state/<slug>.json`.
- Write original English narration only. No copied creator scripts, no AI images or video.

STEPS
1. Read `state/current.json`. Use its exact `slug` and `mode` (`dark-mythology-history`).
2. Read `AUTO_LOG.md`. Read only the `title` lines from `state/*.json` (one grep) to avoid duplicate premises. Never reuse an earlier premise, the blushing topic or the bank story.
3. Pick a fresh, specific, visually explainable dark mythology/history premise: an old chronicle, a documented legend, a buried mound, a temple, a lost market, a field at night, a river with a strange glow, or a historical mystery. Frame every claim as what the records or legends say ("the chronicle records...", "the legend tells...", "the case file notes..."). No gore. Never accuse a real living person of a crime or wrongdoing.
4. Verify two reliable sources with at most 4 webfetch/websearch calls total. Prefer museum, university, government or scholarly archives, or major outlets. If you cannot verify two, choose another topic. Record full `https://` URLs.
5. Write the three files below. Then stop immediately.

`work/<slug>/script.json` — valid JSON with exactly these keys:
- All numeric fields MUST be JSON numbers, never strings (for example `0.42`, not `"0.42"`).
- `title`: unique hook-style title, max 100 chars.
- `voice`: `am_onyx`
- `speed`: `0.95` (low, calm delivery)
- `lead`: `0.35`, `outro`: `1.0`, `gap`: `0.42`, `music`: `tension`
- `sources`: array of exactly 2 strings, each `Publisher, "Title" (what it supports) https://full-url`
- `visual_labels`: array of exactly 10 short uppercase strings, max 14 chars each, one per line, ordered to match `lines`. Examples: `MOUND`, `RED LIGHT`, `MAP`, `RIVER`, `OPEN FILE`.
- `lines`: exactly 10 objects, each `{ "text": "...", "caps": "chunk | chunk" }`. Total 90–110 words. First line is a hook that lands in the first 2 seconds. Each caption chunk is 1–3 words with exactly one leading `*` marking the highlighted typewriter word.

`work/<slug>/publish.json` — valid JSON with exactly these keys:
- `title`: same as script title
- `description`: 2–4 sentences, then sources, then hashtags; must end with `#shorts`
- `tags`: 5–8 lowercase words, no `#`
- `instagram_caption`: hook first line, short body, sources, then hashtags ending with `#reels #shorts`, under 2200 chars
- `cover_time`: 1.8

`state/<slug>.json` — valid JSON:
```json
{"slug":"<slug>","mode":"dark-mythology-history","title":"<title>","sources":["<url>","<url>"]}
```

Visual direction (the deterministic shots use it; do not describe shots in the script):
- Quiet one-light 3D places: mounds, temples, markets and fields at night.
- A single red-glowing subject; other people stay terracotta silhouettes.
- Parchment maps and gold date ribbons, crimson string and case-file inserts, typewriter captions.
- Slow, soft cues and a low calm `am_onyx` x0.95 voice over `music: tension`.
- No gore, no real living-person accusations; every claim attributed to what records or legends say.

Count check: 10 lines = 10 `visual_labels` = 10 shots. Original writing only. Stop after writing; the workflow handles everything else.
