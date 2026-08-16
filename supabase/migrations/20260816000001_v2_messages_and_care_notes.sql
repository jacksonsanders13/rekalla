-- =====================================================================
-- Rekalla v2 — Messages + Care Notes
-- Migration ID: 20260816000001
-- Branch: v2-assistant
--
-- Resolves the gap flagged in WORKLOG: the assistant must answer
-- "What did Sarah say about Thanksgiving?" and "Help me write a message
-- to my daughter." Those need a message surface and a care-notes surface
-- as part of the assistant's closed-domain knowledge base.
--
-- Both tables are keyed to the ELDER (the person the thread/notes are
-- about). RLS: the elder + their ACTIVE caregivers can read; anyone in
-- that circle can write. Non-medical content expectation applies to
-- care_notes (logistics/updates, not diagnoses), enforced by product +
-- the assistant system prompt, not the DB.
-- =====================================================================

-- ---------------------------------------------------------------------
-- messages — lightweight family thread, one logical thread per elder.
--   sender_id = who wrote it (elder or a caregiver). body = plain text.
-- ---------------------------------------------------------------------
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade, -- the elder the thread is about
  sender_id   uuid not null references public.profiles (id) on delete cascade, -- who sent it
  body        text not null check (char_length(body) between 1 and 4000),
  created_at  timestamptz not null default now()
);

create index if not exists messages_user_idx on public.messages (user_id, created_at desc);

comment on table public.messages is
  'v2 family messages. One logical thread per elder (user_id). Assistant reads these.';

-- ---------------------------------------------------------------------
-- care_notes — notes family/elder leave about day-to-day life.
--   author_id = who wrote it. Non-medical (logistics, updates, context).
-- ---------------------------------------------------------------------
create table if not exists public.care_notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade, -- the elder the note is about
  author_id   uuid not null references public.profiles (id) on delete cascade, -- who wrote it
  body        text not null check (char_length(body) between 1 and 4000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists care_notes_user_idx on public.care_notes (user_id, created_at desc);

create trigger care_notes_set_updated_at
  before update on public.care_notes
  for each row execute function public.set_updated_at();

comment on table public.care_notes is
  'v2 care notes (non-medical). Assistant reads these as context.';

-- ---------------------------------------------------------------------
-- RLS — reuse is_active_caregiver() from 20260816000000.
--   Read + write: elder themselves, or an active caregiver of that elder.
--   sender_id/author_id must be the acting user (no impersonation).
-- ---------------------------------------------------------------------
alter table public.messages   enable row level security;
alter table public.care_notes enable row level security;

create policy messages_select on public.messages
  for select using (user_id = auth.uid() or public.is_active_caregiver(user_id));
create policy messages_insert on public.messages
  for insert with check (sender_id = auth.uid()
    and (user_id = auth.uid() or public.is_active_caregiver(user_id)));

create policy care_notes_select on public.care_notes
  for select using (user_id = auth.uid() or public.is_active_caregiver(user_id));
create policy care_notes_insert on public.care_notes
  for insert with check (author_id = auth.uid()
    and (user_id = auth.uid() or public.is_active_caregiver(user_id)));
create policy care_notes_update on public.care_notes
  for update using (author_id = auth.uid() or user_id = auth.uid())
  with check (author_id = auth.uid() or user_id = auth.uid());
