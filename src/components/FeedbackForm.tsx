import { useState } from 'react';

export function FeedbackForm({ sessionId, responseId }: { sessionId: string; responseId: string }) {
  const [submitted, setSubmitted] = useState(false);

  async function submitFeedback(rating: string) {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, responseId, rating }),
    });

    if (res.ok) {
      setSubmitted(true);
    } else {
      alert('Failed to submit feedback');
    }
  }

  return (
    <div className="relative">
      {submitted ? (
        <span className="absolute top-2 right-2 text-xs text-green-600 opacity-70">
          Thanks!
        </span>
      ) : (
        <div className="absolute top-2 right-2 flex gap-1 text-gray-400 text-sm opacity-50 hover:opacity-80 transition-opacity">
          <button
            onClick={() => submitFeedback('thumbs_up')}
            className="hover:text-green-400 transition-colors"
            aria-label="Thumbs up"
          >
            👍
          </button>
          <button
            onClick={() => submitFeedback('thumbs_down')}
            className="hover:text-red-400 transition-colors"
            aria-label="Thumbs down"
          >
            👎
          </button>
        </div>
      )}
    </div>
  );
}
