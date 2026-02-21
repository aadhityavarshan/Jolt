-- Jolt Schema — Run in Supabase SQL Editor
-- ==========================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dob DATE NOT NULL,
  mrn TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Coverage table (insurance info per patient)
CREATE TABLE IF NOT EXISTS coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  payer TEXT NOT NULL,
  member_id TEXT,
  plan_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CPT code catalog
CREATE TABLE IF NOT EXISTS cpt_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT NOT NULL
);

-- 5. Document chunks (clinical + policy, with embeddings)
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(1024),
  metadata JSONB NOT NULL DEFAULT '{}',
  source_filename TEXT NOT NULL,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Prior auth requests
CREATE TABLE IF NOT EXISTS prior_auth_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  cpt_code TEXT NOT NULL,
  payer TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Determinations (evaluation results)
CREATE TABLE IF NOT EXISTS determinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES prior_auth_requests(id) ON DELETE CASCADE,
  probability_score FLOAT NOT NULL,
  recommendation TEXT NOT NULL CHECK (recommendation IN ('LIKELY_APPROVED', 'LIKELY_DENIED', 'INSUFFICIENT_INFO')),
  criteria_results JSONB NOT NULL DEFAULT '[]',
  missing_info JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- INDEXES
-- ==========================================

-- HNSW index for fast vector similarity search
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
  ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- GIN index on metadata for fast JSONB filtering
CREATE INDEX IF NOT EXISTS idx_document_chunks_metadata
  ON document_chunks
  USING gin (metadata);

-- Index for patient name search
CREATE INDEX IF NOT EXISTS idx_patients_last_name
  ON patients (last_name text_pattern_ops);

CREATE INDEX IF NOT EXISTS idx_patients_first_name
  ON patients (first_name text_pattern_ops);

-- Index for CPT code search
CREATE INDEX IF NOT EXISTS idx_cpt_codes_code
  ON cpt_codes (code text_pattern_ops);

-- ==========================================
-- RPC: match_chunks (vector similarity search)
-- ==========================================

CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding VECTOR(1024),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 10,
  filter JSONB DEFAULT '{}'
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  source_filename TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.content,
    dc.metadata,
    dc.source_filename,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE
    1 - (dc.embedding <=> query_embedding) > match_threshold
    AND (
      filter = '{}'::jsonb
      OR dc.metadata @> filter
    )
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
