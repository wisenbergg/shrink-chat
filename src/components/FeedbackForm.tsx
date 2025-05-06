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

  if (submitted) return <span className="text-xs text-green-600">Thanks!</span>;

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => submitFeedback('thumbs_up')}
          className="hover:text-green-500 transition-colors"
          aria-label="Thumbs up"
        >
          👍
        </button>
        <div className="flex gap-2"></div>
        <button
          onClick={() => submitFeedback('thumbs_down')}
          className="hover:text-red-500 transition-colors"
          aria-label="Thumbs down"
        >
          👎
        </button>
      </div>
    </>
  );
}
