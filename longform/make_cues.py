# -*- coding: utf-8 -*-
import json
from pathlib import Path

P = Path(__file__).resolve().parent
lines = json.loads((P / "data/lines.json").read_text(encoding="utf-8"))
script = json.loads((P / "script.json").read_text(encoding="utf-8"))
cues, last = [], -1
for i, ch in enumerate(script["chapters"]):
    t = round(lines["lines"][i]["start"], 3)
    if ch != last:
        cues.append({"t": t, "type": "whoosh", "gain": 0.32}); last = ch
    lab = script["visual_labels"][i]
    if any(k in lab for k in ("ECHO14", "ECHO_RETURN", "CLAP", "COIN", "TALI", "MATCH")):
        cues.append({"t": t, "type": "tock", "gain": 0.34})
    if any(k in lab for k in ("WARNING", "DARK_SPEAKS", "DARKER", "SHAKE", "FEAR")):
        cues.append({"t": t, "type": "heartbeat", "gain": 0.42})
    if lab in ("SOURCE_NAMES", "OUTRO", "TITLE", "EP_TITLE"):
        cues.append({"t": t, "type": "sparkle", "gain": 0.26})
cues.sort(key=lambda c: c["t"])
(P / "data/cues.json").write_text(json.dumps({"duration": lines["duration"], "cues": cues}, indent=1), encoding="utf-8")
print(f"cues.json: {len(cues)} cues, {lines['duration']:.2f} s")
