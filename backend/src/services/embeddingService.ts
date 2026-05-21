import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DESCRIBE_PROMPT = `Describe this clothing/fashion item in detail for embedding purposes. Include: clothing type, fabric appearance, colors, patterns, style category, cut/silhouette, and any notable design features. Be specific and concise. Return only the description text, no JSON.`;

export async function describeGarment(imageUrl: string): Promise<string> {
  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: DESCRIBE_PROMPT },
          { type: "image_url", image_url: { url: imageUrl, detail: "low" } },
        ],
      },
    ],
    max_tokens: 200,
  });
  return res.choices[0]?.message?.content ?? "";
}

export async function embedText(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: 512,
  });
  return res.data[0].embedding;
}

export async function embedImage(imageUrl: string): Promise<number[]> {
  const description = await describeGarment(imageUrl);
  return embedText(description);
}

// Cosine similarity between two vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
