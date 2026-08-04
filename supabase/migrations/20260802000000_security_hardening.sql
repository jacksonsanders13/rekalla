-- Security hardening:
--   1. Make vault photos private (signed-URL access only), readable by the
--      owner and their active caregiver — not the whole internet.
--   2. Rate-limit connect-code attempts so patient codes can't be brute-forced.

-- ---------------------------------------------------------------------------
-- 1. Private vault-photos bucket
-- ---------------------------------------------------------------------------

update storage.buckets set public = false where id = 'vault-photos';

-- The old policy allowed anyone to read both buckets. Replace it: avatars stay
-- public; vault photos become owner/caregiver only.
drop policy if exists "storage: public read" on storage.objects;

create policy "storage: public avatar read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "storage: vault photo read (owner or caregiver)"
  on storage.objects for select
  using (
    bucket_id = 'vault-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_caregiver_of(((storage.foldername(name))[1])::uuid)
    )
  );

-- ---------------------------------------------------------------------------
-- 2. Connect-code brute-force protection
-- ---------------------------------------------------------------------------

create table if not exists public.connect_attempts (
  id bigint generated always as identity primary key,
  caregiver_id uuid not null references public.profiles (id) on delete cascade,
  attempted_at timestamptz not null default now()
);

create index if not exists connect_attempts_idx
  on public.connect_attempts (caregiver_id, attempted_at desc);

-- Only the SECURITY DEFINER function below touches this table.
alter table public.connect_attempts enable row level security;

create or replace function public.connect_with_code(code text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  me public.profiles;
  patient public.profiles;
  recent_attempts int;
begin
  select * into me from public.profiles where id = auth.uid();
  if me.account_type is distinct from 'caregiver' then
    raise exception 'Only caregiver accounts can connect using a code.';
  end if;

  -- Throttle: at most 5 attempts per caregiver per 15 minutes.
  select count(*) into recent_attempts
    from public.connect_attempts
    where caregiver_id = auth.uid()
      and attempted_at > now() - interval '15 minutes';
  if recent_attempts >= 5 then
    raise exception 'Too many attempts. Please wait a few minutes and try again.';
  end if;
  insert into public.connect_attempts (caregiver_id) values (auth.uid());

  select * into patient
    from public.profiles
    where connect_code = upper(regexp_replace(coalesce(code, ''), '\s', '', 'g'));

  if patient.id is null then
    raise exception 'That code did not match anyone. Please check it and try again.';
  end if;
  if patient.id = auth.uid() then
    raise exception 'You can''t connect to your own account.';
  end if;
  if patient.account_type is distinct from 'patient' then
    raise exception 'That code belongs to a caregiver account, not a patient.';
  end if;

  insert into public.care_relationships (patient_id, caregiver_id, invited_email, status)
  values (patient.id, auth.uid(), coalesce(auth.email(), auth.uid()::text), 'active')
  on conflict (patient_id, lower(invited_email))
    do update set caregiver_id = auth.uid(), status = 'active';

  return patient;
end;
$$;
