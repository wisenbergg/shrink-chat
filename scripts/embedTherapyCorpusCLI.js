import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateEmbeddings(inputPath, outputPath) {
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(inputPath, 'utf-8');
  const corpus = JSON.parse(raw);

  if (!Array.isArray(corpus) || corpus.length === 0) {
    console.warn('⚠️ Input corpus is empty — nothing to embed.');
    return;
  }

  console.log(`🗂 Loaded ${corpus.length} entries from ${inputPath}`);

  for (const [index, entry] of corpus.entries()) {
    if (!entry.response_text) {
      console.warn(`⚠️ Skipping entry ${index + 1} — missing 'response_text'`);
      continue;
    }

    const combinedText = entry.response_text;

    if (!entry.embedding || entry.embedding.length === 0) {
      try {
        const res = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: combinedText
        });
        entry.embedding = res.data[0].embedding;
        console.log(`✅ Embedded entry ${index + 1}/${corpus.length}: ${entry.lens}`);
      } catch (err) {
        console.error(`❌ Failed to embed entry ${index + 1}: ${entry.lens}`, err);
      }
    } else {
      console.log(`ℹ️ Skipped entry ${index + 1} — already has embedding`);
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(corpus, null, 2), 'utf-8');
  console.log(`✅ Saved embedded corpus to ${outputPath}`);
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node embedTherapyCorpusCLI.js <input.json> <output.json>');
  process.exit(1);
}

const [inputPath, outputPath] = args;

generateEmbeddings(inputPath, outputPath);
