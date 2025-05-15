#!/usr/bin/env python3
# scripts/dedupe_ft_dataset.py  (user-row only)

import json, sys
from pathlib import Path
import pandas as pd

INPUT_FILES = [
    Path("data/ft_source/shrink_corpus_full_embedded_cleaned.json"),
    Path("data/ft_source/shrink_corpus_with_tone_tags.json"),
]

OUTPUT_PATH = Path("data/ft_source/empathy_ft_v3.jsonl")

rows = []
for path in INPUT_FILES:
    with path.open(encoding="utf-8") as f:
        data = json.load(f)          # array of dicts
    for obj in data:
        if obj.get("role") != "user":
            continue                           # skip assistant-only rows
        prompt   = obj.get("prompt")
        response = obj.get("response_text") or obj.get("assistant") \
                   or obj.get("response")     # safety net
        if not prompt or not response:
            continue  # drop incomplete pair
        rows.append({
            "prompt":   prompt.strip(),
            "response": response.strip(),
            "tone_tags": obj.get("tone_tags"),
            "lens":      obj.get("lens"),
            "__src":     path.name
        })

df = pd.DataFrame(rows)
# keep 'cleaned' rows first so they win on duplicates
df.sort_values(by="__src", inplace=True)
df_dedup = df.drop_duplicates(subset=["prompt", "response"], keep="first")

print(f"Kept user-rows: {len(df):,}  →  after dedupe: {len(df_dedup):,}")

# write JSONL
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
with OUTPUT_PATH.open("w", encoding="utf-8") as f:
    for _, r in df_dedup.iterrows():
        json.dump(
            {
                "messages": [
                    { "role": "system",    "content": "You are a compassionate, trauma-aware therapist." },
                    { "role": "user",      "content": r["prompt"] },
                    { "role": "assistant", "content": r["response"] }
                ],
                "tone_tags": r["tone_tags"],
                "lens":      r["lens"]
            },
            f, ensure_ascii=False
        )
        f.write("\n")

print("Wrote", OUTPUT_PATH)
