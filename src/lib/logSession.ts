import fs from 'fs';
import path from 'path';

interface LogEntry {
  sessionId: string;
  prompt: string;
  response: string;
  tone_tags: string[];
  signal: string;
  rupture: boolean;
  recallUsed: boolean;
}

const LOG_PATH = path.join(process.cwd(), 'data', 'logs');

export async function logSessionEntry(entry: LogEntry) {
  try {
    if (!fs.existsSync(LOG_PATH)) fs.mkdirSync(LOG_PATH, { recursive: true });

    const timestamp = new Date().toISOString();
    const fileName = path.join(LOG_PATH, `${entry.sessionId}.log.jsonl`);

    const line = JSON.stringify({
      timestamp,
      ...entry
    });

    fs.appendFileSync(fileName, line + '\n', 'utf8');
  } catch (err) {
    console.error('❌ Failed to log session entry:', err);
  }
}
