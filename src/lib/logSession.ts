import fs from 'fs';
import path from 'path';

const LOG_PATH = path.join(process.cwd(), 'data', 'session_log.jsonl');

interface SessionLogEntry {
  session_id: string;
  timestamp: number;
  prompt: string;
  response: string;
  model: string;
  signal: string;
  recallUsed: boolean;
}

export function logSessionEntry(entry: SessionLogEntry): void {
  const json = JSON.stringify(entry);
  fs.appendFile(LOG_PATH, json + '\n', (err) => {
    if (err) {
      console.error('❌ Failed to log session entry:', err);
    }
  });
}
