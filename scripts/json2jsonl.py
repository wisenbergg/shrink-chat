import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"

for name in ("cbt","selfcomp"):
    in_path  = DATA_DIR / f"{name}.json"
    out_path = DATA_DIR / f"{name}.jsonl"
    arr = json.loads(in_path.read_text())
    # write one JSON object per line
    out_path.write_text("\n".join(json.dumps(r, separators=(',',':')) for r in arr))
    print(f"Wrote {len(arr)} records → {out_path}")
