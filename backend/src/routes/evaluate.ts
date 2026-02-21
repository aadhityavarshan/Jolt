import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase';
import { runEvaluation } from '../services/ragPipeline';

const router = Router();

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

export default router;
