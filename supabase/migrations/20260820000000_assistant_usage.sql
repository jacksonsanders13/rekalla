-- =====================================================================
-- Rekalla — assistant usage meter + monthly cap.
-- The Edge Function writes one row per answered message (service role),
-- so we can enforce a per-user monthly limit that protects API spend and
-- guarantees margin once priced. The client cannot bypass it.
-- =====================================================================

create table if not exists public.assistant_usage (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  input_tokens   integer not null default 0,
  output_tokens  integer not null default 0,
  -- Estimated cost in micro-dollars (1 dollar = 1e6). Sonnet 5: $3/1M in,
  -- $15/1M out  ->  micros = input*3 + output*15.
  est_cost_micros integer not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists assistant_usage_user_month_idx
  on public.assistant_usage (user_id, created_at);

alter table public.assistant_usage enable row level security;

-- The elder can read their own usage (to show "X of Y messages this month").
-- INSERTs are done by the Edge Function with the service role (bypasses RLS);
-- there is deliberately no insert policy, so clients can never fake usage.
create policy assistant_usage_own_select on public.assistant_usage
  for select using (user_id = auth.uid());
