export interface MessageTurn {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: number;
    id?: string;
    emotion?: string;  // optional extension
    confidence?: number; // optional extension (e.g., from sentiment model)
  }
  