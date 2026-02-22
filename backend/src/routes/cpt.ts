import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase';

const router = Router();

// GET /api/cpt/search?q=knee  or  ?q=27447
router.get('/search', async (req, res) => {
  try {
    const schema = z.object({ q: z.string().optional().default('') });
    const { q } = schema.parse(req.query);

    const trimmed = q.trim();

    let query = supabase
      .from('cpt_codes')
      .select('id, code, description, category');

    if (trimmed.length > 0) {
      query = query.or(`code.ilike.%${trimmed}%,description.ilike.%${trimmed}%`);
    }

    const { data, error } = await query.order('code').limit(100);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data ?? []);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameter' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
