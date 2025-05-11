export function toneDriftFilter(response: string): boolean {
  const flagged = [
    'i’m sorry you’re feeling that way',
    'i understand that must be hard',
    'it’s understandable to feel that way',
    'you’re not alone in this',
    'that’s totally valid',
    'many people feel this way'
  ];
  const lower = response.toLowerCase();
  return !flagged.some(f => lower.includes(f));
}
