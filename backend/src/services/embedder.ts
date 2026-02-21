import { VoyageAIClient } from 'voyageai';

if (!process.env.VOYAGE_API_KEY) {
  throw new Error('Missing VOYAGE_API_KEY in environment');
}

const voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });

/**
 * Generate a 1024-dimension embedding using Voyage voyage-3.
 */
export async function embed(text: string): Promise<number[]> {
  const res = await voyage.embed({
    model: 'voyage-3',
    input: [text],
  });
  return res.data![0].embedding!;
}

/**
 * Batch embed multiple texts.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const res = await voyage.embed({
    model: 'voyage-3',
    input: texts,
  });
  return res.data!.map((d) => d.embedding!);
}
