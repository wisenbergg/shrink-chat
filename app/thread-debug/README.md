# Thread ID Debugging Tools

This directory contains tools for diagnosing and fixing thread ID issues in the application.

## Accessing the Tools

Visit `/thread-debug` in your browser to access these tools.

## Available Tools

### Thread ID Debugger

This tool displays the current thread ID and its status across:

- Client-side storage mechanisms (localStorage, sessionStorage, cookies)
- Database tables (threads, profiles, memory)

Use this to check if your current session has a properly configured thread ID.

### Thread ID Fixer

This tool scans the database for thread ID inconsistencies and fixes them.
Use this if you see "No associated user found" errors in the application.

## Common Issues

1. **Missing thread records**: Memory entries may reference thread IDs that don't exist in the threads table.
2. **Missing profile records**: Thread IDs may exist without corresponding profiles.
3. **Foreign key constraints**: The database enforces relationships between these tables.

## Running the Fix Script

For more extensive repairs, you can run the fix script from the command line:

```bash
./fix-threads.sh
```

This script will:

1. Apply the necessary database migrations
2. Run the thread ID fixer utility
3. Report on the changes made

## Documentation

For more information about the thread ID system, see [thread-id-system.md](../../docs/thread-id-system.md).
