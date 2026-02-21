import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { supabase } from '../db/supabase';
import { parsePdfBuffer } from '../services/pdfParser';
import { chunkText } from '../services/chunker';
import { embedBatch } from '../services/embedder';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// ─── POST /api/upload/clinical ───────────────────────────────────────────────

const clinicalSchema = z.object({
  patient_id: z.string().uuid(),
  record_type: z.string().min(1),
  date: z.string().min(1),
});

router.post('/clinical', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are accepted', filename: req.file.originalname });
    }

    const parsed = clinicalSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid parameters', details: parsed.error.flatten() });
    }
    const { patient_id, record_type, date } = parsed.data;
    const filename = req.file.originalname;

    console.log(`[upload/clinical] Parsing PDF: ${filename}`);
    const text = await parsePdfBuffer(req.file.buffer);

    console.log(`[upload/clinical] Chunking (256 tokens, 32 overlap)...`);
    const chunks = chunkText(text, 256, 32);
    if (chunks.length === 0) {
      return res.status(400).json({ error: 'PDF produced no usable text chunks', filename });
    }

    console.log(`[upload/clinical] Embedding ${chunks.length} chunks...`);
    const embeddings = await embedBatch(chunks);

    const rows = chunks.map((content, i) => ({
      content,
      embedding: embeddings[i],
      metadata: {
        type: 'clinical',
        patient_id,
        record_type,
        date,
        source_filename: filename,
      },
      source_filename: filename,
      chunk_index: i,
    }));

    console.log(`[upload/clinical] Storing ${rows.length} chunks in Supabase...`);
    const { error } = await supabase.from('document_chunks').insert(rows);
    if (error) throw error;

    console.log(`[upload/clinical] Done: ${filename} → ${rows.length} chunks`);
    res.json({
      success: true,
      filename,
      chunks_stored: rows.length,
      patient_id,
    });
  } catch (err) {
    const filename = req.file?.originalname ?? 'unknown';
    console.error(`[upload/clinical] Error processing ${filename}:`, err);
    res.status(500).json({ error: 'Failed to process clinical document', filename });
  }
});

// ─── POST /api/upload/policy ─────────────────────────────────────────────────

const policySchema = z.object({
  payer: z.string().min(1),
  cpt_codes: z.string().min(1),
  policy_id: z.string().min(1),
});

router.post('/policy', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are accepted', filename: req.file.originalname });
    }

    const parsed = policySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid parameters', details: parsed.error.flatten() });
    }
    const { payer, policy_id } = parsed.data;
    const cpt_codes = parsed.data.cpt_codes.split(',').map((c) => c.trim());
    const filename = req.file.originalname;

    console.log(`[upload/policy] Parsing PDF: ${filename}`);
    const text = await parsePdfBuffer(req.file.buffer);

    console.log(`[upload/policy] Chunking (512 tokens, 64 overlap)...`);
    const chunks = chunkText(text, 512, 64);
    if (chunks.length === 0) {
      return res.status(400).json({ error: 'PDF produced no usable text chunks', filename });
    }

    console.log(`[upload/policy] Embedding ${chunks.length} chunks...`);
    const embeddings = await embedBatch(chunks);

    const rows = chunks.map((content, i) => ({
      content,
      embedding: embeddings[i],
      metadata: {
        type: 'policy',
        payer,
        policy_id,
        cpt_codes,
        section_header: extractSectionHeader(chunks[i]),
      },
      source_filename: filename,
      chunk_index: i,
    }));

    console.log(`[upload/policy] Storing ${rows.length} chunks in Supabase...`);
    const { error } = await supabase.from('document_chunks').insert(rows);
    if (error) throw error;

    console.log(`[upload/policy] Done: ${filename} → ${rows.length} chunks`);
    res.json({
      success: true,
      filename,
      chunks_stored: rows.length,
      payer,
      cpt_codes,
      policy_id,
    });
  } catch (err) {
    const filename = req.file?.originalname ?? 'unknown';
    console.error(`[upload/policy] Error processing ${filename}:`, err);
    res.status(500).json({ error: 'Failed to process policy document', filename });
  }
});

function extractSectionHeader(text: string): string {
  const firstLine = text.split('\n')[0].trim();
  if (firstLine.length < 100 && !firstLine.endsWith('.')) {
    return firstLine;
  }
  return 'General';
}

export default router;
