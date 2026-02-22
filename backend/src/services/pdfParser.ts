import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('Missing ANTHROPIC_API_KEY in environment');
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-5-20250929';

const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
]);

type VisionMediaType = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';

function normalizeVisionMediaType(mimeType: string): VisionMediaType {
  const lower = mimeType.toLowerCase();
  if (lower === 'image/jpg') return 'image/jpeg';
  if (lower === 'image/png' || lower === 'image/jpeg' || lower === 'image/webp' || lower === 'image/gif') {
    return lower;
  }
  throw new Error(`Unsupported image format for OCR: ${mimeType}`);
}

/**
 * Extract text from a PDF using Claude's native document support.
 * Sends the PDF as a base64-encoded document and asks Claude to extract all text.
 */
export async function parsePdf(filePath: string): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath);
  const base64 = fileBuffer.toString('base64');

  const response = await anthropic.messages.create({
    model: MODEL,
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
    model: MODEL,
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

export async function parseImageBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  if (!SUPPORTED_IMAGE_MIME_TYPES.has(mimeType.toLowerCase())) {
    throw new Error(`Unsupported image format: ${mimeType}`);
  }
  const mediaType = normalizeVisionMediaType(mimeType);

  const base64 = buffer.toString('base64');

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64,
            },
          },
          {
            type: 'text',
            text: 'Perform OCR on this medical document image, including handwritten notes if present. Extract all readable text and preserve headings, bullet points, and form field structure. Return only the extracted text.',
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude returned no text content from image');
  }
  return textBlock.text;
}

export async function parseUploadedDocumentBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    return parsePdfBuffer(buffer);
  }

  if (mimeType === 'text/plain') {
    const text = buffer.toString('utf8').trim();
    if (!text) throw new Error('Uploaded text file was empty');
    return text;
  }

  if (SUPPORTED_IMAGE_MIME_TYPES.has(mimeType.toLowerCase())) {
    return parseImageBuffer(buffer, mimeType);
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}

export function isSupportedUploadMimeType(mimeType: string): boolean {
  return (
    mimeType === 'application/pdf' ||
    mimeType === 'text/plain' ||
    SUPPORTED_IMAGE_MIME_TYPES.has(mimeType.toLowerCase())
  );
}
