import { MessageTurn } from './types';
import {
  detectRepetition,
  detectWithdrawal,
  detectCrisisSignals,
  summarizeMemory,
  randomChoice
} from './fallbacks';


  
  
  describe('fallback helpers', () => {
    const history: MessageTurn[] = [
      { role: 'user', content: 'I feel really sad today.' },
      { role: 'assistant', content: 'I’m so sorry to hear that.' },
      { role: 'user', content: 'I feel like no one understands me.' }
    ];
  
    test('detectRepetition returns true when response repeats last user message', () => {
      const result = detectRepetition(history, 'I feel like no one understands me.');
      expect(result).toBe(true);
    });
  
    test('detectRepetition returns false when response is unique', () => {
      const result = detectRepetition(history, 'Tell me more about that.');
      expect(result).toBe(false);
    });
  
    test('detectWithdrawal returns true for short responses', () => {
      expect(detectWithdrawal('Ok')).toBe(true);
      expect(detectWithdrawal('   ')).toBe(true);
    });
  
    test('detectWithdrawal returns false for long responses', () => {
      expect(detectWithdrawal('Thank you for telling me about that.')).toBe(false);
    });
  
    test('detectCrisisSignals detects crisis keywords', () => {
      expect(detectCrisisSignals('I can’t take it anymore')).toBe(true);
      expect(detectCrisisSignals('I want to end it')).toBe(true);
    });
  
    test('detectCrisisSignals ignores safe messages', () => {
      expect(detectCrisisSignals('I’m going for a walk')).toBe(false);
    });
  
    test('summarizeMemory returns last user messages', () => {
      const summary = summarizeMemory(history);
      expect(summary).toContain('- I feel really sad today.');
      expect(summary).toContain('- I feel like no one understands me.');
    });
  
    test('randomChoice returns an item from array', () => {
      const arr = ['a', 'b', 'c'];
      const result = randomChoice(arr);
      expect(arr).toContain(result);
    });
  });
  