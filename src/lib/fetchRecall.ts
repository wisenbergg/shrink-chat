// src/lib/fetchRecall.ts

import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

export interface RecallEntry {
  prompt: string;
  response_text: string;
  embedding: number[];
}

// 1) Only load the fully embedded JSON
const CORPUS_FILES = [
  path.join(process.cwd(), 'data', 'shrink_corpus_full_embedded.json'),
];

let corpusCache: RecallEntry[] | null = null;
function loadCorpus(): RecallEntry[] {
  if (corpusCache) return corpusCache;
  const all: RecallEntry[] = [];
  for (const filePath of CORPUS_FILES) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const entries = JSON.parse(raw) as RecallEntry[];
      console.log(`Loaded ${entries.length} entries from ${path.basename(filePath)}`);
      all.push(...entries);
    } catch (err) {
      console.warn(`Could not load corpus file: ${filePath}`, err);
    }
  }
  corpusCache = all;
  return all;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] ** 2;
    magB += b[i] ** 2;
  }
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

export async function fetchRecall(
  prompt: string
): Promise<{ response_text: string; recallUsed: boolean }> {
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return { response_text: '', recallUsed: false };
  }

  // 2) Embed the prompt
  let inputEmbedding: number[];
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const res = await openai.embeddings.create({
      model: process.env.EMBED_MODEL || 'text-embedding-3-small',
      input: prompt
    });
    inputEmbedding = res.data[0].embedding;
  } catch (err) {
    console.error('fetchRecall embedding error:', err);
    return { response_text: '', recallUsed: false };
  }

  // 3) Load corpus and find best match
  const corpus = loadCorpus();
  if (corpus.length === 0) {
    console.warn('⚠️  Corpus is empty – no embeddings loaded.');
  }

  let bestScore = -Infinity;
  let bestEntry: RecallEntry | null = null;

  for (const entry of corpus) {
    const score = cosineSimilarity(inputEmbedding, entry.embedding);
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  // 4) Threshold logic
  const thresholdEnv = Number(process.env.RECALL_THRESHOLD);
  if (isNaN(thresholdEnv)) {
    throw new Error(`Invalid RECALL_THRESHOLD: ${process.env.RECALL_THRESHOLD}`);
  }
  const threshold = thresholdEnv;

  if (bestEntry && bestScore >= threshold) {
    return { response_text: bestEntry.response_text, recallUsed: true };
  }
  return { response_text: '', recallUsed: false };
}
