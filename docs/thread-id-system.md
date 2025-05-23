# Thread ID System Documentation

This document explains the thread ID system used in the whenIwas application and how it handles
consistency between different database tables.

## Overview

In this application, we use a UUID-based identifier called "threadId" that serves two conceptual purposes:

1. It identifies a unique user (user identity concept)
2. It identifies a conversation thread (conversation thread concept)

Thread IDs are used throughout the application to retrieve and store memories, user profiles, and other user-specific data.

## Database Structure

The thread ID system relies on three main database tables:

### `threads` Table

This is the primary table that stores each unique thread ID:

```sql
CREATE TABLE IF NOT EXISTS public.threads (
    id          uuid PRIMARY KEY,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now()
);
```

### `profiles` Table

This table stores user profile information linked to thread IDs:

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       uuid UNIQUE,
    thread_id     uuid UNIQUE REFERENCES threads(id),
    name          text,
    emotional_tone text[],
    concerns      text[],
    onboarding_completed boolean DEFAULT false,
    created_at    timestamptz DEFAULT now(),
    updated_at    timestamptz DEFAULT now()
);
```

### `memory` Table

This table stores memory entries for each thread:

```sql
CREATE TABLE public.memory (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id uuid REFERENCES threads(id),
    author_role text,
    message_id uuid,
    summary text,
    embedding jsonb,
    salience float DEFAULT 1,
    tags text[],
    created_at timestamptz DEFAULT now(),
    last_accessed timestamptz DEFAULT now()
);
```

## Foreign Key Relationships

The system uses foreign key constraints to ensure data integrity:

1. `profiles.thread_id` references `threads.id`
2. `memory.thread_id` references `threads.id`

These constraints prevent orphaned records and ensure all thread IDs are valid.

## Common Issues and Solutions

### "No associated user found" Error

This error typically occurs when attempting to create a memory entry for a thread ID that doesn't have a corresponding profile. The database has a trigger that enforces this relationship:

```sql
CREATE OR REPLACE FUNCTION public.check_memory_user()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE thread_id = NEW.thread_id) THEN
        RAISE EXCEPTION 'Cannot create memory entry: No associated user found for thread_id %', NEW.thread_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Solution

We've implemented several solutions to fix thread ID consistency issues:

1. **useThreadProfile Hook**: This hook ensures a profile exists for the current thread ID
2. **SessionContext Improvements**: The session context automatically creates thread and profile records
3. **Thread ID Fixer Utility**: A utility that scans the database for inconsistencies and fixes them

## Client-side Storage

For persistence across sessions, the thread ID is stored in multiple places:

1. **LocalStorage**: For long-term persistence
2. **SessionStorage**: For session-level persistence
3. **Cookie (sw_uid)**: For cross-domain persistence

## Debugging Tools

We've created debugging tools to help diagnose and fix thread ID issues:

1. **Thread ID Debugger**: Displays the current thread ID and its status across storage mechanisms and database tables
2. **Thread ID Fixer**: A utility that scans the database for inconsistencies and fixes them

These tools are available at `/thread-debug` in the application.

## Best Practices

When working with thread IDs:

1. **Always use the SessionContext**: Use `useSession()` hook to access the current thread ID
2. **Ensure profile existence**: Use `useThreadProfile()` hook in components that create memory entries
3. **Handle errors gracefully**: Be prepared for "No associated user found" errors
4. **Run the fixer utility**: If inconsistencies are found, run the fixer utility

## Implementation Details

### SessionContext

The SessionContext provides a consistent way to access and update the thread ID. It automatically ensures thread and profile records exist in the database.

### useThreadProfile Hook

This hook ensures a profile exists for the current thread ID. It should be used in components that create memory entries.

### fixThreadIdIssues Utility

This utility scans the database for inconsistencies and fixes them. It can be run via the Thread ID Fixer component or directly from code.
