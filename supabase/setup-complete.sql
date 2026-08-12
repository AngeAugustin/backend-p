-- Portfolio Chatbot — full setup (run this once)
-- Supabase → SQL Editor → New query → paste → Run

-- 1. Extension pgvector
create extension if not exists vector;

-- 2. Table
create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

comment on table public.document_chunks is
  'Text chunks and embeddings for portfolio RAG (bilingual content).';

-- 3. Metadata index
create index if not exists document_chunks_metadata_idx
  on public.document_chunks using gin (metadata);

-- 4. RPC (drop stale versions first)
drop function if exists public.match_documents(vector, int, double precision, text);
drop function if exists public.match_documents(vector, int, float, text);

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
security invoker
set search_path = public
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

-- 5. RLS
alter table public.document_chunks enable row level security;

grant all on public.document_chunks to service_role;
grant execute on function public.match_documents(vector, int, float, text) to service_role;
