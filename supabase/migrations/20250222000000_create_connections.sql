-- Connections: one row per Fathom → Slack setup
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  slack_webhook_url text not null,
  fathom_webhook_secret text,
  created_at timestamptz not null default now()
);

-- RLS enabled; only server using SUPABASE_SERVICE_ROLE_KEY can access (bypasses RLS)
alter table public.connections enable row level security;
