/**
 * Split text into overlapping chunks for embedding.
 *
 * Approximation: 1 token ≈ 4 characters.
 *
 * Usage:
 *   Clinical docs: chunkText(text, 256, 32)
 *   Policy docs:   chunkText(text, 512, 64)
 */
export function chunkText(
  text: string,
  maxTokens: number,
  overlapTokens: number
): string[] {
  const maxChars = maxTokens * 4;
  const overlapChars = overlapTokens * 4;
  const stepSize = maxChars - overlapChars; // how far to advance each iteration
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + maxChars, text.length);

    // Try to split on a sentence boundary (". ") within the window
    if (end < text.length) {
      const boundary = text.lastIndexOf('. ', end);
      if (boundary > start) {
        end = boundary + 1; // include the period
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // If we've reached the end, stop
    if (end >= text.length) break;

    // Advance by stepSize (maxChars - overlap)
    start += stepSize;
  }

  // Skip tiny fragments (<50 chars)
  return chunks.filter((c) => c.length > 50);
}
