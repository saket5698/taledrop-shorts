#!/usr/bin/env python3
"""Unattended YouTube upload for one Hindi long-form episode.

Fixed settings: public, Entertainment (24), Hindi, notify subscribers,
not made for kids, embeddable, standard license. No Instagram (video too long).
"""
import argparse
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

ROOT = Path(__file__).resolve().parent.parent
SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"]


def client():
    vals = [os.environ.get(k) for k in ("YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN")]
    if not all(vals):
        sys.exit("missing YouTube secrets")
    creds = Credentials(token=None, refresh_token=vals[2], client_id=vals[0], client_secret=vals[1],
                        token_uri="https://oauth2.googleapis.com/token", scopes=SCOPES)
    return build("youtube", "v3", credentials=creds, cache_discovery=False)


def existing(youtube, title):
    try:
        res = youtube.search().list(part="snippet", forMine=True, type="video", q=title, maxResults=10).execute()
    except Exception as exc:
        print(f"duplicate search unavailable: {exc}", file=sys.stderr)
        return None
    for it in res.get("items", []):
        if it.get("snippet", {}).get("title", "").strip() == title:
            return "https://www.youtube.com/watch?v=" + it["id"]["videoId"]
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mp4")
    ap.add_argument("--title", required=True)
    ap.add_argument("--description", required=True)
    ap.add_argument("--tags", default="hindi,kahani,suspense,andhere-ke-peeche,taledrop")
    a = ap.parse_args()

    mp4 = Path(a.mp4).resolve()
    if not mp4.is_file() or mp4.stat().st_size < 1_000_000:
        sys.exit(f"invalid video: {mp4}")
    yt = client()
    dup = existing(yt, a.title)
    if dup:
        print(f"DUPLICATE-SKIPPED {dup}")
        return
    body = {
        "snippet": {
            "title": a.title,
            "description": a.description,
            "tags": [t.strip() for t in a.tags.split(",") if t.strip()],
            "categoryId": "24",
            "defaultLanguage": "hi",
            "defaultAudioLanguage": "hi",
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
    req = yt.videos().insert(part="snippet,status", body=body, media_body=media, notifySubscribers=True)
    response = None
    while response is None:
        st, response = req.next_chunk()
        if st:
            print(f"upload {int(st.progress() * 100)}%")
    vid = response.get("id")
    if not vid:
        sys.exit("upload returned no video id")
    url = f"https://www.youtube.com/watch?v={vid}"
    line = f"{datetime.now(timezone.utc).isoformat()} | longform | `{mp4.stem}` | {a.title} | {url}\n"
    with (ROOT / "LONG_FORM_LOG.md").open("a", encoding="utf-8") as f:
        f.write(line)
    print(f"PUBLISHED {url}")


if __name__ == "__main__":
    main()
