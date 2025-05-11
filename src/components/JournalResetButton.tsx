'use client';

import { useState } from 'react';

interface Props {
  threadId: string;
  onReset?: () => void;
}

export default function JournalResetButton({ threadId, onReset }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/memory/${threadId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete memory');

      setShowConfirm(false);
      if (onReset) onReset();

      // Optional: show toast here
      // toast.success("Journal reset.");
    } catch (err) {
      console.error('Journal reset failed:', err);
      alert('Something went wrong while deleting your journal.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      {!showConfirm ? (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="text-sm text-red-600 underline"
        >
          Reset My Journal
        </button>
      ) : (
        <div className="flex flex-col gap-2 mt-2">
          <span className="text-sm text-gray-700">
            This will permanently delete all journal entries for this thread.
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 text-white text-sm px-4 py-1 rounded hover:bg-red-700"
            >
              {loading ? 'Deleting...' : 'Yes, delete'}
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              disabled={loading}
              className="text-sm text-gray-600 underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
