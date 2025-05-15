#!/usr/bin/env python3
"""
Build ft_casual_v1.jsonl from micro-interaction chat files.

Rules
─────
• Source rows contain exactly two messages: user + assistant.
• Drop any row with crisis terms or profanity.
• Skip assistant replies > 200 tokens.
• Duplicate each remaining row 4× so the final set ≈ 64 rows.
• Inject a system prompt so each output record has 3 messages
  (system, user, assistant) — required by OpenAI chat FT format.
"""

import json, re, sys
from pathlib import Path

SRC_GLOB   = "data/casual_source/micro_interactions_chat_*.jsonl"
OUT_FILE   = Path("data/ft_source/ft_casual_v1.jsonl")
DUP_FACTOR = 3

# Simple safety filters ─── feel free to extend
CRISIS_PAT = re.compile(r"\b(suicide|kill myself|end my life|self[- ]?harm)\b", re.I)
PROF_PAT   = re.compile(r"\b(fuck|shit|damn|bitch)\b", re.I)

SYS_PROMPT = (
    "You are a friendly peer who mirrors slang when the user's tone is casual, "
    "but you still respond with empathy. Avoid slang if the topic is crisis."
)

def is_safe(text: str) -> bool:
    return not (CRISIS_PAT.search(text) or PROF_PAT.search(text))

def main() -> None:
    src_files = list(Path().glob(SRC_GLOB))
    if not src_files:
        sys.exit("❌  No source files found matching " + SRC_GLOB)

    kept = []
    for fp in src_files:
        with fp.open() as f:
            for line in f:
                rec = json.loads(line)
                msgs = rec.get("messages", [])
                if len(msgs) < 2:
                    continue  # malformed
                user_msg, assistant_msg = msgs[0], msgs[1]

                if not (is_safe(user_msg["content"]) and is_safe(assistant_msg["content"])):
                    continue
                if len(assistant_msg["content"].split()) > 200:
                    continue

                # Re-wrap with system prompt
                kept.append(
                    {
                        "messages": [
                            {"role": "system",    "content": SYS_PROMPT},
                            user_msg,
                            assistant_msg,
                        ]
                    }
                )

    print("Clean rows kept:", len(kept))
    if not kept:
        sys.exit("❌  Nothing to write after filtering")

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUT_FILE.open("w", encoding="utf-8") as f:
        for rec in kept:
            for _ in range(DUP_FACTOR):
                json.dump(rec, f, ensure_ascii=False)
                f.write("\n")

    print(f"✅ Wrote {OUT_FILE} with {len(kept)*DUP_FACTOR} rows")

if __name__ == "__main__":
    main()
