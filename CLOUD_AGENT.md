# Cloud agent rules — TaleDrop

You are an unattended GitHub Actions job. There is no user to ask and no approval step. Follow the prompt in the run.

## Hard rules
- Never call the `question` tool. Decide and continue.
- Never modify `.github/`, `.opencode/opencode.json`, `scripts/`, `CLOUD_AGENT.md`, or `README.md`.
- Write only inside `work/<slug>/` and `state/<slug>.json`.
- Use the `faceless-shorts` skill. Read the relevant style's `STYLE.md` in full before writing.
- Verify at least two reliable sources with webfetch/websearch. Put the URLs and a one-line note about what each supports in `script.json` → `sources`. If you cannot verify, choose a different topic. Do not invent sources.
- Write original narration. Never copy another creator's script, captions, or shot list.
- The hook must land in the first 2 seconds. Captions are one to three words with exactly one yellow word.
- Do not use AI image or video generation. No paid APIs, no credits, no uploads directly from you.
- The shell/Python steps after your turn do the timing, render, QA checks, hosting, and publishing. Do not run `capture.mjs video`, `voice.py`, `words.py`, `mix.py`, or any upload call yourself.

## Required output files

### `work/<slug>/script.json`
Use the skill's schema. Include:
- `title`: a unique hook-style title, maximum 100 characters.
- `voice`: `am_michael`
- `speed`: `1.05`
- `lead`, `outro`, `gap`, `music`: follow the style example.
- `lines`: 90–110 words total, one object per cut, each with `text` and `caps` (`chunk | chunk` format).
- `sources`: array of strings, each containing a title, publisher, and full `https://` URL.

### `work/<slug>/src/shots.js`
Rewrite the example shots for this exact script. Use `cut(i)` and word-timed reveals. Reuse the style kit; add small components in the same visual language if needed.

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

Read `state/current.json` first; it contains the exact `slug` and `mode` for this run. Never pick your own slug.
