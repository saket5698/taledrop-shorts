#!/usr/bin/env python3
"""One-time helper: get a YouTube refresh token for GitHub Actions secrets.

Run this ONCE on your own computer (not in Actions):

  python scripts/youtube_auth.py path/to/client_secret.json

It opens a browser for Google sign-in, then prints the three values to paste into
GitHub repository secrets:

  YOUTUBE_CLIENT_ID
  YOUTUBE_CLIENT_SECRET
  YOUTUBE_REFRESH_TOKEN

The account you sign in with must own (or be a manager of) the TaleDrop channel.
"""
import sys
from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube",
]


def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: python scripts/youtube_auth.py <client_secret.json>")
    secret_file = Path(sys.argv[1]).expanduser()
    if not secret_file.exists():
        raise SystemExit(f"not found: {secret_file}")

    flow = InstalledAppFlow.from_client_secrets_file(str(secret_file), scopes=SCOPES)
    creds = flow.run_local_server(port=0, prompt="consent")

    print("\n=== Paste these into GitHub Secrets ===")
    print(f"YOUTUBE_CLIENT_ID={creds.client_id}")
    print(f"YOUTUBE_CLIENT_SECRET={creds.client_secret}")
    print(f"YOUTUBE_REFRESH_TOKEN={creds.refresh_token}")
    print("=====================================\n")
    if not creds.refresh_token:
        print("WARNING: no refresh token returned. Re-run and make sure you approve access.")


if __name__ == "__main__":
    main()
