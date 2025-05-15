#!/usr/bin/env python3
import sys, json, os, uuid, time
from pathlib import Path
from dotenv import load_dotenv
import openai

# 1) load your real key
load_dotenv(".env.local", override=True)
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    raise RuntimeError("OPENAI_API_KEY not loaded")

# 2) settings
MODEL = "text-embedding-3-small"
CORPUS_PATH = Path("data/shrink_corpus_full_embedded.json")

# 3) embedding helper
def get_embedding(text: str):
    resp = openai.embeddings.create(model=MODEL, input=text)
    return resp.data[0].embedding

# 4) flatten the variants
def flatten_variants(record):
    base = {k: v for k, v in record.items() if k != "variants"}
    rows = []
    for idx, v in enumerate(record["variants"], start=1):
        row = base.copy()
        row.update(v)
        row["turn"] = f"{base['turn']}.{idx}"
        row["variant_id"] = str(uuid.uuid4())
        row["created_at"] = int(time.time())
        rows.append(row)
    return rows

# 5) JSON upsert
def upsert_rows(rows):
    # load existing
    existing = []
    if CORPUS_PATH.exists():
        existing = json.loads(CORPUS_PATH.read_text())
    # map by variant_id
    from collections import OrderedDict
    m = OrderedDict((r["variant_id"], r) for r in existing)
    for r in rows:
        m[r["variant_id"]] = r
    # write back
    CORPUS_PATH.write_text(json.dumps(list(m.values()), indent=2))
    print(f"✅  Saved {len(m)} total rows to {CORPUS_PATH}")

# 6) main logic
def main(paths):
    rows = []
    for p in paths:
        data = json.loads(Path(p).read_text())
        for rec in data:
            rows.extend(flatten_variants(rec))
    print(f"🗂  Flattened to {len(rows)} variants — embedding…")
    for r in rows:
        concat = f"{r['prompt']}\n\n{r['response_text']}"
        r["embedding"] = get_embedding(concat)
    upsert_rows(rows)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: embed_new_entries.py file1.json [file2.json …]")
        sys.exit(1)
    main(sys.argv[1:])
