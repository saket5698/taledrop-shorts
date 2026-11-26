#!/usr/bin/env python3
"""Generate src/shots.js from a checked-in generic template and the writer's visual_labels."""
import json
import sys
from pathlib import Path

try: sys.stdout.reconfigure(encoding="utf-8")   # Devanagari labels in logs (Windows defaults to cp1252)
except Exception: pass

EXPECTED = {"deep-dive": 10, "dark-mythology-history": 10, "hindi-mythology": 10, "stick-story": 12}


def fail(msg):
    print(f"generate_shots: {msg}", file=sys.stderr)
    raise SystemExit(2)


def main():
    if len(sys.argv) != 3:
        fail("usage: generate_shots.py <project-dir> <deep-dive|dark-mythology-history|hindi-mythology|stick-story>")
    project = Path(sys.argv[1]).resolve()
    mode = sys.argv[2]
    if mode not in EXPECTED:
        fail(f"unknown mode {mode!r}")
    script_path = project / "script.json"
    if not script_path.is_file():
        fail(f"missing {script_path}")
    script = json.loads(script_path.read_text(encoding="utf-8"))
    count = EXPECTED[mode]
    lines = script.get("lines")
    if not isinstance(lines, list) or len(lines) != count:
        fail(f"script.json needs exactly {count} lines, got {len(lines) if isinstance(lines, list) else 'none'}")
    labels = script.get("visual_labels")
    if not isinstance(labels, list) or len(labels) != count:
        fail(f"script.json needs exactly {count} visual_labels, got {len(labels) if isinstance(labels, list) else 'none'}")
    labels = [str(x).upper().strip()[:14] for x in labels]
    if any(not x for x in labels):
        fail("visual_labels cannot be empty")
    template = Path(__file__).resolve().parent / f"shots-{mode}.template.js"
    if not template.is_file():
        fail(f"missing {template}")
    text = template.read_text(encoding="utf-8")
    if "@@LABELS@@" not in text:
        fail(f"{template.name} has no @@LABELS@@ placeholder")
    text = text.replace("@@LABELS@@", json.dumps(labels, ensure_ascii=False))
    out = project / "src" / "shots.js"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(text, encoding="utf-8")
    print(f"generated {out} with {len(labels)} labels: {', '.join(labels)}")


if __name__ == "__main__":
    main()
