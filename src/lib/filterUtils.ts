// src/lib/filterUtils.ts

export interface ScoredEntry {
  discipline: string;
  topic: string;
  source: string;
  content: string;
  score: number;
  signal_label: 'low' | 'medium' | 'high' | 'ambiguous';
  tone_tags?: string[];        // make tone_tags optional
}

// Adjust these boost values as needed
const SIGNAL_BOOST = 0.5;
const TONE_BOOST = 0.05;

/**
 * Soft-boosted filtering & ranking:
 *  - Adds a small boost for matching signal_label
 *  - Adds a small boost for sharing any tone tag
 *  - Returns the full list sorted by boosted score; upstream code slices top-N.
 */
export function filterAndRankRAG(
  entries: ScoredEntry[],
  predictedSignal: 'low' | 'medium' | 'high' | 'ambiguous',
  inferredToneTags: string[]
): ScoredEntry[] {
  // 1. Filter out zero-or-negative scores and mismatched signals (unless ambiguous)
  const filtered = entries.filter(e => {
    if (e.score <= 0) return false;
    if (predictedSignal !== 'ambiguous' && e.signal_label !== predictedSignal) {
      return false;
    }
    return true;
  });

  // 2. Apply boosts
  const boosted = filtered.map(e => {
    let boost = 0;
    // boost for matching signal
    if (e.signal_label === predictedSignal) {
      boost += SIGNAL_BOOST;
    }
    // boost for any overlapping tone tag
    if (inferredToneTags.some(tag => (e.tone_tags ?? []).includes(tag))) {
      boost += TONE_BOOST;
    }
    return {
      ...e,
      score: e.score + boost
    };
  });

  // 3. Sort descending by boosted score
  boosted.sort((a, b) => b.score - a.score);

  return boosted;
}
