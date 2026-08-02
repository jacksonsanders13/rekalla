-- Self-managed patient accounts.
--
-- An older adult can choose to manage their own reminders, routine, and memory
-- bank — no caregiver required. This adds a `self_managed` flag and grants a
-- self-managed patient write access to their OWN rows, alongside the existing
-- caregiver-management policies (RLS policies are additive / OR'd).

alter table public.profiles
  add column self_managed boolean not null default false;

-- New signups read self_managed from sign-up metadata (default false).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, account_type, connect_code, self_managed)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(
      (new.raw_user_meta_data ->> 'account_type')::public.account_type,
      'patient'
    ),
    public.generate_connect_code(),
    coalesce((new.raw_user_meta_data ->> 'self_managed')::boolean, false)
  );
  return new;
end;
$$;

-- True when the current user manages their own account.
-- SECURITY DEFINER so the check itself is not subject to RLS.
create or replace function public.is_self_managed()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and self_managed
  );
$$;

-- ---------------------------------------------------------------------------
-- Reminders — self-managed owner can create / update / delete their own
-- ---------------------------------------------------------------------------

create policy "reminders: self-managed owner creates"
  on public.reminders for insert
  with check (
    user_id = auth.uid() and created_by = auth.uid() and public.is_self_managed()
  );
create policy "reminders: self-managed owner updates"
  on public.reminders for update
  using (user_id = auth.uid() and public.is_self_managed())
  with check (user_id = auth.uid() and public.is_self_managed());
create policy "reminders: self-managed owner deletes"
  on public.reminders for delete
  using (user_id = auth.uid() and public.is_self_managed());

-- ---------------------------------------------------------------------------
-- Routine items
-- ---------------------------------------------------------------------------

create policy "routine_items: self-managed owner creates"
  on public.routine_items for insert
  with check (user_id = auth.uid() and public.is_self_managed());
create policy "routine_items: self-managed owner updates"
  on public.routine_items for update
  using (user_id = auth.uid() and public.is_self_managed())
  with check (user_id = auth.uid() and public.is_self_managed());
create policy "routine_items: self-managed owner deletes"
  on public.routine_items for delete
  using (user_id = auth.uid() and public.is_self_managed());

-- ---------------------------------------------------------------------------
-- Vault items
-- ---------------------------------------------------------------------------

create policy "vault_items: self-managed owner creates"
  on public.vault_items for insert
  with check (user_id = auth.uid() and public.is_self_managed());
create policy "vault_items: self-managed owner updates"
  on public.vault_items for update
  using (user_id = auth.uid() and public.is_self_managed())
  with check (user_id = auth.uid() and public.is_self_managed());
create policy "vault_items: self-managed owner deletes"
  on public.vault_items for delete
  using (user_id = auth.uid() and public.is_self_managed());
