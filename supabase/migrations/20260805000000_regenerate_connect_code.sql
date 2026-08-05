-- Let a patient generate a fresh connect code on demand.
--
-- Replaces the earlier automatic-rotation-on-revoke approach with something
-- the patient controls: a button in the app. The old code stops working as
-- soon as a new one is issued, which is what makes "remove this caregiver"
-- stick if they still had the code written down.
--
-- Deliberately reuses the existing generate_connect_code() rather than
-- redefining it, so this migration touches as little as possible.

create or replace function public.regenerate_connect_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to change your connect code.';
  end if;

  new_code := public.generate_connect_code();

  update public.profiles
     set connect_code = new_code
   where id = auth.uid();

  return new_code;
end;
$$;

revoke all on function public.regenerate_connect_code() from public;
grant execute on function public.regenerate_connect_code() to authenticated;
