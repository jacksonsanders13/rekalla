-- =====================================================================
-- Rekalla v3 is single-user — there are no caregivers, and no "self_managed"
-- gate. The signed-in owner manages their own reminders and memory items
-- directly. These permissive policies let the owner write their own rows
-- (RLS is OR-combined, so they sit alongside the legacy policies harmlessly).
-- =====================================================================

drop policy if exists "reminders: v3 owner writes" on public.reminders;
create policy "reminders: v3 owner writes"
  on public.reminders for insert
  with check (user_id = auth.uid() and created_by = auth.uid());

drop policy if exists "reminders: v3 owner updates" on public.reminders;
create policy "reminders: v3 owner updates"
  on public.reminders for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "reminders: v3 owner deletes" on public.reminders;
create policy "reminders: v3 owner deletes"
  on public.reminders for delete
  using (user_id = auth.uid());

drop policy if exists "vault_items: v3 owner writes" on public.vault_items;
create policy "vault_items: v3 owner writes"
  on public.vault_items for insert
  with check (user_id = auth.uid());

drop policy if exists "vault_items: v3 owner updates" on public.vault_items;
create policy "vault_items: v3 owner updates"
  on public.vault_items for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "vault_items: v3 owner deletes" on public.vault_items;
create policy "vault_items: v3 owner deletes"
  on public.vault_items for delete
  using (user_id = auth.uid());
