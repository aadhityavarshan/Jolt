# Code Patterns — Jolt

## File Naming

- React components: `PascalCase.tsx` (e.g., `PatientSearch.tsx`)
- Utility files: `camelCase.ts` (e.g., `api.ts`, `utils.ts`)
- Backend routes: `camelCase.ts` (e.g., `patients.ts`, `upload.ts`)
- Backend services: `camelCase.ts` (e.g., `pdfParser.ts`, `ragPipeline.ts`)

---

## TypeScript

Always use strict typing — no implicit `any`.

**Shared types (define in `types/index.ts` in both frontend and backend):**
```typescript
export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  mrn?: string;
}

export interface Coverage {
  id: string;
  patient_id: string;
  payer: string;
  member_id?: string;
  plan_name?: string;
  is_active: boolean;
}

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: ClinicalMetadata | PolicyMetadata;
  source_filename: string;
  similarity?: number;
}

export interface ClinicalMetadata {
  type: 'clinical';
  patient_id: string;
  record_type: string;
  date: string;
  source_filename: string;
}

export interface PolicyMetadata {
  type: 'policy';
  payer: string;
  policy_id: string;
  cpt_codes: string[];
  section_header: string;
}

export interface CriterionResult {
  criterion: string;
  met: boolean;
  confidence: number;
  evidence_quote: string | null;
  clinical_citation: string | null;
  policy_citation: string;
  reasoning: string;
}

export interface Determination {
  id: string;
  request_id: string;
  probability_score: number;
  recommendation: 'LIKELY_APPROVED' | 'LIKELY_DENIED' | 'INSUFFICIENT_INFO';
  criteria_results: CriterionResult[];
  missing_info: string[];
  created_at: string;
}
```

---

## Express Route Pattern

```typescript
// backend/src/routes/patients.ts
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase';

const router = Router();

router.get('/search', async (req: Request, res: Response) => {
  try {
    const schema = z.object({ q: z.string().min(2) });
    const { q } = schema.parse(req.query);

    const { data, error } = await supabase
      .from('patients')
      .select('id, first_name, last_name, dob')
      .or(`last_name.ilike.${q}%,first_name.ilike.${q}%`)
      .limit(10);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

**Error response shape:**
```typescript
{ error: string, code?: string }
```

---

## React Component Pattern

```typescript
// frontend/src/components/PatientSearch.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import type { Patient } from '@/types';

export function PatientSearch() {
  const [query, setQuery] = useState('');

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients', 'search', query],
    queryFn: () => api.patients.search(query),
    enabled: query.length >= 2,
    staleTime: 30_000,
  });

  return (
    <div>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search patient by name..."
      />
      {/* render patients */}
    </div>
  );
}
```

---

## API Client Pattern (frontend)

```typescript
// frontend/src/lib/api.ts
const BASE = import.meta.env.VITE_API_URL;

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  patients: {
    search: (q: string) => get<Patient[]>(`/api/patients/search?q=${encodeURIComponent(q)}`),
    get: (id: string) => get<Patient & { coverage: Coverage[]; documents: string[] }>(`/api/patients/${id}`),
  },
  evaluate: {
    trigger: (body: { patient_id: string; cpt_code: string; payer: string }) =>
      post<{ determination_id: string }>('/api/evaluate', body),
    get: (id: string) => get<Determination>(`/api/evaluate/${id}`),
  },
  cpt: {
    search: (q: string) => get<CptCode[]>(`/api/cpt/search?q=${encodeURIComponent(q)}`),
  },
  upload: {
    clinical: (formData: FormData) =>
      fetch(`${BASE}/api/upload/clinical`, { method: 'POST', body: formData }).then(r => r.json()),
    policy: (formData: FormData) =>
      fetch(`${BASE}/api/upload/policy`, { method: 'POST', body: formData }).then(r => r.json()),
  },
};
```

---

## Chunking Pattern

```typescript
// backend/src/services/chunker.ts
export function chunkText(text: string, maxTokens: number, overlapTokens: number): string[] {
  // Approximate: 1 token ≈ 4 characters
  const maxChars = maxTokens * 4;
  const overlapChars = overlapTokens * 4;
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = start + maxChars;
    // Split on sentence boundary if possible
    let boundary = text.lastIndexOf('. ', end);
    if (boundary <= start || boundary > end) boundary = end;
    chunks.push(text.slice(start, boundary + 1).trim());
    start = boundary + 1 - overlapChars;
  }

  return chunks.filter(c => c.length > 50); // skip tiny fragments
}

// Clinical: chunkText(text, 256, 32)
// Policy:   chunkText(text, 512, 64)
```

---

## shadcn/ui Usage

Always use shadcn components instead of custom HTML for standard UI elements:
- `<Button>` — not `<button>`
- `<Card>`, `<CardHeader>`, `<CardContent>` — for panels
- `<Input>` — for text inputs
- `<Badge>` — for status chips (met/unmet criteria)
- `<Dialog>` — for modals
- `<Progress>` — for approval probability bar

Import from `@/components/ui/[component]`.

---

## Error Handling

- **Backend:** wrap all route handlers in try/catch. Log errors server-side. Return `{ error: string }` with 400 or 500.
- **Frontend:** use TanStack Query's `error` state to show error messages. Never let errors silently fail.
- **Upload errors:** return `{ error: string, filename: string }` so the UI can show which file failed.
- **Claude API errors:** catch and surface "Claude is unavailable" message rather than crashing.
