import json
from pathlib import Path

input_path  = Path("data/ft_source/empathy_ft_v5.jsonl")
output_path = Path("data/ft_source/empathy_ft_v5.clean.jsonl")

with input_path.open() as fin, output_path.open("w") as fout:
    for line in fin:
        obj = json.loads(line)
        # keep only the messages array
        clean = {"messages": obj["messages"]}
        fout.write(json.dumps(clean) + "\n")

print(f"Wrote cleaned data to {output_path}")
