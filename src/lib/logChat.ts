// File: src/lib/logChat.ts
import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuid } from 'uuid';

const DB_FILE = process.env.DB_FILE || path.resolve(process.cwd(), 'shrink_chat.db');
const db = new Database(DB_FILE);

// Ensure table exists before any logging
db.exec(`
  CREATE TABLE IF NOT EXISTS chat_logs (
    id         TEXT PRIMARY KEY,
    thread_id  TEXT NOT NULL,
    turn       INTEGER NOT NULL,
    role       TEXT NOT NULL,
    content    TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);
console.log(`🔒 logChat initialized; using DB_FILE=${DB_FILE}`);

const insertStmt = db.prepare(`
  INSERT INTO chat_logs (id, thread_id, turn, role, content, created_at)
  VALUES (@id, @thread_id, @turn, @role, @content, @created_at)
`);

export function logChat(entry: { threadId: string; turn: number; role: 'user'|'assistant'; content: string }) {
  insertStmt.run({
    id: uuid(),
    thread_id: entry.threadId,
    turn: entry.turn,
    role: entry.role,
    content: entry.content,
    created_at: Date.now()
  });
  console.log(`🔒 logged chat turn ${entry.turn} for thread ${entry.threadId}`);
}
