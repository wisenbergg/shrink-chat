'use client';

import { useState, useEffect } from 'react';

type EngineResponse = {
  response_text?: string;
  tone_tags?: string[];
  signal?: string;
  recallUsed?: boolean;
  error?: string;
  tokens_used?: number;
  latency_ms?: number;
  contextBlock?: string[];
};

export default function ShrinkTestPage() {
  const [prompt, setPrompt] = useState('');
  const [threadId, setThreadId] = useState('');
  const [response, setResponse] = useState<EngineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [memory, setMemory] = useState<Array<{ role: string; content: string }>>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const start = performance.now();
      const res = await fetch('/api/shrink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          threadId
        })
      });

      const data = await res.json();
      const end = performance.now();

      setResponse({
        ...data,
        latency_ms: Math.round(end - start)
      });

      const memRes = await fetch(`/api/memory/${threadId}`);
      const { memory } = await memRes.json();
      setMemory(memory);
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
            className="w-full p-2 border rounded bg-white text-black"
            placeholder="What's on your mind?"
          />
        </label>

        <label className="text-sm font-medium text-gray-700">
          Thread ID
          <input
            type="text"
            value={threadId}
            onChange={(e) => setThreadId(e.target.value)}
            className="w-full p-2 border rounded bg-white text-black"
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
        <div className="bg-gray-100 p-4 rounded shadow-sm whitespace-pre-wrap text-sm space-y-4">
          <div>
            <strong>Response:</strong>
            <div className="mt-2 text-gray-800">
              {response.error
                ? `❌ ${response.error}`
                : response.response_text || '(no text returned)'}
            </div>
          </div>

          {response.tone_tags && (
            <div>
              <strong className="block mb-1 text-xs text-gray-500 uppercase tracking-wide">
                Tone Tags:
              </strong>
              <div className="text-gray-700">{response.tone_tags.join(', ')}</div>
            </div>
          )}

          {response.signal && (
            <div className="text-gray-600 text-xs">
              <strong>Signal:</strong> {response.signal}
            </div>
          )}

          {response.recallUsed !== undefined && (
            <div className="text-gray-600 text-xs">
              <strong>Recall Used:</strong> {String(response.recallUsed)}
            </div>
          )}

          {response.latency_ms !== undefined && (
            <div className="text-gray-600 text-xs">
              <strong>Latency:</strong> {response.latency_ms}ms
            </div>
          )}
        </div>
      )}

      {memory.length > 0 && (
        <div className="mt-6 bg-white border p-4 rounded shadow-sm text-sm">
          <strong className="block mb-2 text-xs text-gray-500 uppercase tracking-wide">Memory Log</strong>
          <ul className="space-y-2">
            {memory.map((m, idx) => (
              <li key={idx} className="border-l-4 pl-3 text-gray-700">
                <span className="font-bold text-xs text-blue-600 uppercase mr-2">{m.role}</span>
                {m.content}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
