// src/lib/fetchRecall.ts

import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

export interface RecallEntry {
  discipline: string;
  topic: string;
  source: string;
  content: string;
  embedding: number[];
}

const CORPUS_FILES = [
  path.join(process.cwd(), 'data', 'therapy_corpus_embedded.json'),
];

let corpusCache: RecallEntry[] | null = null;
function loadCorpus(): RecallEntry[] {
  if (corpusCache) return corpusCache;
  const all: RecallEntry[] = [];
  for (const filePath of CORPUS_FILES) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const entries = JSON.parse(raw) as RecallEntry[];
      console.log(`[RAG DEBUG] Loaded ${entries.length} entries from ${path.basename(filePath)}`);
      all.push(...entries);
    } catch (err) {
      console.warn(`[RAG DEBUG] Could not load corpus file: ${filePath}`, err);
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

export async function fetchRecall(prompt: string): Promise<{
  recallUsed: boolean;
  results: Array<{
    discipline: string;
    topic: string;
    source: string;
    content: string;
    score: number;
  }>;
}> {
  if (typeof prompt !== 'string' || !prompt.trim()) {
    console.warn('[RAG DEBUG] Empty or invalid prompt');
    return { recallUsed: false, results: [] };
  }

  let inputEmbedding: number[];
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const res = await openai.embeddings.create({
      model: process.env.EMBED_MODEL || 'text-embedding-3-small',
      input: prompt
    });
    inputEmbedding = res.data[0].embedding;
    console.log('[RAG DEBUG] Input embedding generated, length:', inputEmbedding.length);
  } catch (err) {
    console.error('[RAG DEBUG] fetchRecall embedding error:', err);
    return { recallUsed: false, results: [] };
  }

  const corpus = loadCorpus();
  if (corpus.length === 0) {
    console.warn('[RAG DEBUG] Corpus is empty — no embeddings loaded.');
    return { recallUsed: false, results: [] };
  }

  console.log('[RAG DEBUG] Calculating similarity scores...');
  const scoredEntries = corpus.map(entry => ({
    ...entry,
    score: cosineSimilarity(inputEmbedding, entry.embedding)
  }));

  scoredEntries.sort((a, b) => b.score - a.score);

  if (scoredEntries.length > 0) {
    console.log('[RAG DEBUG] Top result:', {
      topic: scoredEntries[0].topic,
      discipline: scoredEntries[0].discipline,
      score: scoredEntries[0].score
    });
  } else {
    console.warn('[RAG DEBUG] No entries scored — empty or failed comparison.');
  }

  const topN = Number(process.env.RECALL_TOP_N) || 3;
  const threshold = Number(process.env.RECALL_THRESHOLD) || 0.8;
  const topResults = scoredEntries
    .filter(e => e.score >= threshold)
    .slice(0, topN)
    .map(e => ({
      discipline: e.discipline,
      topic: e.topic,
      source: e.source,
      content: e.content,
      score: e.score
    }));

  console.log(`[RAG DEBUG] Top results after threshold (${threshold}):`, topResults.length);
  topResults.forEach((e, idx) => {
    console.log(`[RAG DEBUG] Passed ${idx + 1}: ${e.topic} (${e.discipline}) — Score: ${e.score}`);
  });

  return {
    recallUsed: topResults.length > 0,
    results: topResults
  };
}
