import { Router, Request, Response } from 'express';
import { z } from 'zod';
import PDFDocument from 'pdfkit';
import { supabase } from '../db/supabase';
import { runEvaluation, generateLetter } from '../services/ragPipeline';

const router = Router();

// GET /api/evaluate — list evaluation runs (most recent first)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { data: requests, error } = await supabase
      .from('prior_auth_requests')
      .select(`
        id,
        patient_id,
        cpt_code,
        payer,
        status,
        created_at,
        patients(first_name, last_name),
        determinations(probability_score, recommendation, missing_info, created_at)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Fetch CPT descriptions for all unique codes
    const uniqueCptCodes = [...new Set((requests ?? []).map((r: any) => r.cpt_code))];
    const cptDescMap = new Map<string, string>();
    if (uniqueCptCodes.length > 0) {
      const { data: cptRows } = await supabase
        .from('cpt_codes')
        .select('code, description')
        .in('code', uniqueCptCodes);
      for (const row of cptRows ?? []) {
        cptDescMap.set(row.code, row.description);
      }
    }

    const runs = (requests ?? []).map((row: any) => {
      const patient = Array.isArray(row.patients) ? row.patients[0] : row.patients;
      const determination = Array.isArray(row.determinations)
        ? row.determinations[0]
        : row.determinations;

      return {
        determination_id: row.id,
        patient_id: row.patient_id,
        patient_name: patient ? `${patient.first_name ?? ''} ${patient.last_name ?? ''}`.trim() : 'Unknown Patient',
        cpt_code: row.cpt_code,
        procedure_description: cptDescMap.get(row.cpt_code) ?? null,
        payer: row.payer,
        status: row.status,
        requested_at: row.created_at,
        recommendation: determination?.recommendation ?? null,
        probability_score: typeof determination?.probability_score === 'number' ? determination.probability_score : null,
        missing_info_count: Array.isArray(determination?.missing_info) ? determination.missing_info.length : 0,
        completed_at: determination?.created_at ?? null,
      };
    });

    res.json(runs);
  } catch (err) {
    console.error('GET /api/evaluate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/evaluate — trigger a new prior auth evaluation
router.post('/', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      patient_id: z.string().uuid(),
      cpt_code: z.string().min(1),
      payer: z.string().min(1),
    });

    const { patient_id, cpt_code, payer } = schema.parse(req.body);

    // Create prior auth request
    const { data: request, error: reqError } = await supabase
      .from('prior_auth_requests')
      .insert({ patient_id, cpt_code, payer, status: 'pending' })
      .select()
      .single();

    if (reqError) throw reqError;

    // Kick off evaluation async — don't await
    runEvaluation(patient_id, cpt_code, payer, request.id).catch((err) => {
      console.error(`Evaluation failed for request ${request.id}:`, err);
      supabase
        .from('prior_auth_requests')
        .update({ status: 'error' })
        .eq('id', request.id)
        .then();
    });

    res.json({ determination_id: request.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request body. Required: patient_id (uuid), cpt_code, payer.' });
    }
    console.error('POST /api/evaluate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/evaluate/:id — poll for determination result
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // First check the request status
    const { data: request, error: reqError } = await supabase
      .from('prior_auth_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (reqError || !request) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }

    if (request.status === 'pending') {
      return res.json({ status: 'pending', message: 'Evaluation in progress...' });
    }

    if (request.status === 'error') {
      return res.json({ status: 'error', message: 'Evaluation failed. Please try again.' });
    }

    // Fetch the determination
    const { data: determination, error: detError } = await supabase
      .from('determinations')
      .select('*')
      .eq('request_id', id)
      .single();

    if (detError || !determination) {
      return res.json({ status: 'pending', message: 'Evaluation in progress...' });
    }

    res.json({ status: 'complete', ...determination });
  } catch (err) {
    console.error('GET /api/evaluate/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/evaluate/:id/letter — generate Letter of Medical Necessity as PDF
router.post('/:id/letter', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    // Verify the evaluation is complete
    const { data: request, error: reqError } = await supabase
      .from('prior_auth_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (reqError || !request) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }

    if (request.status !== 'complete') {
      return res.status(400).json({ error: 'Evaluation is not yet complete' });
    }

    // Generate the letter text via Claude
    const letterText = await generateLetter(id);

    // Build PDF
    const doc = new PDFDocument({ margin: 72, size: 'LETTER' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    const pdfReady = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    doc.font('Helvetica').fontSize(11);

    // Write letter text line by line, preserving blank-line paragraph breaks
    const lines = letterText.split('\n');
    for (const line of lines) {
      if (line.trim() === '') {
        doc.moveDown(0.5);
      } else {
        doc.text(line, { align: 'left', lineGap: 2 });
      }
    }

    doc.end();
    const pdfBuffer = await pdfReady;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Letter_of_Medical_Necessity_${id}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('POST /api/evaluate/:id/letter error:', err);
    res.status(500).json({ error: 'Failed to generate letter' });
  }
});

export default router;
