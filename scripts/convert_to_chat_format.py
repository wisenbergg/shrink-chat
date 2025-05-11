import json

def convert(in_path, out_path):
    with open(in_path, 'r') as fin, open(out_path, 'w') as fout:
        for line in fin:
            obj = json.loads(line)
            chat_obj = {
                "messages": [
                    {"role": "user",      "content": obj["prompt"]},
                    {"role": "assistant", "content": obj["completion"]}
                ]
            }
            fout.write(json.dumps(chat_obj, ensure_ascii=False) + "\n")

convert("data/cbt.train.jsonl",     "data/cbt.chat.train.jsonl")
convert("data/selfcomp.train.jsonl","data/selfcomp.chat.train.jsonl")
