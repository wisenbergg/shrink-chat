import os
import re
import json
import glob
import striprtf

# Install the striprtf module if needed
# pip install striprtf

from striprtf.striprtf import rtf_to_text

# Directory containing RTF files
directory = '../data/rtf_files'  # Change this to your folder path

# Output file
output_file = 'dialogues.json'

# Initialize storage
all_sessions = []

# Helper to alternate speakers
def get_speaker(index):
    return 'Client' if index % 2 == 0 else 'Therapist'

# Process each RTF file
for filepath in glob.glob(os.path.join(directory, '*.rtf')):
    filename = os.path.basename(filepath)
    with open(filepath, 'r', encoding='utf-8') as file:
        rtf_content = file.read()
        text = rtf_to_text(rtf_content)
        
        lines = text.splitlines()
        session_data = []
        current_speaker = None
        current_text = []
        speaker_index = 0

        for line in lines:
            line = line.strip()
            if not line:
                continue

            if line.startswith('- '):
                # Save the previous speaker block
                if current_speaker is not None and current_text:
                    session_data.append({
                        'speaker': current_speaker,
                        'text': ' '.join(current_text).strip()
                    })
                    current_text = []
                    speaker_index += 1

                # Start new speaker
                current_speaker = get_speaker(speaker_index)
                clean_line = line[2:].strip()
                current_text.append(clean_line)
            else:
                current_text.append(line)

        # Add the last speaker block
        if current_speaker is not None and current_text:
            session_data.append({
                'speaker': current_speaker,
                'text': ' '.join(current_text).strip()
            })

        all_sessions.append({
            'session': filename,
            'dialogue': session_data
        })

# Write to JSON with indent for readability
with open(output_file, 'w', encoding='utf-8') as out_file:
    json.dump(all_sessions, out_file, indent=2, ensure_ascii=False)

print(f"Extraction complete. Saved to {output_file}")
