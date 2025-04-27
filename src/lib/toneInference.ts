// toneInference.ts
// import * as fs from 'fs'; // Removed duplicate import
import * as path from 'path';
import * as fs from 'fs';

export interface ToneInferenceEntry {
  embedding: number[];
  tone_tags: string[];
}

// 1. Point to the correct corpus file (ensure this JSON includes tone_tags)
const TONE_CORPUS_PATH = path.join(
  process.cwd(),

// Removed duplicate declaration of toneCorpus
// Removed duplicate implementation of loadToneCorpus

// Removed duplicate implementation of cosineSimilarity

// Removed duplicate implementation of inferToneFromEmbedding
'data',
'shrink_corpus_with_tone_tags.json'
);

let toneCorpus: ToneInferenceEntry[] | null = null;
function loadToneCorpus(): ToneInferenceEntry[] {
  if (!toneCorpus) {
    try {
      const raw = fs.readFileSync(TONE_CORPUS_PATH, 'utf8');
      toneCorpus = JSON.parse(raw) as ToneInferenceEntry[];
    } catch (e) {
      console.error(`⚠️ Could not load tone corpus at ${TONE_CORPUS_PATH}:`, e);
      toneCorpus = [];
    }
  }
  return toneCorpus;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] ** 2;
    magB += b[i] ** 2;
  }
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

/**
 * Find the nearest‐neighbor entry by embedding, return its tone_tags.
 * Returns [] if no corpus or no entries.
 */
export async function inferToneFromEmbedding(
  inputEmbedding: number[]
): Promise<string[]> {
  const entries = loadToneCorpus();
  if (entries.length === 0) return [];

  let bestScore = -Infinity;
  let bestTags: string[] = [];

  for (const entry of entries) {
    const score = cosineSimilarity(inputEmbedding, entry.embedding);
    if (score > bestScore) {
      bestScore = score;
      bestTags = entry.tone_tags;
    }
  }

  return bestTags;
}
