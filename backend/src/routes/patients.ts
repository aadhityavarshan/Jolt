import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase';

const router = Router();

// GET /api/patients/search?q=john
router.get('/search', async (req, res) => {
  try {
    const schema = z.object({ q: z.string().min(1) });
    const { q } = schema.parse(req.query);

    const trimmed = q.trim();
    const parts = trimmed.split(/\s+/);

    let query = supabase
      .from('patients')
      .select('id, first_name, last_name, dob, mrn, coverage(payer, is_active)');

    if (parts.length >= 2) {
      // "John Smith" — match first name AND last name
      const [first, ...rest] = parts;
      const last = rest.join(' ');
      query = query
        .ilike('first_name', `%${first}%`)
        .ilike('last_name', `%${last}%`);
    } else {
      // Single token — match either field
      query = query.or(
        `first_name.ilike.%${trimmed}%,last_name.ilike.%${trimmed}%`
      );
    }

    const { data, error } = await query.limit(10);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const mapped = (data ?? []).map((row) => {
      const coverageRows = (
        (row as { coverage?: Array<{ payer: string; is_active: boolean }> }).coverage ?? []
      ).filter((c) => c.is_active);

      return {
        id: row.id,
        first_name: row.first_name,
        last_name: row.last_name,
        dob: row.dob,
        mrn: row.mrn,
        payer: coverageRows[0]?.payer ?? null,
      };
    });

    res.json(mapped);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Query must be at least 1 character' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/patients/:id  — patient + active coverage + document list
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch patient, coverage, and distinct uploaded docs in parallel
    const [patientRes, coverageRes, docsRes] = await Promise.all([
      supabase.from('patients').select('*').eq('id', id).single(),
      supabase.from('coverage').select('*').eq('patient_id', id).eq('is_active', true),
      supabase
        .from('document_chunks')
        .select('source_filename, metadata')
        .eq('metadata->>patient_id', id)
        .eq('metadata->>type', 'clinical'),
    ]);

    if (patientRes.error || !patientRes.data) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Deduplicate documents by source_filename
    const seen = new Set<string>();
    const documents = (docsRes.data ?? [])
      .filter((row) => {
        if (seen.has(row.source_filename)) return false;
        seen.add(row.source_filename);
        return true;
      })
      .map((row) => ({
        filename: row.source_filename,
        record_type: (row.metadata as { record_type?: string }).record_type ?? 'Unknown',
        date: (row.metadata as { date?: string }).date ?? null,
      }));

    res.json({
      patient: patientRes.data,
      coverage: coverageRes.data ?? [],
      documents,
    });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
