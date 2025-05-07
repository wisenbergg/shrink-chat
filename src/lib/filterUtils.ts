export interface RAGEntry {
    thread_id: string;
    response_text: string;
    discipline: string;
    topic: string;
    source: string;
    content: string;
    embedding: number[];
    signal_label: 'low' | 'medium' | 'high';
    tone_tags: string[];
    score: number;
  }
  
  export function filterAndRankRAG(
    entries: RAGEntry[],
    predictedSignal: 'low' | 'medium' | 'high' | 'ambiguous',
    inferredToneTags: string[]
  ): RAGEntry[] {
    let filtered: RAGEntry[] = entries;
  
    if (predictedSignal !== 'ambiguous') {
      filtered = filtered.filter((e: RAGEntry) => e.signal_label === predictedSignal);
    }
  
    if (inferredToneTags.length > 0) {
      filtered = filtered.filter((e: RAGEntry) =>
        e.tone_tags.some((tag: string) => inferredToneTags.includes(tag))
      );
    }
  
    filtered.sort((a: RAGEntry, b: RAGEntry) => b.score - a.score);
    return filtered;
  }
  