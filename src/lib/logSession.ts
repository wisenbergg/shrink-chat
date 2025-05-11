import fs from 'fs';
import path from 'path';

export interface LogEntry {
  sessionId: string;
  content: string;
  role?: 'user' | 'assistant';
  apologyCount?: number;
  toneTags?: string[];
  signal?: 'low' | 'medium' | 'high' | 'ambiguous';
  recallUsed?: boolean;
}

const LOG_PATH = path.join(process.cwd(), 'data', 'logs');

export async function logSessionEntry(entry: LogEntry) {
  try {
    if (!fs.existsSync(LOG_PATH)) fs.mkdirSync(LOG_PATH, { recursive: true });

    const timestamp = new Date().toISOString();
    const fileName = path.join(LOG_PATH, `${entry.sessionId}.log.jsonl`);

    // Spread entry first, then override/insert timestamp exactly once
    const line = JSON.stringify({
      ...entry,
      timestamp
    });

    fs.appendFileSync(fileName, line + '\n', 'utf8');
  } catch (err) {
    console.error('❌ Failed to log session entry:', err);
  }
}

