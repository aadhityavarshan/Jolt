# Jolt

Jolt streamlines the prior authorization workflow by letting clinical staff instantly look up patients, verify active insurance coverage, and review uploaded clinical documents — all in one place, powered by AI document processing.

---

## Features

- **Patient search** — Real-time autocomplete by first or last name (debounced, case-insensitive prefix match)
- **Coverage verification** — See active insurance plans, payer, and member IDs at a glance
- **Clinical document viewer** — Browse uploaded medical records linked to each patient
- **AI document ingestion** — PDFs are chunked, embedded via VoyageAI, and stored in Supabase for retrieval
- **Input validation** — All API inputs are sanitized and validated with Zod

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query, Lucide React |
| Backend | Node.js, Express v5, TypeScript |
| Database | Supabase (PostgreSQL + pgvector) |
| AI / Embeddings | Anthropic Claude SDK, OpenAI, VoyageAI |
| File uploads | Multer |
| Validation | Zod |

---

## Project Structure

```
Jolt/
├── backend/
│   └── src/
│       ├── app.ts              # Express server entry point
│       └── routes/
│           ├── patients.ts     # Patient search & detail endpoints
│           └── upload.ts       # Document upload endpoint
├── frontend/
│   └── src/
│       ├── App.tsx             # Root app component
│       ├── components/
│       │   ├── PatientSearch.tsx  # Autocomplete search input
│       │   └── PatientCard.tsx    # Patient detail panel
│       └── lib/
│           └── api.ts          # Typed API client
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with `patients`, `coverage`, and `document_chunks` tables
- API keys for Anthropic, OpenAI, and VoyageAI

### Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
VOYAGE_API_KEY=your_voyage_key
```

The backend will be available at `http://localhost:3001`.

### Frontend

```bash
cd frontend
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3001
```

Start the dev server:

```bash
npm run dev
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/patients/search?q=<name>` | Autocomplete patient search (min 2 chars, max 10 results) |
| `GET` | `/api/patients/:id` | Full patient record — demographics, coverage, clinical documents |
| `POST` | `/api/upload` | Upload a clinical PDF for a patient |

---

## Team

Built at **Hacklytics 2026** — Georgia Tech's annual data science hackathon.

