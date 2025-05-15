#!/usr/bin/env python3
# scripts/extract_v5_to_jsonl.py
"""
Explode shrink_corpus_v5_cleaned.embeddings.json into OpenAI-chat JSONL,
dropping any variant whose tone_tag references the body / somatic cues.
"""

import json, re, sys
from pathlib import Path
import pandas as pd

INPUT_FILE  = Path("data/ft_source/shrink_corpus_v5_cleaned.embeddings.json")
OUTPUT_FILE = Path("data/ft_source/empathy_ft_v5.jsonl")

# --------------------------------------------------------------------
DROP_PAT  = re.compile(r"(body|somatic|embod|invitation-to-sense)", re.I)

def is_good_variant(var: dict) -> bool:
    """Return True if variant passes all filters."""
    if var.get("signal_strength") != "high":
        return False
    tags = var.get("tone_tags") or []
    return not any(DROP_PAT.search(tag) for tag in tags)

# --------------------------------------------------------------------
def main() -> None:
    if not INPUT_FILE.exists():
        sys.exit(f"❌  {INPUT_FILE} not found")

    with INPUT_FILE.open(encoding="utf-8") as f:
        rows = json.load(f)

    out = []
    for row in rows:
        if row.get("role") != "user":
            continue
        prompt = (row.get("prompt") or "").strip()
        if not prompt:
            continue
        for var in row.get("variants", []):
            if not is_good_variant(var):
                continue
            response = (var.get("response_text") or "").strip()
            if not response:
                continue
            out.append({
                "prompt":   prompt,
                "response": response,
                "tone_tags": var.get("tone_tags"),
                "lens":      row.get("lens")
            })

    print(f"Kept {len(out)} variants after filtering")

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_FILE.open("w", encoding="utf-8") as f:
        for rec in out:
            json.dump(
                {
                    "messages": [
                        {
                          "role": "system",
                          "content": "You are a compassionate, trauma-aware therapist."
                        },
                        { "role": "user",      "content": rec["prompt"] },
                        { "role": "assistant", "content": rec["response"] }
                    ],
                    "tone_tags": rec["tone_tags"],
                    "lens":      rec["lens"]
                },
                f, ensure_ascii=False
            )
            f.write("\n")

    print("Wrote", OUTPUT_FILE)

# --------------------------------------------------------------------
if __name__ == "__main__":
    main()
