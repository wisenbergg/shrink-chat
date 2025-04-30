import fs from 'fs';
import path from 'path';

const LOG_PATH = path.join(process.cwd(), 'data', 'session_log.jsonl');

function writeToLog(entry: Record<string, any>) {
  const json = JSON.stringify(entry);
  fs.appendFile(LOG_PATH, json + '\n', (err) => {
    if (err) {
      console.error('❌ Failed to log session entry:', err);
    }
  });
}

export { writeToLog as logSessionEntry };
