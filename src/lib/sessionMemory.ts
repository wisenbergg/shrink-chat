// src/lib/sessionMemory.ts
import fs from 'fs/promises';
import path from 'path';

export interface MemoryTurn {
  prompt: string;
  response: string;
}

const SESSION_LOG = path.join(process.cwd(), 'data', 'session_log.jsonl');

export async function getMemoryForSession(
  sessionId: string,
  limit = 10
): Promise<MemoryTurn[]> {
  try {
    const data = await fs.readFile(SESSION_LOG, 'utf-8');
    return data
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line) as any)
      .filter(entry => entry.session_id === sessionId)
      .slice(-limit)
      .map(entry => ({ prompt: entry.prompt, response: entry.response }));
  } catch (err) {
    console.warn('⚠️ No memory available for', sessionId, err);
    return [];
  }
}
