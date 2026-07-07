-- Row Level Security for all Rekalla tables.
--
-- Access model:
--   * Users have full control over their own rows.
--   * An *active* caregiver can read a patient's data, and can create and
--     manage reminders on the patient's behalf.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- True when the current user is an accepted caregiver for `patient`.
-- SECURITY DEFINER so the check itself is not subject to RLS recursion.
create or replace function public.is_caregiver_of(patient uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.care_relationships
    where patient_id = patient
      and caregiver_id = auth.uid()
      and status = 'active'
  );
$$;

-- True when the current user and `other` are linked by any non-revoked
-- relationship, in either direction. Used to let both sides see each
-- other's display names.
create or replace function public.is_linked_to(other uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.care_relationships
    where status <> 'revoked'
      and (
        (patient_id = auth.uid() and caregiver_id = other)
        or (patient_id = other and caregiver_id = auth.uid())
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

create policy "profiles: read own or linked"
  on public.profiles for select
  using (id = auth.uid() or public.is_linked_to(id));

create policy "profiles: insert own"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles: update own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- care_relationships
-- ---------------------------------------------------------------------------

alter table public.care_relationships enable row level security;

create policy "care: read as participant or invitee"
  on public.care_relationships for select
  using (
    patient_id = auth.uid()
    or caregiver_id = auth.uid()
    or lower(invited_email) = lower(coalesce(auth.email(), ''))
  );

create policy "care: patient invites"
  on public.care_relationships for insert
  with check (patient_id = auth.uid() and caregiver_id is null);

-- Patients manage their invitations; invitees accept or decline them.
create policy "care: patient updates"
  on public.care_relationships for update
  using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

create policy "care: invitee accepts"
  on public.care_relationships for update
  using (
    caregiver_id = auth.uid()
    or lower(invited_email) = lower(coalesce(auth.email(), ''))
  )
  with check (caregiver_id = auth.uid());

create policy "care: patient removes"
  on public.care_relationships for delete
  using (patient_id = auth.uid());

-- ---------------------------------------------------------------------------
-- reminders
-- ---------------------------------------------------------------------------

alter table public.reminders enable row level security;

create policy "reminders: read own or as caregiver"
  on public.reminders for select
  using (user_id = auth.uid() or public.is_caregiver_of(user_id));

create policy "reminders: create own or as caregiver"
  on public.reminders for insert
  with check (
    (user_id = auth.uid() or public.is_caregiver_of(user_id))
    and created_by = auth.uid()
  );

create policy "reminders: update own or as caregiver"
  on public.reminders for update
  using (user_id = auth.uid() or public.is_caregiver_of(user_id))
  with check (user_id = auth.uid() or public.is_caregiver_of(user_id));

create policy "reminders: delete own or as caregiver"
  on public.reminders for delete
  using (user_id = auth.uid() or public.is_caregiver_of(user_id));

-- ---------------------------------------------------------------------------
-- reminder_events
-- ---------------------------------------------------------------------------

alter table public.reminder_events enable row level security;

create policy "reminder_events: read own or as caregiver"
  on public.reminder_events for select
  using (user_id = auth.uid() or public.is_caregiver_of(user_id));

create policy "reminder_events: write own"
  on public.reminder_events for insert
  with check (user_id = auth.uid());

create policy "reminder_events: update own"
  on public.reminder_events for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "reminder_events: delete own"
  on public.reminder_events for delete
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- routine_items / routine_completions
-- ---------------------------------------------------------------------------

alter table public.routine_items enable row level security;

create policy "routine_items: read own or as caregiver"
  on public.routine_items for select
  using (user_id = auth.uid() or public.is_caregiver_of(user_id));

create policy "routine_items: write own"
  on public.routine_items for insert
  with check (user_id = auth.uid());

create policy "routine_items: update own"
  on public.routine_items for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "routine_items: delete own"
  on public.routine_items for delete
  using (user_id = auth.uid());

alter table public.routine_completions enable row level security;

create policy "routine_completions: read own or as caregiver"
  on public.routine_completions for select
  using (user_id = auth.uid() or public.is_caregiver_of(user_id));

create policy "routine_completions: write own"
  on public.routine_completions for insert
  with check (user_id = auth.uid());

create policy "routine_completions: delete own"
  on public.routine_completions for delete
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- vault_items
-- ---------------------------------------------------------------------------

alter table public.vault_items enable row level security;

create policy "vault_items: read own or as caregiver"
  on public.vault_items for select
  using (user_id = auth.uid() or public.is_caregiver_of(user_id));

create policy "vault_items: write own"
  on public.vault_items for insert
  with check (user_id = auth.uid());

create policy "vault_items: update own"
  on public.vault_items for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "vault_items: delete own"
  on public.vault_items for delete
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- wellness_entries
-- ---------------------------------------------------------------------------

alter table public.wellness_entries enable row level security;

create policy "wellness: read own or as caregiver"
  on public.wellness_entries for select
  using (user_id = auth.uid() or public.is_caregiver_of(user_id));

create policy "wellness: write own"
  on public.wellness_entries for insert
  with check (user_id = auth.uid());

create policy "wellness: update own"
  on public.wellness_entries for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "wellness: delete own"
  on public.wellness_entries for delete
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------

alter table public.notifications enable row level security;

create policy "notifications: read own"
  on public.notifications for select
  using (user_id = auth.uid());

-- A user can queue notifications for themselves; a linked user (caregiver or
-- patient) can queue notifications addressed to the other side — this is how
-- missed-reminder alerts reach caregivers.
create policy "notifications: queue own or to linked user"
  on public.notifications for insert
  with check (user_id = auth.uid() or public.is_linked_to(user_id));

create policy "notifications: update own"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifications: delete own"
  on public.notifications for delete
  using (user_id = auth.uid());
