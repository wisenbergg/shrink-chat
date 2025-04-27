/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

export type SignalLabel = 'low' | 'medium' | 'high' | 'ambiguous';

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
