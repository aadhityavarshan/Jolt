import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('Missing ANTHROPIC_API_KEY in environment');
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Extract text from a PDF using Claude's native document support.
 * Sends the PDF as a base64-encoded document and asks Claude to extract all text.
 */
export async function parsePdf(filePath: string): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath);
  const base64 = fileBuffer.toString('base64');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64,
            },
          },
          {
            type: 'text',
            text: 'Extract all text content from this PDF document. Preserve section headers, bullet points, and paragraph structure. Return only the extracted text, nothing else.',
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude returned no text content from PDF');
  }
  return textBlock.text;
}

/**
 * Extract text from a PDF buffer (for uploaded files via multer).
 */
export async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  const base64 = buffer.toString('base64');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64,
            },
          },
          {
            type: 'text',
            text: 'Extract all text content from this PDF document. Preserve section headers, bullet points, and paragraph structure. Return only the extracted text, nothing else.',
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude returned no text content from PDF');
  }
  return textBlock.text;
}
