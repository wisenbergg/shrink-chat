#!/usr/bin/env python3
import sys, json, os, time
from pathlib import Path
from dotenv import load_dotenv
import openai

load_dotenv(".env.local", override=True)
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    raise RuntimeError("OPENAI_API_KEY not loaded")

MODEL = "text-embedding-3-small"
CORPUS_PATH = Path("data/shrink_corpus_full_embedded.json")

def get_embedding(text: str):
    resp = openai.embeddings.create(model=MODEL, input=text)
    return resp.data[0].embedding

def upsert_rows(rows):
    existing = []
    if CORPUS_PATH.exists():
        existing = json.loads(CORPUS_PATH.read_text())

    from collections import OrderedDict
    m = OrderedDict((r["variant_id"], r) for r in existing)
    for r in rows:
        m[r["variant_id"]] = r

    CORPUS_PATH.write_text(json.dumps(list(m.values()), indent=2))
    print(f"✅  Saved {len(m)} total rows to {CORPUS_PATH}")

def main(paths):
    rows = []
    for p in paths:
        data = json.loads(Path(p).read_text())
        rows.extend(data)

    print(f"🗂  Loaded {len(rows)} entries — embedding…")
    for r in rows:
        if not r.get("response_text"):
            print(f"⚠️ Skipping missing response_text: {r.get('variant_id')}")
            continue
        if not r.get("embedding"):
            r["embedding"] = get_embedding(r["response_text"])
    upsert_rows(rows)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: embed_new_entries.py file1.json [file2.json …]")
        sys.exit(1)
    main(sys.argv[1:])
