Create one fresh unattended TaleDrop short.

1. Read `state/current.json`. It contains `slug` and `mode`. Mode is `deep-dive`.
2. Load the `faceless-shorts` skill and read `.opencode/skills/faceless-shorts/styles/deep-dive/STYLE.md` in full.
3. Check `AUTO_LOG.md` and all files in `state/`. Pick a fresh, specific, visually explainable science/body/how-it-works premise that has never been used. Good lanes: what happens inside the body, why a reflex happens, how a clever everyday mechanism works. Avoid the already-used blushing topic and the bank story.
4. Verify at least two reliable sources with webfetch/websearch. If verification fails, choose another topic.
5. Create the project with:
   `bash .opencode/skills/faceless-shorts/scripts/new_video.sh deep-dive <slug> --dir work`
6. Write original `work/<slug>/script.json`, rewrite `work/<slug>/src/shots.js`, write `work/<slug>/publish.json`, and write `state/<slug>.json` exactly as described in `CLOUD_AGENT.md`.
7. Keep it 30–40 seconds, 90–110 words, hook in the first 2 seconds, one-word caption style, and a clean visual payoff.
8. Stop. Do not render, host, or upload. The workflow handles those steps.

Work only inside `work/<slug>/` and `state/<slug>.json`. Never ask questions.
