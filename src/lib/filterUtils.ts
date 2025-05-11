// src/lib/filterUtils.ts

export interface ScoredEntry {
  discipline: string;
  topic: string;
  source: string;
  content: string;
  score: number;
  signal_label: 'low' | 'medium' | 'high' | 'ambiguous';
  tone_tags: string[];
}

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
  const SIGNAL_BOOST = 0.15;
  const TONE_BOOST   = 0.10;

  const boosted = entries.map(e => {
    let boost = 0;
    if (predictedSignal !== 'ambiguous' && e.signal_label === predictedSignal) {
      boost += SIGNAL_BOOST;
    }
    if (inferredToneTags.some(tag => e.tone_tags.includes(tag))) {
      boost += TONE_BOOST;
    }
    return { ...e, score: e.score + boost };
  });

  // Sort descending
  boosted.sort((a, b) => b.score - a.score);
  return boosted;
}
