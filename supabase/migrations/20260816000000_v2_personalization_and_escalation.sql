-- =====================================================================
-- Rekalla v2 — Personalization Profile + Assistant Escalation Log
-- Migration ID: 20260816000000
-- Branch: v2-assistant
--
-- Part A (personalization profile) + Part C (escalation log) schema.
-- Non-medical content ONLY. No diagnoses, no medications, no conditions.
-- The elder (account_type = 'patient') OWNS their profile. Connected,
-- ACTIVE caregivers may read it and fill gaps; every family edit is
-- attributed so the elder can see who changed what.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. personalization_profiles — one row per elder (1:1 with profiles.id)
--    Each section is JSONB so both clients read/write the same shape and
--    shared validation can live in Postgres/Edge functions. section_status
--    drives the progress indicator + "which sections are empty" gap UI.
-- ---------------------------------------------------------------------
create table if not exists public.personalization_profiles (
  user_id      uuid primary key references public.profiles (id) on delete cascade,

  -- Identity: legal_name, preferred_name, hometown, career, faith
  identity     jsonb not null default '{}'::jsonb,
  -- People: [{ name, relationship, kind: 'family'|'friend'|'grandkid'|'pet', notes }]
  people       jsonb not null default '[]'::jsonb,
  -- Routine: { typical_week: [...], standing_commitments: [{ label, cadence, logistics }] }
  --   LOGISTICS ONLY — "dialysis transport Tue 9am", never the condition.
  routine      jsonb not null default '{}'::jsonb,
  -- Interests: { hobbies, music, teams, shows, books }
  interests    jsonb not null default '{}'::jsonb,
  -- Preferences: { enjoy_topics: [...], avoid_topics: [...], tone: 'chatty'|'brief' }
  --   avoid_topics is a hard input to the assistant system prompt (e.g. late spouse).
  preferences  jsonb not null default '{}'::jsonb,
  -- Practical: doctors [{ name, specialty }] SPECIALTY ONLY no diagnoses;
  --   pharmacy, drivers [{ name, when }], emergency_contacts [{ name, phone, priority }]
  practical    jsonb not null default '{}'::jsonb,

  -- section_status: { identity: 'empty'|'partial'|'complete', people: ..., ... }
  -- Denormalized for cheap progress + gap queries; keep in sync in app/trigger.
  section_status jsonb not null default '{}'::jsonb,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.personalization_profiles is
  'v2 personalization profile owned by the elder. Non-medical only.';

-- ---------------------------------------------------------------------
-- 2. profile_edits — audit of every write, so the elder sees family edits.
--    editor_id = who made the change; section = which JSONB column.
-- ---------------------------------------------------------------------
create table if not exists public.profile_edits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade, -- profile owner (elder)
  editor_id   uuid not null references public.profiles (id) on delete cascade, -- who edited
  section     text not null,          -- 'identity' | 'people' | 'routine' | ...
  summary     text,                   -- human-readable "Sarah added 2 grandkids"
  created_at  timestamptz not null default now()
);

create index if not exists profile_edits_user_idx on public.profile_edits (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- 3. escalation_events — Part C tier log. Tier 1 (medical) & Tier 2
--    (financial/scam) are surfaced on the family dashboard. Tier is set
--    by the MODEL in the Edge Function, never keyword matching.
-- ---------------------------------------------------------------------
create type public.escalation_tier as enum (
  'tier1_medical',    -- 911 first, emergency contact second, notify family
  'tier2_financial',  -- surface top-priority contact, never assist txn, notify family
  'tier3_emotional',  -- warm response, offer to reach a person, NO emergency UI
  'tier4_out_of_scope'-- benign redirect, no escalation
);

create table if not exists public.escalation_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade, -- the elder
  tier          public.escalation_tier not null,
  trigger_text  text not null,          -- the exact message that triggered classification
  model_rationale text,                 -- why the model classified it this way (for audit/tuning)
  acknowledged_by uuid references public.profiles (id) on delete set null, -- family member who ack'd
  acknowledged_at timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists escalation_events_user_idx on public.escalation_events (user_id, created_at desc);
create index if not exists escalation_events_open_idx on public.escalation_events (user_id)
  where acknowledged_at is null;

comment on table public.escalation_events is
  'Assistant tier classifications. tier1/tier2 shown on family dashboard.';

-- ---------------------------------------------------------------------
-- 4. updated_at triggers (reuse existing set_updated_at() from initial schema)
-- ---------------------------------------------------------------------
create trigger personalization_profiles_set_updated_at
  before update on public.personalization_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------
alter table public.personalization_profiles enable row level security;
alter table public.profile_edits            enable row level security;
alter table public.escalation_events        enable row level security;

-- Helper: is the current user an ACTIVE caregiver for :owner?
create or replace function public.is_active_caregiver(owner uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.care_relationships cr
    where cr.patient_id = owner
      and cr.caregiver_id = auth.uid()
      and cr.status = 'active'
  );
$$;

-- personalization_profiles: elder full access to own row; active caregivers read+write (gap-fill).
create policy pp_owner_all on public.personalization_profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy pp_caregiver_select on public.personalization_profiles
  for select using (public.is_active_caregiver(user_id));
create policy pp_caregiver_update on public.personalization_profiles
  for update using (public.is_active_caregiver(user_id)) with check (public.is_active_caregiver(user_id));

-- profile_edits: owner reads all edits on their profile; owner+active caregivers can insert.
create policy pe_owner_select on public.profile_edits
  for select using (user_id = auth.uid());
create policy pe_insert on public.profile_edits
  for insert with check (editor_id = auth.uid()
    and (user_id = auth.uid() or public.is_active_caregiver(user_id)));

-- escalation_events: elder sees their own; active caregivers see + acknowledge.
--   INSERTs are done by the Edge Function with the service role (bypasses RLS).
create policy ee_owner_select on public.escalation_events
  for select using (user_id = auth.uid() or public.is_active_caregiver(user_id));
create policy ee_caregiver_ack on public.escalation_events
  for update using (public.is_active_caregiver(user_id)) with check (public.is_active_caregiver(user_id));
