-- Portfolio Chatbot — Phase 3
-- Run this in Supabase: SQL Editor → New query → paste → Run

-- 1. Enable pgvector
create extension if not exists vector;

-- 2. Document chunks table
create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

comment on table public.document_chunks is
  'Text chunks and embeddings for portfolio RAG (bilingual content).';

-- 3. Indexes (metadata — always safe on empty table)
create index if not exists document_chunks_metadata_idx
  on public.document_chunks using gin (metadata);

-- IVFFlat embedding index: run AFTER first ingest (see indexes-after-ingest.sql)
-- Creating IVFFlat on an empty table can fail and block the rest of this script.

-- 4. Similarity search RPC (used in Phase 5)
create or replace function public.match_documents(
  query_embedding vector(1536),
  match_count int default 5,
  match_threshold float default 0.5,
  filter_locale text default null
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    dc.id,
    dc.content,
    dc.metadata,
    (1 - (dc.embedding <=> query_embedding))::float as similarity
  from public.document_chunks dc
  where dc.embedding is not null
    and (1 - (dc.embedding <=> query_embedding)) > match_threshold
    and (
      filter_locale is null
      or dc.metadata->>'locale' = filter_locale
    )
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 5. Row Level Security (service role bypasses RLS; anon key has no access)
alter table public.document_chunks enable row level security;

-- No public policies — only service role (server-side) can read/write
