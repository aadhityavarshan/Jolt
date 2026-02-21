# Tech Stack — Jolt

## Frontend

| Library | Version | Purpose |
|---------|---------|---------|
| React | 18 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool + dev server |
| Tailwind CSS | 3.x | Utility-first styling |
| shadcn/ui | latest | Pre-built accessible components |
| React Router | v6 | Client-side routing |
| TanStack Query | v5 | Server state, caching, polling |
| Axios or native fetch | — | HTTP requests to backend |

**shadcn/ui component installation:**
```bash
npx shadcn-ui@latest add button card input badge dialog table
```

**Vite setup:**
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend && npm install
npx tailwindcss init -p
```

---

## Backend

| Library | Version | Purpose |
|---------|---------|---------|
| Node.js | 20 LTS | Runtime |
| Express | 4.x | HTTP server |
| TypeScript | 5.x | Type safety |
| ts-node-dev | latest | Hot reload in dev |
| Multer | 1.x | PDF file uploads |
| Zod | 3.x | Request validation |
| @supabase/supabase-js | 2.x | Supabase client |
| @anthropic-ai/sdk | latest | Claude API |
| openai | 4.x | OpenAI embeddings |
| cors | 2.x | CORS middleware |
| dotenv | 16.x | Environment variables |

**Backend setup:**
```bash
mkdir backend && cd backend
npm init -y
npm install express @supabase/supabase-js @anthropic-ai/sdk openai multer zod cors dotenv
npm install -D typescript ts-node-dev @types/express @types/node @types/multer @types/cors
npx tsc --init
```

---

## AI / LLM

### Anthropic Claude Sonnet (claude-sonnet-4-5)
- Used for: PDF text extraction, policy requirement extraction, criterion evaluation
- Client: `@anthropic-ai/sdk`
- PDF parsing: native document support via base64 (up to ~100 pages)
- Fallback: `pdf-parse` library for docs exceeding Claude's limit

```typescript
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
```

### OpenAI text-embedding-3-small
- Used for: generating vector embeddings for all document chunks
- Dimensions: 1536
- Very cheap: ~$0.02 per million tokens

```typescript
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function embed(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return res.data[0].embedding;
}
```

---

## Database — Supabase

### Setup
1. Create project at supabase.com
2. Enable pgvector: run `CREATE EXTENSION IF NOT EXISTS vector;` in SQL editor
3. Copy `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` from project settings → API

### Client (backend only)
```typescript
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
```

### Vector Search RPC
```typescript
const { data, error } = await supabase.rpc('match_chunks', {
  query_embedding: embedding,   // number[1536]
  match_threshold: 0.5,
  match_count: 10,
  filter: { type: 'policy', payer: 'Aetna' }  // JSONB filter
});
```

---

## Routing — Frontend

```
/                    → SearchPage
/patient/:id         → PatientPage
/evaluate/:id        → EvaluatePage
/determination/:id   → DeterminationPage
/admin               → AdminPage
```

---

## Environment Variables

**Backend `.env`:**
```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
PORT=3001
NODE_ENV=development
```

**Frontend `.env`:**
```env
VITE_API_URL=http://localhost:3001
```

**Production (set in Vercel/Railway dashboard — never commit):**
```env
# Vercel: VITE_API_URL=https://your-railway-app.railway.app
# Railway: all backend vars
```

---

## Deployment

| Service | What | Cost |
|---------|------|------|
| Vercel | Frontend (React build) | Free |
| Railway | Backend (Express) | Free ($5 credit/mo) |
| Supabase | Database + pgvector | Free (500MB DB, 1GB storage) |

**Deploy frontend to Vercel:**
- Connect GitHub repo, set root directory to `frontend`
- Add env var: `VITE_API_URL`

**Deploy backend to Railway:**
- Connect GitHub repo, set root to `backend`
- Add all backend env vars
- Set start command: `npm start` (runs `node dist/app.js`)
