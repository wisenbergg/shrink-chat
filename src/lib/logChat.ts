// src/lib/logChat.ts
import Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import path from 'path';

// open or create the same shrink_memory.db you’re using
const db = new Database(path.join(process.cwd(), 'shrink_memory.db'));

// ensure table exists (you could also run a migration)
db.exec(`
  CREATE TABLE IF NOT EXISTS chat_logs (
    id TEXT PRIMARY KEY,
    thread_id TEXT,
    turn INTEGER,
    role TEXT,
    content TEXT,
    created_at INTEGER
  );
`);

const insert = db.prepare(`
  INSERT INTO chat_logs (id, thread_id, turn, role, content, created_at)
  VALUES (@id, @thread_id, @turn, @role, @content, @created_at)
`);

export type LogEntry = {
  threadId: string;
  turn: number;
  role: 'user' | 'assistant';
  content: string;
};

export function logChat(entry: LogEntry) {
  try {
    insert.run({
      id: uuid(),
      thread_id: entry.threadId,
      turn: entry.turn,
      role: entry.role,
      content: entry.content,
      created_at: Date.now(),
    });
  } catch (e) {
    console.error('⚠️ logChat failed', e);
  }
}
