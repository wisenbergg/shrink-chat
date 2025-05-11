import pandas as pd
import json
import os

# Set output directory
base_dir = os.path.dirname(os.path.dirname(__file__))  # go up to shrink-chat
output_dir = os.path.join(base_dir, 'data')
os.makedirs(output_dir, exist_ok=True)

# Load Excel file
excel_path = os.path.join(os.path.dirname(__file__), 'In treatment_CSV_1.xlsx')
try:
    df = pd.read_excel(excel_path)
    print(f"✅ Loaded Excel file with {len(df)} rows.")
except Exception as e:
    print(f"❌ Failed to load Excel file: {e}")
    exit()

all_sessions = []
all_dialogues_flat = []
mapping_template = []

for idx, row in df.iterrows():
    if 'Names' not in row or 'Session transcript' not in row:
        print(f"⚠️ Missing expected columns in row {idx}, skipping.")
        continue

    session_id = row['Names']
    transcript = row['Session transcript']
    if pd.isnull(transcript):
        print(f"⚠️ Skipping empty transcript at row {idx}")
        continue

    lines = [line.strip() for line in str(transcript).split('\n') if line.strip()]
    dialogue = []
    current_speaker = 'Client'  # start with Client
    current_text = []

    for line in lines:
        if line.startswith('-'):
            # save previous block
            if current_text:
                dialogue.append({'speaker': current_speaker, 'text': ' '.join(current_text).strip()})
                all_dialogues_flat.append({'speaker': current_speaker, 'text': ' '.join(current_text).strip()})
                current_text = []
                # alternate speaker
                current_speaker = 'Therapist' if current_speaker == 'Client' else 'Client'
            # remove dash and keep the text
            clean_line = line.lstrip('-').strip()
            current_text.append(clean_line)
        else:
            current_text.append(line)

    # save last block
    if current_text:
        dialogue.append({'speaker': current_speaker, 'text': ' '.join(current_text).strip()})
        all_dialogues_flat.append({'speaker': current_speaker, 'text': ' '.join(current_text).strip()})

    all_sessions.append({
        'session': session_id,
        'dialogue': dialogue
    })

    mapping_template.append({'session': session_id, 'discipline': '', 'topic': '', 'tone': '', 'signal': ''})

# Define output paths
json_path = os.path.join(output_dir, 'parsed_sessions.json')
jsonl_path = os.path.join(output_dir, 'parsed_sessions.jsonl')
csv_path = os.path.join(output_dir, 'mapping_template.csv')

# Save to JSON
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(all_sessions, f, indent=2, ensure_ascii=False)
print(f"✅ Saved JSON: {json_path}")

# Save to JSONL (one line per dialogue turn)
with open(jsonl_path, 'w', encoding='utf-8') as f:
    for turn in all_dialogues_flat:
        f.write(json.dumps(turn, ensure_ascii=False) + '\n')
print(f"✅ Saved JSONL: {jsonl_path}")

# Save mapping template CSV
mapping_df = pd.DataFrame(mapping_template)
mapping_df.to_csv(csv_path, index=False)
print(f"✅ Saved mapping CSV: {csv_path}")

print("🎉 Script finished successfully! Ready for the next run.")
