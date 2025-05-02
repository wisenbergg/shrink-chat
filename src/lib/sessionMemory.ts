// src/lib/sessionMemory.ts

import fs from 'fs/promises';
import path from 'path';

///////////////////////
// Types & Constants //
///////////////////////

export interface MemoryTurn {
  prompt: string;
  response: string;
  timestamp: number;
}

interface SessionLogEntry {
  session_id: string;
  timestamp: number;
  prompt: string;
  response: string;
}

const SESSION_LOG = path.join(process.cwd(), 'data', 'session_log.jsonl');

/////////////////////////
// Single‑thread fetch //
/////////////////////////

export async function getMemoryForSession(
  sessionId: string,
  limit = 10
): Promise<MemoryTurn[]> {
  try {
    const data = await fs.readFile(SESSION_LOG, 'utf-8');
    return data
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line) as SessionLogEntry)
      .filter(entry => entry.session_id === sessionId)
      .slice(-limit)
      .map(entry => ({
        prompt: entry.prompt,
        response: entry.response,
        timestamp: entry.timestamp
      }));
  } catch {
    return [];
  }
}

///////////////////////////
// Multi‑thread fetcher  //
///////////////////////////

/**
 * Fetch and merge memory from multiple threadIds.
 */
export async function getMemoryForThreads(
  threadIds: string[],
  limitPerThread = 5
): Promise<MemoryTurn[]> {
  const allMemory: MemoryTurn[] = [];
  for (const id of threadIds) {
    const mem = await getMemoryForSession(id, limitPerThread);
    allMemory.push(...mem);
  }
  // sort by timestamp so that oldest entries come first
  allMemory.sort((a, b) => a.timestamp - b.timestamp);
  return allMemory;
}
