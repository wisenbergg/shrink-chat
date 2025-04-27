#!/usr/bin/env python3
"""
Generate shrink_corpus_with_tone_tags.json
Reads shrink_corpus_v1_cleaned.embeddings.json, calls GPT-4o-mini
to assign 2–3 tone tags per entry, and writes a new JSON file.
"""

import json, os, time, pathlib, itertools
from typing import List, Dict
import openai
from tqdm import tqdm

# ---------- CONFIG ----------
SRC = pathlib.Path("/shrink_corpus_v1_cleaned.embeddings.json")
DST = pathlib.Path("data/shrink_corpus_with_tone_tags.json")
MODEL = "gpt-4o-mini"
TAGS = [
    "warm", "grounded", "clinical", "gentle",
    "containment", "directive", "validating",
    "reflective", "curious", "reassuring"
]
BATCH = 5          # how many entries per request
SLEEP = 1.0        # seconds between requests (rate-limit buffer)
# -----------------------------

openai.api_key = os.getenv("OPENAI_API_KEY")
assert openai.api_key, "Set OPENAI_API_KEY env var first"

src_corpus: List[Dict] = json.loads(SRC.read_text())

def chunk(iterable, size):
    it = iter(iterable)
    while True:
        batch = list(itertools.islice(it, size))
        if not batch:
            break
        yield batch

def tag_single(text: str) -> List[str]:
    prompt = (
        "You are an expert tone classifier.\n"
        f"Allowed tags: {', '.join(TAGS)}.\n"
        "For the response below, return 2–3 **comma-separated** tone tags "
        "from the allowed list—no explanations.\n\n"
        f"RESPONSE:\n{text[:800]}\n"
        "\nTAGS:"
    )
    res = openai.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2
    )
    tags = [t.strip().lower() for t in res.choices[0].message.content.split(",")]
    return [t for t in tags if t in TAGS]

tagged: List[Dict] = []
for batch in tqdm(chunk(src_corpus, BATCH), total=len(src_corpus)//BATCH + 1):
    texts = [e["response_text"] for e in batch]
    # single-call fallback; you could parallelize if desired
    for entry in batch:
        tags = tag_single(entry["response_text"])
        tagged.append({**entry, "tone_tags": tags})
    time.sleep(SLEEP)

DST.write_text(json.dumps(tagged, indent=2))
print(f"✅  Wrote {len(tagged)} entries to {DST}")
