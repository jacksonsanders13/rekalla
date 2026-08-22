-- =====================================================================
-- Rekalla v3 — "Bring your paper life online".
-- A scan is a photo of a paper document (calendar, appointment card, bill)
-- that the AI turned into reminders. We keep the original image + the raw
-- extraction for provenance ("show me the original"), and let reminders
-- point back at the scan they came from.
-- =====================================================================

create table if not exists public.scans (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  -- Path in the existing private vault-photos bucket, under the owner's folder
  -- (resolved to a short-lived signed URL at display time).
  image_path text not null,
  doc_type   text,                    -- 'calendar' | 'appointment' | 'bill' | 'other'
  raw_json   jsonb,                    -- the extracted items, as returned by the model
  created_at timestamptz not null default now()
);

create index if not exists scans_user_idx on public.scans (user_id, created_at desc);

alter table public.scans enable row level security;

create policy scans_owner_all on public.scans
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Reminders can originate from a scan, and can be all-day (no time → remind in
-- the morning). Bills and untimed calendar entries need a nullable time.
alter table public.reminders
  add column if not exists scan_id uuid references public.scans (id) on delete set null;

alter table public.reminders
  alter column time_of_day drop not null;
