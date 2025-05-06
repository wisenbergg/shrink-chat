// src/lib/predictSignal.ts

export type SignalLabel = 'low' | 'medium' | 'high' | 'ambiguous';

export async function predictSignal(input: string): Promise<SignalLabel> {
  const { predict } = await loadClassifier();
  const predictions = await predict([input]);
  return predictions[0];
}
export async function loadClassifier(): Promise<{
  predict: (inputs: string[]) => Promise<SignalLabel[]>;
}> {
  return {
    async predict(inputs: string[]): Promise<SignalLabel[]> {
      // Stub: always classify as "medium"
      return inputs.map(() => 'medium');
    }
  };
}
