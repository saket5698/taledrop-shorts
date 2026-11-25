# TaleDrop cloud shorts

Unattended daily YouTube Shorts + Instagram Reels. GitHub Actions generates a fresh sourced script, renders it headlessly, verifies the MP4, hosts it, and publishes to both platforms. Your laptop can be off.

## Schedule

| UTC | Asia/Kolkata | Output |
|---|---|---|
| 06:30 | 12:00 | Dark Mythology History (myths and old records, 10 lines) |
| 12:30 | 18:00 | Stick-figure survival story |

Manual runs can pick `deep-dive`, `dark-mythology-history` or `stick-story`; the two cron slots stay as above (18:00 is still stick-story). The workflow is queued, not overlapping (`concurrency` group). If a run fails, it logs the reason and the next slot tries a fresh topic.

## One-time setup

### 1. Create the GitHub repository

This folder is already a Git repo skeleton. Create a **new empty repository** on GitHub (private or public), then run from this folder:

```bash
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
git branch -M main
git push -u origin main
```

Public repos get more free Actions minutes. Private repos are fine if you have enough minutes. The code contains no secrets.

### 2. Add repository secrets

Go to **Settings → Secrets and variables → Actions → New repository secret**.

| Secret | Required | How to get it |
|---|---|---|
| `LLM_API_KEY` | Yes | A **free OpenCode Console** API key from <https://opencode.ai/console> (no subscription needed). The workflow passes it as `OPENCODE_API_KEY`. The repo config selects the free `opencode/deepseek-v4.1-flash-free` model. |
| `YOUTUBE_CLIENT_ID` | Yes | From `scripts/youtube_auth.py` (below). |
| `YOUTUBE_CLIENT_SECRET` | Yes | From `scripts/youtube_auth.py`. |
| `YOUTUBE_REFRESH_TOKEN` | Yes | From `scripts/youtube_auth.py`. |
| `IG_ACCESS_TOKEN` | Yes | Long-lived Instagram Graph API token for the TaleDrop **Business** account. |
| `IG_USER_ID` | Yes | Instagram user id, e.g. `17841471929026864`. |
| `IG_APP_ID` | No | Meta app id that issued `IG_ACCESS_TOKEN`. Defaults to the TaleDrop app id in `publish.py`. |
| `R2_ACCOUNT_ID` | No | Cloudflare R2. If all five R2 secrets are set, uploads use stable R2 URLs. |
| `R2_ACCESS_KEY_ID` | No | Cloudflare R2. |
| `R2_SECRET_ACCESS_KEY` | No | Cloudflare R2. |
| `R2_BUCKET` | No | Cloudflare R2 bucket name. |
| `R2_PUBLIC_BASE_URL` | No | Public bucket URL, e.g. `https://pub-xxxx.r2.dev`. |

If you skip R2, the workflow uses `uguu.se` (public, ~3 hour expiry). The MP4 itself is only on a temp host; YouTube/Instagram copy it during upload.

The configured writer uses a **free** OpenCode model, so no subscription is required. It has daily request limits, which are plenty for two shorts per day. Rendering, hosting, and uploading are also $0. If you later want a stronger model, change `model` in `.opencode/opencode.json` and the matching credential env in `.github/workflows/shorts.yml`.

### 3. YouTube credentials

In Google Cloud Console, enable **YouTube Data API v3**, create an **OAuth client ID** of type *Desktop app*, download `client_secret.json`, then run on your own machine:

```bash
python scripts/youtube_auth.py path/to/client_secret.json
```

Sign in with the account that owns/manages TaleDrop. Paste the three printed values into the matching GitHub secrets. Do **not** commit `client_secret.json`.

### 4. Instagram credentials

Use the Meta Graph API with `instagram_content_publish` and `pages_manage_posts` (or the scopes required by your app). The connected account must be an **Instagram Business** account linked to a Facebook Page you administer. Tokens expire; refresh or replace `IG_ACCESS_TOKEN` when Meta invalidates it.

### 5. Test before trusting the schedule

In GitHub, open **Actions → TaleDrop daily shorts → Run workflow** and pick `dark-mythology-history` (or `deep-dive` / `stick-story` for a manual run). Watch the job. On success you will see:

- a YouTube URL in the job log
- an Instagram Reel permalink in the job log
- `AUTO_LOG.md` and `state/history.json` committed back to the repo
- a 7-day QA artifact containing the MP4, contact sheet, cover, `check.log` and `audio.log`

Only after a successful manual test will the cron slots be reliable.

## Files that matter

- `.github/workflows/shorts.yml` — schedule and steps.
- `.opencode/opencode.json` — cloud model, permissions, no questions/automations.
- `.opencode/skills/faceless-shorts/` — the complete renderer skill, copied locally.
- `CLOUD_AGENT.md` — hard rules for the script-writing agent.
- `scripts/prompt-*.md` — the three mode prompts (`deep-dive`, `dark-mythology-history`, `stick-story`).
- `scripts/build_short.sh` — timing, checks, audio, render, MP4 verification, cover.
- `scripts/publish.py` — duplicate checks, hosting, YouTube upload, Instagram Reel publish, logging.
- `state/history.json` — published-video memory used to avoid reposts on retries.

## Important limits

- The script writer uses web sources and the workflow verifies engine/audio/video programmatically. There is **no human visual review** before publishing; the contact sheet is saved as an artifact so you can audit it afterwards.
- Two software renders per day can exceed the free Actions minutes of a private repo. Use a public repo or increase limits if needed.
- The local OpenCode automations on the laptop were paused when this repo was prepared. Keep them paused once the cloud workflow is live, or you will get duplicate posts.
- YouTube can upload the rendered file directly. Instagram needs a public video URL; that is why R2 (or a temp host) is part of the flow.

## Troubleshooting Instagram

`Instagram create media container failed (401)` or `API access blocked (code 200, subcode 5258005)` means Meta has blocked the **app** that issued `IG_ACCESS_TOKEN`, not the Instagram account. Do not just refresh the token from the same app; create a new Meta app (type *Business*), link the TaleDrop Facebook Page and Instagram Business account, then generate a long-lived token with `instagram_basic`, `instagram_content_publish`, `pages_show_list` and `business_management`. Update `IG_ACCESS_TOKEN`, `IG_USER_ID` and `IG_APP_ID`.

After updating the secrets, run the **Instagram token check** workflow (`ig-check.yml`, manual dispatch) to confirm access before the next scheduled run. Instagram failures no longer fail the whole job: YouTube still publishes, and `AUTO_LOG.md` records `youtube published; instagram failed: <reason>`.
