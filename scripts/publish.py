#!/usr/bin/env python3
"""Publish one generated short to YouTube and Instagram Reels.

Deterministic, unattended, no approval prompts. Called by build_short.sh after the MP4 is verified.

Required environment:
  YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN
  IG_ACCESS_TOKEN, IG_USER_ID
Optional: IG_APP_ID (defaults to the TaleDrop Meta app id)
Optional (recommended for stable public video URLs):
  R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL

If R2 is not configured, the MP4 is hosted on uguu.se (public, ~3 hour expiry) and the URL is verified.
"""
import argparse
import json
import os
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

ROOT = Path(__file__).resolve().parent.parent
STATE = ROOT / "state"
HISTORY = STATE / "history.json"
LOG = ROOT / "AUTO_LOG.md"
IG_API = "https://graph.facebook.com/v21.0"
IG_APP_ID = os.environ.get("IG_APP_ID") or "2412489276182320"
YT_SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"]

IST = timezone(timedelta(hours=5, minutes=30))
TAG_BLOCK = ["truestory", "shorts", "facts", "storytime", "didyouknow", "viral", "animation", "taledrop"]

IG_BLOCKED_HINT = (
    "Instagram token diagnosis: the Meta app behind IG_ACCESS_TOKEN has API access blocked "
    "(code 200 / subcode 5258005). Generate a fresh long-lived token from a Meta app with "
    "instagram_basic + instagram_content_publish + pages_show_list + business_management, "
    "then update IG_ACCESS_TOKEN, IG_USER_ID and IG_APP_ID."
)


def fail(msg):
    raise RuntimeError(msg)


def ig_params(extra):
    params = dict(extra)
    params.setdefault("app_id", IG_APP_ID)
    return params


def api_error(resp, what):
    try:
        body = resp.json()
    except Exception:
        body = {"text": resp.text[:300]}
    err = body.get("error") if isinstance(body, dict) else None
    detail = err.get("message") if isinstance(err, dict) else body
    if isinstance(err, dict) and err.get("error_user_msg"):
        detail = f"{detail} / {err['error_user_msg']}"
    fail(f"{what} failed ({resp.status_code}): {detail}")


def load_history():
    if HISTORY.exists():
        try:
            return json.loads(HISTORY.read_text(encoding="utf-8"))
        except Exception:
            pass
    return []


