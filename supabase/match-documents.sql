-- Run this if test:supabase says "match_documents RPC not found"
-- Supabase → SQL Editor → New query → paste → Run

create extension if not exists vector;

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
