import os
from openai import OpenAI

# Optional debug snippet — you can remove once you see the codes are correct
def show_codes(s):
    print([(c, hex(ord(c))) for c in s])

params = {
    "training_file": "file-SaBJwyMBCdVKMa98Y6LC9D",
    "validation_file": "file-CKZidKQ3VeiXUmrzN2LPer",
    "model": "gpt-4o",
    "suffix": "empathy-v1",
}
print("Parameter sanity check:")
for k, v in params.items():
    print(k, "→ ", end="")
    show_codes(v)

# Initialize client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Now actually create the fine‑tune
resp = client.fine_tuning.jobs.create(
    training_file=params["training_file"],
    validation_file=params["validation_file"],
    model=params["model"],
    suffix=params["suffix"],
)
print("Fine‑tune started! Job ID:", resp.id)
