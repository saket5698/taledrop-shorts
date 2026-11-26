Create one fresh unattended Hindi mythology short (Indian mythology, Devanagari script). This is a tiny, bounded CI writer: use at most 8 tool calls and stop as soon as the three output files are written.

HARD LIMITS
- Do NOT load the `faceless-shorts` skill. Do NOT read `STYLE.md`. Do NOT open or edit `src/shots.js` or any file under `src/`, `tools/`, `data/`, `review/`, or `renders/`.
- Do NOT run any shell command. The workflow already created the project and will generate `src/shots.js` deterministically.
- Do NOT render, capture frames, read images, host, or upload. No `capture.mjs`, `voice.py`, `words.py`, `mix.py`, `ffmpeg`, or API calls.
- Do NOT ask questions. Decide and continue.
- Work only inside `work/<slug>/script.json`, `work/<slug>/publish.json`, and `state-hi/<slug>.json`.
- Write original Hindi narration only. No copied creator scripts, no AI images or video.

STEPS
1. Read `state/current.json`. Use its exact `slug` and `mode` (`hindi-mythology`).
2. Read `AUTO_LOG-hi.md`. Read only the `title` lines from `state-hi/*.json` (one grep) to avoid duplicate premises. Never repeat a story already used.
3. Pick one fresh, specific, visually tellable Indian mythology episode: a puranic incident, a local legend tied to a temple or river, a Himalayan folk tale, a Mahabharata/Ramayana side episode, or a regional deity's origin story. Frame every supernatural claim as what the text or the tradition says ("ग्रंथ कहते हैं...", "लोककथा के अनुसार...", "मंदिर की परंपरा बताती है..."). Respectful tone, no mockery of any faith, no sectarian comparison, no gore.
4. Verify two reliable sources with at most 4 webfetch/websearch calls total. Prefer the primary text (chapter and verse), a university/museum/government archive, or a major outlet. If you cannot verify two, choose another story. Record full `https://` URLs.
5. Write the three files below. Then stop immediately.

`work/<slug>/script.json` — valid JSON with exactly these keys:
- All numeric fields MUST be JSON numbers, never strings (for example `0.42`, not `"0.42"`).
- `title`: unique Hindi hook-style title, max 90 chars.
- `voice`: `hi-pratham`
- `speed`: `0.98` (calm, storyteller pace)
- `lead`: `0.35`, `outro`: `1.0`, `gap`: `0.40`, `music`: `tension`
- `sources`: array of exactly 2 strings, each `Publisher, "Title" (what it supports) https://full-url`
- `visual_labels`: array of exactly 10 SHORT Devanagari labels (2–8 characters), one per line, ordered to match `lines`. These are stamped on screen, so use plain nouns: `मंदिर`, `नदी`, `शाप`, `वरदान`, `वन`, `त्रिशूल`, `गुफा`, `अग्नि`, `सरोवर`, `रात`.
- `lines`: exactly 10 objects, each `{ "text": "...", "caps": "chunk | chunk" }`. Total 85–100 Devanagari words (about 35–41 seconds). First line is a hook that lands in the first 2 seconds. Write numbers as Hindi words. Each caption chunk is 1–3 Devanagari words with exactly one leading `*` marking the highlighted word.

`work/<slug>/publish.json` — valid JSON with exactly these keys:
- `title`: same as script title
- `description`: 2–4 Hindi sentences, then sources, then hashtags; must end with `#shorts`
- `tags`: 5–8 lowercase words (Hindi in Devanagari or romanized, no `#`)
- `instagram_caption`: Hindi hook first line, short body, sources, then hashtags ending with `#reels #shorts`, under 2200 chars
- `cover_time`: 1.8

`state-hi/<slug>.json` — valid JSON:
```json
{"slug":"<slug>","mode":"hindi-mythology","title":"<title>","sources":["<url>","<url>"]}
```

Visual direction (the deterministic shots use it; do not describe shots in the script):
- Quiet one-light 3D places: stone temples at night, ghats, forest shrines, mountain passes, a single lamp.
- One glowing subject (a trident, a lamp, a river, a deer); other figures stay terracotta silhouettes.
- Parchment maps, gold ribbons, crimson string, Devanagari typewriter stamps, calm deep male Hindi voice (`hi-pratham`) over `music: tension`.
- No gore; no disrespect to any deity or living person; every claim attributed to the text or the tradition.

Count check: 10 lines = 10 `visual_labels` = 10 shots. Original writing only. Stop after writing; the workflow handles everything else.
