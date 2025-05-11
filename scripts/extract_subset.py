import json
from pathlib import Path

# Paths
ROOT       = Path(__file__).parent.parent
DATA_DIR   = ROOT / "data"
THERAPY    = DATA_DIR / "therapy_corpus_embedded.json"
EXPANDED   = DATA_DIR / "therapy_corpus_embedded_expanded.json"
OUT_CBT    = DATA_DIR / "cbt.json"
OUT_SELF   = DATA_DIR / "selfcomp.json"

# Load
therapy  = json.loads(THERAPY.read_text())
expanded = json.loads(EXPANDED.read_text())

# Filter
cbt      = [r for r in therapy  if r.get("discipline") == "CBT"]
selfcomp = [r for r in expanded if r.get("lens","").startswith("Self-Compassion")]

# Write
OUT_CBT.write_text(json.dumps(cbt, indent=2))
OUT_SELF.write_text(json.dumps(selfcomp, indent=2))

print(f"Extracted {len(cbt)} CBT items to {OUT_CBT}")
print(f"Extracted {len(selfcomp)} Self‑Compassion items to {OUT_SELF}")
