Create one fresh unattended TaleDrop Deep Dive 3D short. This is a tiny, bounded CI writer: use at most 8 tool calls and stop as soon as the three output files are written.

HARD LIMITS
- Do NOT load the `faceless-shorts` skill. Do NOT read `STYLE.md`. Do NOT open or edit `src/shots.js` or any file under `src/`, `tools/`, `data/`, `review/`, or `renders/`.
- Do NOT run any shell command. The workflow already created the project and will generate `src/shots.js` deterministically.
- Do NOT render, capture frames, read images, host, or upload. No `capture.mjs`, `voice.py`, `words.py`, `mix.py`, `ffmpeg`, or API calls.
- Do NOT ask questions. Decide and continue.
- Work only inside `work/<slug>/script.json`, `work/<slug>/publish.json`, and `state/<slug>.json`.

STEPS
1. Read `state/current.json`. Use its exact `slug` and `mode` (`deep-dive`).
2. Read `AUTO_LOG.md`. Read only the `title` lines from `state/*.json` (one grep) to avoid duplicate premises. Never use the blushing topic or the bank story.
3. Pick a fresh, specific, visually explainable science/body/how-it-works premise: what happens inside the body, why a reflex happens, or how a clever everyday mechanism works.
4. Verify two reliable sources with at most 4 webfetch/websearch calls total. If you cannot verify two, choose another topic. Record full `https://` URLs.
5. Write the three files below. Then stop immediately.

`work/<slug>/script.json` — valid JSON with exactly these keys:
- `title`: unique hook-style title, max 100 chars.
- `voice`: `am_michael`
- `speed`: `1.05`
- `lead`: `0.35`, `outro`: `1.0`, `gap`: `0.26`, `music`: `tension`
- `sources`: array of exactly 2 strings, each `Publisher, "Title" (what it supports) https://full-url`
- `visual_labels`: array of exactly 10 short uppercase strings, max 14 chars each, one per line, ordered to match `lines`. Examples: `HOOK`, `OXYGEN`, `CO2 RISES`, `ALARM`, `PAYOFF`.
- `lines`: exactly 10 objects, each `{ "text": "...", "caps": "chunk | chunk" }`. Total 90–110 words. First line is a hook that lands in 2 seconds. Each caption chunk is 1–3 words with exactly one leading `*` marking the yellow word.

`work/<slug>/publish.json` — valid JSON with exactly these keys:
- `title`: same as script title
- `description`: 2–4 sentences, then sources, then hashtags; must end with `#shorts`
- `tags`: 5–8 lowercase words, no `#`
- `instagram_caption`: hook first line, short body, sources, then hashtags ending with `#reels #shorts`, under 2200 chars
- `cover_time`: 1.8

`state/<slug>.json` — valid JSON:
```json
{"slug":"<slug>","mode":"deep-dive","title":"<title>","sources":["<url>","<url>"]}
```

Original writing only. No copied creator scripts. Stop after writing; the workflow handles everything else.
