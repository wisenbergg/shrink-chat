// testMemory.ts
import { getMemoryForSession } from './src/lib/sessionMemory';

(async () => {
  try {
    const mem = await getMemoryForSession('test');
    console.log(mem);
  } catch (err) {
    console.error(err);
  }
})();
