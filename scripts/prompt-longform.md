You are writing ONE original Hindi suspense episode for TaleDrop's series "अंधेरे के पीछे".

Hard limits: at most 8 tool calls total, at most 3 web calls, no shell, no file creation except the two JSON files below. Do not load any skill. Do not render, generate images, or publish.

1. Read `state/history.json` (a JSON array of past episodes). Pick a FRESH real-world scientific/historical anchor that is not mentioned in any entry and is not any of: bank-for-a-dollar, blushing, ice-cream forehead freeze, goosebumps, hiccup, tornado, Gol Gumbaz whispering gallery.
2. Verify the anchor with exactly 2 independent web pages (use WebFetch on Wikipedia or another accessible site; prefer direct URLs over search). Record both URLs in `sources`.
3. Write a FICTIONAL suspense story inspired by Hindi mystery channels (Dream Toon / Kuku TV pacing) around that real anchor. The scientific/historical fact is real; every character, dialogue and event is fictional. Include a `disclaimer` saying exactly that.
4. Write ONLY Devanagari in every `text` and `caps` value (no English letters, no digits — spell numbers in Hindi words). Hindi TTS skips Latin characters and digits.
5. Produce 150–190 short lines (roughly 8–16 Devanagari words each) with a cold open in the first 2 lines, an episode title, three clues, a reveal, a final chill, and a closing source credit. Aim for ~10 minutes of spoken narration.

Write `work/__SLUG__/script.json` with exactly these keys:
{
  "title": "<Hindi episode title> | अंधेरे के पीछे",
  "series": "अंधेरे के पीछे",
  "slug": "__SLUG__",
  "language": "hi",
  "format": "longform-1080x1920",
  "voice": "hi_edge_neural",
  "speed": 1.05,
  "lead": 0.35, "gap": 0.22, "outro": 0.9,
  "music": "tension",
  "seed": <integer>,
  "sources": ["<title> <url>", "<title> <url>"],
  "disclaimer": "<Hindi sentence: scientific anchor real, characters/events fictional>",
  "chapters": [ <one integer 0..8 per line> ],
  "visual_labels": [ <one short uppercase label per line> ],
  "lines": [ {"text": "<Devanagari>", "caps": "<1-3 short Devanagari chunks separated by |>"} ]
}

`chapters` must have exactly the same length as `lines`: 0 cold open, 1 title, 2 setup, 3 clue one, 4 clue two, 5 clue three, 6 truth, 7 final chill, 8 sources/end.
`visual_labels` must have the same length. Use only these labels (uppercase, optional digits): COLD_OPEN, NICKNAME, MOTHER, ECHO_CALL, LIGHT, START, TITLE, PROMISE, PROMISE2, EP_TITLE, PLACE, WATCHMAN, YEARS, MEMORY, WALL, FEAR, WARNING, ARCHIVE, FILE_OPEN, SCIENTIST, YEAR1945, PAPER_TEST, COIN_TEST, MATCH, ECHO14, SUSPECT, UNDERSTAND, SIGN, TOUCH, LOOK_BACK, FEAR, TEST_PLAN, NIGHT, LISTEN, WHISPER, PHRASE, WHISPER_BACK, VOICE, MOTHER_VOICE, SHAKE, FULL_PHRASE, CROSSWALL, DISCOVER, SILENCE, STOP, NO_GHOST, CARRY, INNER, NEVER_LEFT, WALLS_STILL, WALL_ANSWER, OPEN_AGAIN, WAVES, SURFACE, NO_MIC, ECHO_RETURN, RECORDED, TESTS, ANSWER_YES, CAME_SECRET, WHY_SECRET, KEPT, FELT_AGAIN, STEADY, ONE_Q, REPLAY2, CUT_PART, DARKER, CLUE_INSIDE, DARK_SPEAKS, NEXT, SOURCES, SOURCE_NAMES, OUTRO.

Write `work/__SLUG__/publish.json`:
{"title": "<same as script title>", "description": "<2-3 Hindi sentences, then a blank line, then the two source URLs, then a blank line, then: यह एक काल्पनिक कहानी है; वैज्ञानिक आधार वास्तविक है।>", "tags": ["hindi","kahani","suspense","andhere-ke-peeche","taledrop"]}

Finally write `state/__SLUG__.json`: {"slug":"__SLUG__","topic":"<short topic>","sources":[...]} and append a new object to the top-level array in `state/history.json` (keep every existing entry unchanged): {"slug":"__SLUG__","mode":"longform","title":"<title>","sources":[...],"published_at":"<UTC ISO time>"}.

Do not print the JSON files into the chat. Just write the three files.
