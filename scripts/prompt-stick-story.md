Create one fresh unattended TaleDrop short.

1. Read `state/current.json`. It contains `slug` and `mode`. Mode is `stick-story`.
2. Load the `faceless-shorts` skill and read `.opencode/skills/faceless-shorts/styles/stick-story/STYLE.md` in full.
3. Check `AUTO_LOG.md` and all files in `state/`. Pick a fresh, practical survival/what-would-you-do-if premise that has never been used. Good lanes: everyday emergencies, outdoors, fire, weather, water, lost in a city. Avoid the already-used blushing topic and the bank story.
4. Verify at least two reliable sources with webfetch/websearch. Use official safety agencies, universities, or established references. If verification fails, choose another topic.
5. Create the project with:
   `bash .opencode/skills/faceless-shorts/scripts/new_video.sh stick-story <slug> --dir work`
6. Write original `work/<slug>/script.json`, rewrite `work/<slug>/src/shots.js`, write `work/<slug>/publish.json`, and write `state/<slug>.json` exactly as described in `CLOUD_AGENT.md`.
7. Keep it 30–45 seconds, 90–110 words, hook in the first 2 seconds, concrete rule → mistake → payoff → threat ending. Follow the stick-story caption rules.
8. Stop. Do not render, host, or upload. The workflow handles those steps.

Work only inside `work/<slug>/` and `state/<slug>.json`. Never ask questions.
