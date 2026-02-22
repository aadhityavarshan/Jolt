import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import multer from 'multer';
import { supabase } from '../db/supabase';
import { isSupportedUploadMimeType, parseUploadedDocumentBuffer } from '../services/pdfParser';
import { chunkText } from '../services/chunker';
import { embedBatch } from '../services/embedder';
import { extractClinicalMetadata, extractPolicyMetadata } from '../services/metadataExtractor';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// ─── POST /api/upload/clinical ───────────────────────────────────────────────

router.post('/clinical', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    if (!isSupportedUploadMimeType(req.file.mimetype)) {
      return res.status(400).json({
        error: 'Unsupported file type. Accepted: PDF, TXT, PNG, JPG/JPEG, WEBP, GIF',
        filename: req.file.originalname,
      });
    }

    const filename = req.file.originalname;

    console.log(`[upload/clinical] Parsing document: ${filename} (${req.file.mimetype})`);
    const text = await parseUploadedDocumentBuffer(req.file.buffer, req.file.mimetype);

    console.log(`[upload/clinical] Extracting metadata via Claude...`);
    const { patient_id, record_type, date } = await extractClinicalMetadata(text);
    console.log(`[upload/clinical] Metadata: patient_id=${patient_id}, record_type=${record_type}, date=${date}`);

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

    // Store original PDF in Supabase Storage
    if (req.file.mimetype === 'application/pdf') {
      const storagePath = `clinical/${randomUUID()}-${filename}`;
      console.log(`[upload/clinical] Uploading original PDF to storage: ${storagePath}`);
      const { error: storageErr } = await supabase.storage
        .from('documents')
        .upload(storagePath, req.file.buffer, { contentType: 'application/pdf' });
      if (storageErr) {
        console.error(`[upload/clinical] Storage upload failed (non-fatal):`, storageErr);
      } else {
        const { error: docErr } = await supabase.from('documents').insert({
          patient_id,
          doc_type: 'clinical',
          filename,
          storage_path: storagePath,
          record_type,
          date: date || null,
        });
        if (docErr) console.error(`[upload/clinical] documents insert failed (non-fatal):`, docErr);
      }
    }

    console.log(`[upload/clinical] Done: ${filename} → ${rows.length} chunks`);
    res.json({
      success: true,
      filename,
      chunks_stored: rows.length,
      patient_id,
      record_type,
      date,
    });
  } catch (err) {
    const filename = req.file?.originalname ?? 'unknown';
    console.error(`[upload/clinical] Error processing ${filename}:`, err);
    const message = err instanceof Error ? err.message : 'Failed to process clinical document';
    res.status(500).json({ error: message, filename });
  }
});

// ─── POST /api/upload/policy ─────────────────────────────────────────────────

router.post('/policy', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    if (!isSupportedUploadMimeType(req.file.mimetype)) {
      return res.status(400).json({
        error: 'Unsupported file type. Accepted: PDF, TXT, PNG, JPG/JPEG, WEBP, GIF',
        filename: req.file.originalname,
      });
    }

    const filename = req.file.originalname;

    console.log(`[upload/policy] Parsing document: ${filename} (${req.file.mimetype})`);
    const text = await parseUploadedDocumentBuffer(req.file.buffer, req.file.mimetype);

    console.log(`[upload/policy] Extracting metadata via Claude...`);
    const { payer, cpt_codes, policy_id } = await extractPolicyMetadata(text);
    console.log(`[upload/policy] Metadata: payer=${payer}, cpt_codes=${cpt_codes.join(',')}, policy_id=${policy_id}`);

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

    // Store original PDF in Supabase Storage
    if (req.file.mimetype === 'application/pdf') {
      const storagePath = `policy/${randomUUID()}-${filename}`;
      console.log(`[upload/policy] Uploading original PDF to storage: ${storagePath}`);
      const { error: storageErr } = await supabase.storage
        .from('documents')
        .upload(storagePath, req.file.buffer, { contentType: 'application/pdf' });
      if (storageErr) {
        console.error(`[upload/policy] Storage upload failed (non-fatal):`, storageErr);
      } else {
        const { error: docErr } = await supabase.from('documents').insert({
          doc_type: 'policy',
          filename,
          storage_path: storagePath,
          payer,
          policy_id,
        });
        if (docErr) console.error(`[upload/policy] documents insert failed (non-fatal):`, docErr);
      }
    }

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
    const message = err instanceof Error ? err.message : 'Failed to process policy document';
    res.status(500).json({ error: message, filename });
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
