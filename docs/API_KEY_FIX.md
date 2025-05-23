# OpenAI API Key Troubleshooting

If you're experiencing issues with the OpenAI API key in the shrink-chat application, follow these steps to fix it:

## The Problem

Some users have encountered an issue where the OpenAI API key in their system environment variables is taking precedence over the one defined in `.env.local`, causing API calls to fail.

## How to Fix It

### Option 1: Run the Reset Script

The simplest solution is to run our reset script which clears conflicting environment variables:

```bash
./reset-env.sh
```

### Option 2: Manual Fix

If the reset script doesn't work, follow these manual steps:

1. Clear the OpenAI API key from your environment variables:

   ```bash
   unset OPENAI_API_KEY
   ```

2. Verify your `.env.local` file has the correct API key format:

   ```
   OPENAI_API_KEY=sk-proj-xxxxxxxx...
   ```

3. Restart your terminal and the Next.js development server:
   ```bash
   npm run dev
   ```

## Checking Your Configuration

You can check if your API key is configured correctly by running:

```bash
node check-openai-key.mjs
```

This will analyze your API key configuration and provide helpful diagnostics.

## Technical Background

The issue occurs because:

1. Node.js loads environment variables from multiple sources
2. System environment variables take precedence over `.env.local` values
3. Our API key loader utility now ensures we always use the correct key from `.env.local`

The fix has been applied to all core components that interact with OpenAI APIs.
