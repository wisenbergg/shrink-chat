/**
 * OpenAI API Key Loader
 *
 * This module ensures we always use the correct API key from .env.local even if
 * there's a conflicting environment variable set at the system level.
 *
 * This version is safe to use in both client and server contexts.
 */

import { OpenAI } from "openai";

// Cache the API key to avoid looking up on every import
let cachedApiKey: string | null = null;

/**
 * Gets the OpenAI API key.
 * It checks process.env.OPENAI_API_KEY and validates it.
 */
export function getOpenAIApiKey(): string {
  if (cachedApiKey) return cachedApiKey;

  const envApiKey = process.env.OPENAI_API_KEY;

  if (
    envApiKey &&
    (envApiKey.startsWith("sk-") || envApiKey.startsWith("sk-proj-"))
  ) {
    cachedApiKey = envApiKey;
    return envApiKey;
  }

  // In client-side code, we only have access to NEXT_PUBLIC_* env vars,
  // so there's not much else we can do if the key is missing or invalid.

  // Log the warning only on the server to avoid polluting client console
  if (typeof window === "undefined" && envApiKey) {
    console.warn(
      "[apiKeyLoader] Invalid OPENAI_API_KEY format detected. Should start with 'sk-' or 'sk-proj-'."
    );
  }

  // Return whatever was in the env var even if invalid,
  // the OpenAI client will handle validation on its own
  return envApiKey || "";
}

/**
 * Creates an OpenAI client with the correct API key.
 * This function should primarily be used by server-side code.
 */
export function createOpenAIClient() {
  const apiKey = getOpenAIApiKey();

  if (!apiKey) {
    throw new Error(
      "Missing OpenAI API key. Please set OPENAI_API_KEY in your .env.local file."
    );
  }

  return new OpenAI({ apiKey });
}

export default createOpenAIClient;
