import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase';

const router = Router();

type PatientWithCoverage = {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  mrn?: string | null;
  coverage?: Array<{ payer: string; is_active: boolean }>;
};

function mapPatientRow(row: PatientWithCoverage) {
  const coverageRows = (row.coverage ?? []).filter((coverage) => coverage.is_active);

  return {
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    dob: row.dob,
    mrn: row.mrn ?? null,
    payer: coverageRows[0]?.payer ?? null,
  };
}

// GET /api/patients - list all patients for profile browser
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('id, first_name, last_name, dob, mrn, coverage(payer, is_active)')
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true })
      .limit(500);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json((data ?? []).map((row) => mapPatientRow(row as PatientWithCoverage)));
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
      const [first, ...rest] = parts;
      const last = rest.join(' ');
      query = query.ilike('first_name', `%${first}%`).ilike('last_name', `%${last}%`);
    } else {
      query = query.or(`first_name.ilike.%${trimmed}%,last_name.ilike.%${trimmed}%`);
    }

    const { data, error } = await query.limit(10);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json((data ?? []).map((row) => mapPatientRow(row as PatientWithCoverage)));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Query must be at least 1 character' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/patients/:id  - patient + active coverage + clinical chunks
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [patientRes, coverageRes, docsRes] = await Promise.all([
      supabase.from('patients').select('*').eq('id', id).single(),
      supabase.from('coverage').select('*').eq('patient_id', id).eq('is_active', true),
      supabase
        .from('document_chunks')
        .select('content, source_filename, metadata')
        .eq('metadata->>patient_id', id)
        .eq('metadata->>type', 'clinical'),
    ]);

    if (patientRes.error || !patientRes.data) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const documents = (docsRes.data ?? []).map((row) => ({
      filename: row.source_filename,
      record_type: (row.metadata as { record_type?: string }).record_type ?? 'Unknown',
      date: (row.metadata as { date?: string }).date ?? null,
      source_filename: row.source_filename,
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

// GET /api/patients/:id/documents/:filename - full text of a clinical document
router.get('/:id/documents/:filename', async (req, res) => {
  try {
    const { id, filename } = req.params;

    const { data, error } = await supabase
      .from('document_chunks')
      .select('content, chunk_index, metadata')
      .eq('metadata->>patient_id', id)
      .eq('source_filename', filename)
      .eq('metadata->>type', 'clinical')
      .order('chunk_index', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const content = data.map((chunk) => chunk.content).join('\n\n');
    const meta = data[0].metadata as { record_type?: string; date?: string };

    res.json({
      filename,
      content,
      record_type: meta.record_type ?? 'Unknown',
      date: meta.date ?? null,
    });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
