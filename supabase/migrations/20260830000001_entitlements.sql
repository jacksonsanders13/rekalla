-- =====================================================================
-- Rekalla — entitlements.
--
-- One row per paying user, and the single source of truth for what someone
-- is allowed. Neither Apple nor Stripe is trusted directly: both will write
-- here through a webhook, and the Edge Functions read only this table.
--
-- No row means free. That is deliberate: it needs no backfill, and a user
-- created while the billing webhook is down still works, on the free plan.
--
-- This migration adds no payment provider. It only gives the cap somewhere
-- to read a plan from.
-- =====================================================================

create table if not exists public.entitlements (
  user_id            uuid primary key references public.profiles (id) on delete cascade,

  -- 'free' | 'plus'. Text rather than an enum so adding a tier later is a
  -- one-line change in the functions, not a migration with a type rewrite.
  plan               text not null default 'free',

  -- 'active' | 'canceled' | 'expired' | 'in_grace'. Anything other than
  -- 'active' is treated as free at read time, so a failed renewal degrades
  -- instead of locking someone out mid-month.
  status             text not null default 'active',

  -- When the paid period runs out. Null on free.
  current_period_end timestamptz,

  -- Which rail sold it: 'apple' | 'stripe'. Null on free.
  source             text,

  -- The subscription id at that provider, for reconciling a webhook against
  -- a user without trusting the client to tell us who they are.
  external_id        text,

  updated_at         timestamptz not null default now()
);

create index if not exists entitlements_external_id_idx
  on public.entitlements (source, external_id);

create trigger entitlements_updated_at
  before update on public.entitlements
  for each row execute function public.set_updated_at();

alter table public.entitlements enable row level security;

-- Someone can read their own plan, so the app can show which one they are on.
create policy entitlements_own_select on public.entitlements
  for select using (user_id = auth.uid());

-- Deliberately no insert, update or delete policy. Only the Edge Functions,
-- holding the service role, may write here. A client that could grant itself
-- a plan would make the whole table pointless. This mirrors how
-- assistant_usage is locked down.
