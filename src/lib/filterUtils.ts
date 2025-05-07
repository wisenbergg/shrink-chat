// src/lib/filterUtils.ts

export interface RAGEntry {
    thread_id: string;
    response_text: string;
    signal_label: 'low' | 'medium' | 'high';
    tone_tags: string[];
    discipline?: string;
    topic?: string;
    source?: string;
    content?: string;
    score?: number;
    [key: string]: any;
  }
  
  /**
   * Filters and ranks RAG entries based on signal label and tone tag overlap.
   *
   * @param retrievedChunks - Array of RAG entries with embeddings and metadata
   * @param predictedSignal - Predicted signal from user input ('low' | 'medium' | 'high' | 'ambiguous')
   * @param inferredToneTags - Inferred tone tags from user input (array of strings)
   * @returns Sorted and filtered array of RAG entries
   */
  export function filterAndRankRAG(
    retrievedChunks: RAGEntry[],
    predictedSignal: 'low' | 'medium' | 'high' | 'ambiguous',
    inferredToneTags: string[]
  ): RAGEntry[] {
    // Allow ambiguous signal to pass all; otherwise, match exact signal
    const signalFiltered = predictedSignal === 'ambiguous'
      ? retrievedChunks
      : retrievedChunks.filter((entry) => entry.signal_label === predictedSignal);
  
    // Rank by tone tag overlap count
    const ranked = signalFiltered.sort((a, b) => {
      const aMatches = a.tone_tags.filter(tag => inferredToneTags.includes(tag)).length;
      const bMatches = b.tone_tags.filter(tag => inferredToneTags.includes(tag)).length;
      return bMatches - aMatches; // sort descending
    });
  
    return ranked;
  }
  