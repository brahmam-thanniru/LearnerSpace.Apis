import OpenAI from "openai";
import { OPENAI_API_KEY } from "../../secrets";


export async function generateEmbedding(text: string): Promise<number[]> {
  // Create client at runtime (allowed)
  const client = new OpenAI({
    apiKey: OPENAI_API_KEY.value(), // secrets accessible inside functions only
  });

  const input = text.replace(/\s+/g, " ").trim();

  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input,
  });

  return response.data[0].embedding;
}

export function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0,
    normA = 0,
    normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
