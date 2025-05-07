import { filterAndRankRAG } from './filterUtils';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

export interface RecallEntry {
  thread_id: string;
  response_text: string;
  discipline: string;
  topic: string;
  source: string;
  content: string;
  embedding: number[];
  signal_label?: 'low' | 'medium' | 'high';
  tone_tags?: string[];
}

const CORPUS_FILES = [
  path.join(process.cwd(), 'data', 'therapy_corpus_embedded_expanded.json'),
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

export async function fetchRecall(
  prompt: string,
  predictedSignal: 'low' | 'medium' | 'high' | 'ambiguous',
  inferredToneTags: string[]
): Promise<{
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
    thread_id: entry.thread_id || '',
    response_text: entry.response_text || '',
    discipline: entry.discipline || '',
    topic: entry.topic || '',
    source: entry.source || '',
    content: entry.content || '',
    embedding: entry.embedding,
    signal_label: entry.signal_label ?? 'medium', // default to 'medium'
    tone_tags: entry.tone_tags ?? [],
    score: cosineSimilarity(inputEmbedding, entry.embedding)
  }));

  scoredEntries.sort((a, b) => b.score - a.score);

  const filteredRanked = filterAndRankRAG(
    scoredEntries,
    predictedSignal,
    inferredToneTags
  );

  if (filteredRanked.length > 0) {
    console.log('[RAG DEBUG] Top result after filtering:', {
      topic: filteredRanked[0].topic,
      discipline: filteredRanked[0].discipline,
      score: filteredRanked[0].score
    });
  } else {
    console.warn('[RAG DEBUG] No entries passed signal + tone filtering.');
  }

  const topN = Number(process.env.RECALL_TOP_N) || 3;
  const topResults = filteredRanked.slice(0, topN).map(e => ({
    discipline: e.discipline || '',
    topic: e.topic || '',
    source: e.source || '',
    content: e.content || '',
    score: e.score || 0
  }));

  console.log(`[RAG DEBUG] Top results after filtering and slice (${topN}):`, topResults.length);
  topResults.forEach((e, idx) => {
    console.log(`[RAG DEBUG] Passed ${idx + 1}: ${e.topic} (${e.discipline}) — Score: ${e.score}`);
  });

  return {
    recallUsed: topResults.length > 0,
    results: topResults
  };
}
