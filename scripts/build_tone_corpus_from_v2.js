// scripts/build_tone_corpus_from_v2.js
const fs = require('fs');
const { OpenAI } = require('openai');

// Load your 3-dim tone-tags file
const v2 = JSON.parse(
  fs.readFileSync('data/shrink_corpus_v2_with_tone_tags.json', 'utf8')
);

// Prepare OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

(async () => {
  const out = [];
  for (const entry of v2) {
    const res = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: entry.tone_tags.join(' ')
    });
    out.push({ embedding: res.data[0].embedding, tone_tags: entry.tone_tags });
  }
  fs.writeFileSync(
    'data/shrink_corpus_with_tone_tags.json',
    JSON.stringify(out, null, 2)
  );
  console.log('✅ Built tone corpus with', out.length, 'entries');
})();
