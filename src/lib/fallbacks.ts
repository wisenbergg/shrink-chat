import { MessageTurn } from './types';

  
  export function detectRepetition(history: MessageTurn[], response: string): boolean {
    const lastResponse: string = history[history.length - 1]?.content || '';
    if (!lastResponse) return false;
    return response.includes(lastResponse);
  }
  
  export function detectWithdrawal(response: string): boolean {
    return response.trim().length < 10;
  }
  
  export function detectCrisisSignals(response: string): boolean {
    const crisisWords: string[] = ['end it', 'can’t take', 'suicide', 'self-harm', 'die', 'kill myself'];
    const lowerResponse = response.toLowerCase();
    return crisisWords.some((word) => lowerResponse.includes(word));
  }
  
  export function summarizeMemory(memory: MessageTurn[]): string {
    const emotionalThemes: string = memory
      .filter((turn) => turn.role === 'user')
      .map((turn) => turn.content)
      .slice(-5)
      .map((content) => `- ${content}`)
      .join('\n');
    return `Recent emotional themes:\n${emotionalThemes}`;
  }
  
  export function randomChoice(arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  