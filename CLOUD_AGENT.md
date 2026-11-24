# Cloud agent rules — TaleDrop

You are a small, bounded, unattended GitHub Actions writer. There is no user to ask and no approval step. The workflow has already created the project; another deterministic step will generate `src/shots.js`. Your only job is to write three JSON files, then stop.

## Hard rules
- Use at most 8 tool calls. Stop immediately after the three output files are written.
- Never call `question`. Decide and continue.
- Never load the `faceless-shorts` skill. Never read `STYLE.md`. Never open or edit `src/shots.js` or anything under `src/`, `tools/`, `data/`, `review/`, or `renders/`.
- Never run a shell command. No `new_video.sh`, `capture.mjs`, `voice.py`, `words.py`, `mix.py`, `ffmpeg`, git, or upload calls.
- Never render, capture frames, read images, host, or upload. The CI steps after your turn do all of that.
- Never modify `.github/`, `.opencode/opencode.json`, `scripts/`, `CLOUD_AGENT.md`, or `README.md`.
- Read only `state/current.json`, `AUTO_LOG.md`, and the `title` fields of `state/*.json`. Do not read full state files.
- Use at most 4 webfetch/websearch calls to verify two reliable sources. If verification fails, choose another topic. Record full `https://` URLs.
- Write original narration. Never copy another creator's script, captions, or shot list.
- The hook must land in the first 2 seconds. Captions are 1–3 words with exactly one yellow word (prefix it with `*`).
- Use the exact `slug` and `mode` from `state/current.json`. Never pick your own slug.
- No AI image or video generation. No paid APIs, no credits.

## Required output files

### `work/<slug>/script.json`
Use the style values from the prompt. Include:
- `title`: unique hook-style title, maximum 100 characters.
- `voice`, `speed`, `lead`, `outro`, `gap`, `music`: exactly as specified in the prompt.
- `sources`: exactly 2 strings, each with publisher, title, what it supports, and a full `https://` URL.
- `visual_labels`: exactly 10 labels for `deep-dive` or 12 for `stick-story`, uppercase, max 14 chars, one per line in the same order as `lines`. The deterministic shot generator injects these into the visual template.
- `lines`: exactly 10 (`deep-dive`) or 12 (`stick-story`) objects, 90–110 words total, each with `text` and `caps` (`chunk | chunk` format).

### `work/<slug>/publish.json`
Write valid JSON with exactly these keys:
```json
{
  "title": "same as script.json title",
  "description": "2–4 sentences, then sources, then hashtags. Must end with #shorts",
  "tags": ["eight", "lowercase", "hashtags", "without", "the", "hash", "sign", "here"],
  "instagram_caption": "hook first line, short body, sources, then hashtags ending with #reels #shorts",
  "cover_time": 1.8
}
```
`tags` must contain 5–8 lowercase words with no `#`. `instagram_caption` must be under 2,200 characters and end with `#reels #shorts`.

### `state/<slug>.json`
Write:
```json
{
  "slug": "<slug>",
  "mode": "deep-dive or stick-story",
  "title": "<title>",
  "sources": ["<url>", "<url>"]
}
```
