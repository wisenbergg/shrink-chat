// testFT.cjs

// CommonJS import of the OpenAI client
const OpenAI = require("openai").default;

// Pull from env
const apiKey = process.env.OPENAI_API_KEY;
const model  = process.env.FINE_TUNED_MODEL;

if (!apiKey || !model) {
  console.error("❌ Missing OPENAI_API_KEY or FINE_TUNED_MODEL in env");
  process.exit(1);
}

async function run() {
  const oai = new OpenAI({ apiKey });
  try {
    const res = await oai.chat.completions.create({
      model,
      messages: [{ role: "user", content: "ping fine‑tuned model" }],
    });
    console.log("✅ FT reply:", res.choices[0].message.content);
  } catch (err) {
    console.error("❌ FT error:", err);
  }
}

run();
