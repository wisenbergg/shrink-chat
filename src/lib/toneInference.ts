import * as path from 'path';
import * as fs from 'fs';
import OpenAI from 'openai';

export interface ToneInferenceEntry {
  embedding: number[];
  tone_tags: string[];
}

const TONE_CORPUS_PATH = path.join(
  process.cwd(),
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
 * Embeds the input text, finds nearest neighbor, returns tone tags.
 */
export async function inferToneTagsFromText(text: string): Promise<string[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  try {
    const embeddingResponse = await openai.embeddings.create({
      model: process.env.EMBEDDING_MODEL!,
      input: text
    });

    const inputEmbedding = embeddingResponse.data[0].embedding;
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
  } catch (e) {
    console.error('⚠️ Failed to generate embedding or infer tone:', e);
    return [];
  }
}
