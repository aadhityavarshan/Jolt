import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase';

const router = Router();

// Only letters, spaces, hyphens, and apostrophes (handles O'Brien, Mary-Jane, etc.)
const nameCharPattern = /^[a-zA-Z\s\-']+$/;

const searchSchema = z.object({
  q: z
    .string()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query too long')
    .refine((v) => nameCharPattern.test(v.trim()), {
      message: 'Query may only contain letters, spaces, hyphens, and apostrophes',
    })
    .transform((v) => v.trim()),
});

const uuidSchema = z.string().uuid('Invalid patient ID');

// ─── GET /api/patients/search?q= ─────────────────────────────────────────────
// Autocomplete by first_name or last_name prefix (case-insensitive)
// Returns up to 10 matches with coverage info

router.get('/search', async (req: Request, res: Response) => {
  const raw = (req.query.q as string | undefined) ?? '';

  if (raw.trim().length === 0) {
    return res.json({ patients: [] });
  }

  const parsed = searchSchema.safeParse({ q: raw });
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.issues[0].message,
    });
  }

  const q = parsed.data.q;

  try {
    const prefix = q.toLowerCase();

    // Search on last_name prefix OR first_name prefix (uses text_pattern_ops index)
    const { data, error } = await supabase
      .from('patients')
      .select(`
        id,
        first_name,
        last_name,
        dob,
        mrn,
        coverage (
          payer,
          plan_name,
          is_active
        )
      `)
      .or(
        `last_name.ilike.${prefix}%,first_name.ilike.${prefix}%`
      )
      .order('last_name', { ascending: true })
      .limit(10);

    if (error) throw error;

    res.json({ patients: data ?? [] });
  } catch (err) {
    console.error('[patients/search] Error:', err);
    res.status(500).json({ error: 'Patient search failed' });
  }
});

// ─── GET /api/patients/:id ────────────────────────────────────────────────────
// Full patient detail: demographics + coverage + list of clinical documents

router.get('/:id', async (req: Request, res: Response) => {
  const idParsed = uuidSchema.safeParse(req.params.id);
  if (!idParsed.success) {
    return res.status(400).json({ error: 'Invalid patient ID' });
  }
  const id = idParsed.data;

  try {
    const [patientResult, docsResult] = await Promise.all([
      supabase
        .from('patients')
        .select(`
          id,
          first_name,
          last_name,
          dob,
          mrn,
          coverage (
            id,
            payer,
            member_id,
            plan_name,
            is_active
          )
        `)
        .eq('id', id)
        .single(),

      // Distinct clinical documents (by source_filename) for this patient
      supabase
        .from('document_chunks')
        .select('source_filename, metadata, created_at')
        .eq('metadata->>type', 'clinical')
        .eq('metadata->>patient_id', id)
        .eq('chunk_index', 0) // one row per document (first chunk only)
        .order('created_at', { ascending: false }),
    ]);

    if (patientResult.error) throw patientResult.error;
    if (!patientResult.data) return res.status(404).json({ error: 'Patient not found' });

    res.json({
      patient: patientResult.data,
      documents: docsResult.data ?? [],
    });
  } catch (err) {
    console.error('[patients/:id] Error:', err);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

export default router;
