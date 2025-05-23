/**
 * Thread ID System
 * ----------------
 * In this application, we use a single identifier called "threadId" that serves
 * two conceptual purposes:
 *
 * 1. It identifies a unique user (user identity concept)
 * 2. It identifies a conversation thread (conversation thread concept)
 *
 * This ID is stored in the database in the "thread_id" column and is used
 * throughout the application to retrieve and store memories, user profiles,
 * and other user-specific data.
 *
 * When a user first visits the app, a UUID is generated and stored in localStorage
 * and sessionStorage as "threadId". This same ID is used for all subsequent
 * interactions with the application.
 */

export type ThreadId = string;

export interface MessageTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ThreadIdentifiable {
  threadId: ThreadId;
}