def save_history(entries):
    STATE.mkdir(parents=True, exist_ok=True)
    HISTORY.write_text(json.dumps(entries, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def append_log(line):
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with LOG.open("a", encoding="utf-8") as fh:
        fh.write(f"- {datetime.now(IST).strftime('%Y-%m-%d %H:%M IST')} | {line}\n")


def validate(meta, script):
    title = str(meta.get("title", "")).strip()
    if not title or len(title) > 100:
        fail("publish.json title must be 1–100 characters")
    if title != script.get("title"):
        fail("publish.json title does not match script.json title")

    description = str(meta.get("description", "")).strip()
    if not description or not description.lower().endswith("#shorts"):
        fail("description must end with #shorts")

    tags = meta.get("tags")
    if not isinstance(tags, list) or not (5 <= len(tags) <= 8):
        fail("tags must contain 5–8 entries")
    for tag in tags:
        t = str(tag).strip()
        if not t or "#" in t or t != t.lower() or " " in t:
            fail(f"invalid tag: {tag!r}")

    caption = str(meta.get("instagram_caption", "")).strip()
    if not caption or len(caption) > 2200 or not caption.lower().endswith("#reels #shorts"):
        fail("instagram_caption must be non-empty, <=2200 chars, and end with #reels #shorts")

    cover_time = float(meta.get("cover_time", 1.8) or 1.8)
    if cover_time < 0:
        fail("cover_time must be >= 0")
    return title, description, tags, caption


def verify_url(url, session):
    try:
        r = session.head(url, allow_redirects=True, timeout=45)
    except Exception as exc:
        fail(f"URL verification request failed: {exc}")
    ctype = r.headers.get("Content-Type", "").split(";")[0].strip().lower()
    if r.status_code not in (200, 206) or ctype != "video/mp4":
        fail(f"URL verification failed: HTTP {r.status_code}, content-type {ctype!r} for {url}")
    return url


def host_video(mp4: Path, slug: str, session):
    account = os.environ.get("R2_ACCOUNT_ID")
    key_id = os.environ.get("R2_ACCESS_KEY_ID")
    secret = os.environ.get("R2_SECRET_ACCESS_KEY")
    bucket = os.environ.get("R2_BUCKET")
    base = os.environ.get("R2_PUBLIC_BASE_URL")
    if all([account, key_id, secret, bucket, base]):
        import boto3
        key = f"taledrop/{slug}.mp4"
        s3 = boto3.client(
            "s3",
            endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
            aws_access_key_id=key_id,
            aws_secret_access_key=secret,
            region_name="auto",
        )
        with mp4.open("rb") as fh:
            s3.upload_fileobj(fh, bucket, key, ExtraArgs={"ContentType": "video/mp4"})
        url = base.rstrip("/") + "/" + key
        print(f"hosted on R2: {url}")
        return verify_url(url, session)

    print("R2 not configured; hosting on uguu.se (~3 hour expiry)")
    with mp4.open("rb") as fh:
        r = session.post(
            "https://uguu.se/upload",
            files={"files[]": (mp4.name, fh, "video/mp4")},
            timeout=240,
        )
    if not r.ok:
        api_error(r, "uguu upload")
    try:
        files = r.json().get("files") or []
        url = files[0]["url"]
    except Exception as exc:
        fail(f"could not read uguu response: {exc}")
    print(f"hosted on uguu: {url}")
    return verify_url(url, session)


def youtube_client():
    client_id = os.environ.get("YOUTUBE_CLIENT_ID")
    client_secret = os.environ.get("YOUTUBE_CLIENT_SECRET")
    refresh_token = os.environ.get("YOUTUBE_REFRESH_TOKEN")
    if not all([client_id, client_secret, refresh_token]):
        fail("missing YouTube secrets")
    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        client_id=client_id,
        client_secret=client_secret,
        token_uri="https://oauth2.googleapis.com/token",
        scopes=YT_SCOPES,
    )
    return build("youtube", "v3", credentials=creds, cache_discovery=False)


def yt_existing_title(youtube, title):
    try:
        res = youtube.search().list(part="snippet", forMine=True, type="video", q=title, maxResults=10).execute()
    except Exception as exc:
        print(f"YouTube duplicate search unavailable: {exc}", file=sys.stderr)
        return None
    for item in res.get("items", []):
        if item.get("snippet", {}).get("title", "").strip() == title:
            vid = item["id"].get("videoId")
            return f"https://www.youtube.com/watch?v={vid}" if vid else None
    return None


def yt_upload(youtube, mp4: Path, cover: Path, title, description, tags):
    body = {
        "snippet": {
            "title": title,
            "description": description,
            "tags": tags,
            "categoryId": "23",
            "defaultLanguage": "en",
            "defaultAudioLanguage": "en",
        },
        "status": {
            "privacyStatus": "public",
            "embeddable": True,
            "license": "youtube",
            "madeForKids": False,
            "selfDeclaredMadeForKids": False,
        },
    }
    media = MediaFileUpload(str(mp4), mimetype="video/mp4", resumable=True)
    req = youtube.videos().insert(part="snippet,status", body=body, media_body=media, notifySubscribers=True)
    response = None
    while response is None:
        status, response = req.next_chunk()
        if status:
            print(f"YouTube upload {int(status.progress() * 100)}%")
    video_id = response.get("id")
    if not video_id:
        fail("YouTube upload returned no video id")
    if cover.exists():
        try:
            youtube.thumbnails().set(
                videoId=video_id,
                media_body=MediaFileUpload(str(cover), mimetype="image/jpeg"),
            ).execute()
        except Exception as exc:
            print(f"WARNING: thumbnail set failed: {exc}", file=sys.stderr)
    return f"https://www.youtube.com/watch?v={video_id}"


def ig_existing(session, ig_user, title, caption):
    r = session.get(
        f"{IG_API}/{ig_user}/media",
        params=ig_params({"fields": "id,caption,timestamp,permalink", "limit": "25"}),
        timeout=45,
    )
    if r.status_code == 403:
        print(
            "WARNING: Instagram media list unavailable (403); using local history for duplicate checks",
            file=sys.stderr,
        )
        return None
    if not r.ok:
        api_error(r, "Instagram media list")
    for item in r.json().get("data", []):
        existing = item.get("caption") or ""
        if existing.strip() == caption or title in existing:
            return item.get("permalink") or f"https://www.instagram.com/({item['id']})"
    return None


def ig_publish(session, ig_user, video_url, title, caption):
    r = session.post(
        f"{IG_API}/{ig_user}/media",
        params=ig_params({"media_type": "REELS", "video_url": video_url, "caption": caption}),
        timeout=90,
    )
    if not r.ok:
        api_error(r, "Instagram create media container")
    container = r.json().get("id")
    if not container:
        fail("Instagram create container returned no id")

    status = "IN_PROGRESS"
    for attempt in range(20):
        q = session.get(
            f"{IG_API}/{container}",
            params=ig_params({"fields": "id,status,status_code"}),
            timeout=45,
        )
        if not q.ok:
            api_error(q, "Instagram container status")
        data = q.json()
        status = data.get("status_code", "IN_PROGRESS")
        if status == "FINISHED":
            break
        if status in ("ERROR", "EXPIRED"):
            fail(f"Instagram container {status}: {data.get('status')}")
        print(f"Instagram processing {attempt + 1}/20: {data.get('status')}")
        time.sleep(15)
    if status != "FINISHED":
        fail("Instagram processing timeout")

    p = session.post(
        f"{IG_API}/{ig_user}/media_publish",
        params=ig_params({"creation_id": container}),
        timeout=90,
    )
    if not p.ok:
        api_error(p, "Instagram publish")
    media_id = p.json().get("id")
    if not media_id:
        fail("Instagram publish returned no media id")

    v = session.get(
        f"{IG_API}/{media_id}",
        params=ig_params({"fields": "id,caption,media_type,timestamp,permalink"}),
        timeout=45,
    )
    if not v.ok:
        api_error(v, "Instagram verify")
    permalink = v.json().get("permalink") or f"https://www.instagram.com/({media_id})"
    return media_id, permalink


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--mode", default="")
    args = ap.parse_args()

    project = Path(args.project).resolve()
    meta = json.loads((project / "publish.json").read_text(encoding="utf-8"))
    script = json.loads((project / "script.json").read_text(encoding="utf-8"))
    title, description, tags, caption = validate(meta, script)

    mp4 = project / "renders" / f"{project.name}.mp4"
    cover = project / "review" / "cover.jpg"
    if not mp4.exists() or not cover.exists():
        fail(f"missing MP4 or cover in {project}")

    slug = project.name
    sources = script.get("sources", [])
    history = load_history()
    existing = next((e for e in history if e.get("slug") == slug or e.get("title") == title), None)
    session = requests.Session()
    session.headers.update({"User-Agent": "taledrop-cloud/1.0"})

    yt_url = existing.get("youtube_url") if existing else None
    ig_url = existing.get("instagram_url") if existing else None
    status = "youtube+instagram published"

    def record(status_text):
        entry = {
            "date": datetime.now(IST).isoformat(),
            "slug": slug,
            "mode": args.mode,
            "title": title,
            "youtube_url": yt_url,
            "instagram_url": ig_url,
            "sources": sources,
            "status": status_text,
        }
        current = [e for e in load_history() if e.get("slug") != slug and e.get("title") != title]
        current.append(entry)
        save_history(current)

    if not yt_url:
        youtube = youtube_client()
        duplicate = yt_existing_title(youtube, title)
        if duplicate:
            print(f"duplicate on YouTube, skipping both: {duplicate}")
            append_log(f"SKIPPED-DUPLICATE | {args.mode} | `{slug}` | {title} | {duplicate}")
            print(json.dumps({"status": "skipped-duplicate", "youtube_url": duplicate}))
            return
        video_url = host_video(mp4, slug, session)
        yt_url = yt_upload(youtube, mp4, cover, title, description, tags)
        # Save immediately so a later Instagram failure cannot cause a duplicate YouTube upload on retry.
        record("youtube uploaded; instagram pending")
    else:
        print(f"resuming existing YouTube upload: {yt_url}")
        video_url = None

    ig_user = os.environ.get("IG_ACCESS_TOKEN") and os.environ.get("IG_USER_ID")
    if ig_url:
        print(f"resuming existing Instagram Reel: {ig_url}")
    elif not ig_user:
        print("WARNING: Instagram secrets missing; skipped Reel")
        status = "youtube published; instagram skipped-missing-secrets"
    else:
        ig_user = os.environ["IG_USER_ID"]
        try:
            duplicate_ig = ig_existing(session, ig_user, title, caption)
            if duplicate_ig:
                ig_url = duplicate_ig
                status = "youtube published; instagram skipped-duplicate"
            else:
                if video_url is None:
                    video_url = host_video(mp4, slug, session)
                media_id, ig_url = ig_publish(session, ig_user, video_url, title, caption)
        except Exception as exc:
            reason = str(exc).replace("\n", " ")[:300]
            status = f"youtube published; instagram failed: {reason}"
            print(f"WARNING: Instagram Reel failed, YouTube is still live: {reason}", file=sys.stderr)
            if "API access blocked" in reason or '"code":200' in reason or "OAuthException" in reason:
                print(IG_BLOCKED_HINT, file=sys.stderr)

    record(status)
    append_log(
        f"{status} | {args.mode} | `{slug}` | {title} | "
        f"YT: {yt_url} | IG: {ig_url or 'none'} | sources: {len(sources)} verified"
    )
    print(json.dumps({"status": status, "youtube_url": yt_url, "instagram_url": ig_url}, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        append_log(f"FAILED | {sys.argv[1] if len(sys.argv) > 1 else ''} | {type(exc).__name__}: {exc}")
        raise
