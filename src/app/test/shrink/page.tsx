'use client';

import { useState } from 'react';

export default function ShrinkTestPage() {
  const [prompt, setPrompt] = useState('');
  const [threadId, setThreadId] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/shrink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          threadId
        })
      });

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error('Error testing shrink engine:', err);
      setResponse({ error: 'Request failed' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-semibold mb-4">🧪 Shrink Engine Test</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-8">
        <label className="text-sm font-medium text-gray-700">
          Prompt
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full p-2 border rounded bg-input text-foreground"
            placeholder="What's on your mind?"
          />
        </label>

        <label className="text-sm font-medium text-gray-700">
          Thread ID
          <input
            type="text"
            value={threadId}
            onChange={(e) => setThreadId(e.target.value)}
            className="w-full p-2 border rounded bg-input text-foreground"
            placeholder="abc123..."
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Running...' : 'Send to Shrink Engine'}
        </button>
      </form>

      {response && (
        <div className="bg-muted p-4 rounded shadow-sm whitespace-pre-wrap text-sm">
          <strong>Response:</strong>
          <div className="mt-2 text-muted-foreground">
            {response.error
              ? `❌ ${response.error}`
              : response.response_text || '(no text returned)'}
          </div>

          {response.tone_tags && (
            <div className="mt-4">
              <strong className="block mb-1 text-xs text-muted-foreground uppercase tracking-wide">
                Tone Tags:
              </strong>
              <div className="text-muted-foreground">{response.tone_tags.join(', ')}</div>
            </div>
          )}

          {response.signal && (
            <div className="mt-2 text-muted-foreground text-xs">
              <strong>Signal:</strong> {response.signal}
            </div>
          )}

          {response.recallUsed !== undefined && (
            <div className="mt-1 text-muted-foreground text-xs">
              <strong>Recall Used:</strong> {String(response.recallUsed)}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
