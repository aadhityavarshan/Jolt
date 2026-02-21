import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase';

const router = Router();

// GET /api/cpt/search?q=knee  or  ?q=27447
router.get('/search', async (req, res) => {
  try {
    const schema = z.object({ q: z.string().min(1) });
    const { q } = schema.parse(req.query);

    const trimmed = q.trim();

    const { data, error } = await supabase
      .from('cpt_codes')
      .select('id, code, description, category')
      .or(`code.ilike.%${trimmed}%,description.ilike.%${trimmed}%`)
      .limit(15);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data ?? []);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Query must be at least 1 character' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
