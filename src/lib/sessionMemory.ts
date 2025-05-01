// src/lib/sessionMemory.ts

import fs from 'fs/promises';
import path from 'path';

/**
 * Exactly the shape of each JSON line in session_log.jsonl
 */
interface SessionLogEntry {
  session_id: string;
  prompt: string;
  response: string;
  // add other logged fields here if needed, e.g. timestamp?: number;
}

export interface MemoryTurn {
  prompt: string;
  response: string;
}

const SESSION_LOG = path.join(process.cwd(), 'data', 'session_log.jsonl');

/**
 * Load the last `limit` turns for a given session ID from JSONL.
 */
export async function getMemoryForSession(
  sessionId: string,
  limit = 10
): Promise<MemoryTurn[]> {
  try {
    const data = await fs.readFile(SESSION_LOG, 'utf-8');

    const entries = data
      .split('\n')
      .filter(Boolean)
      .map((line: string) => {
        // parse JSON, then assert it matches our SessionLogEntry shape
        return JSON.parse(line) as unknown as SessionLogEntry;
      })
      .filter((entry) => entry.session_id === sessionId)
      .slice(-limit)
      .map((entry) => ({
        prompt: entry.prompt,
        response: entry.response,
      }));

    return entries;
  } catch (err) {
    console.warn('⚠️ No memory available for', sessionId, err);
    return [];
  }
}
