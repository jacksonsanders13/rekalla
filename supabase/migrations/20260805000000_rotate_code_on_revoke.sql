-- Restored on 2026-09-16, unchanged from the reviewed version in 318e9a8.
-- It was written on 2026-08-05 and never reached the database: 43603eb reused
-- this same 20260805000000 prefix for a different migration and deleted this
-- file in the same commit, then 094010e reverted that replacement and deleted
-- it too. Neither commit mentioned the loss. Verified against production on
-- restore: the trigger below does not exist there, generate_connect_code still
-- uses random(), and anon still holds EXECUTE on it. So this has never run.
-- Do not reuse a timestamp prefix that is already taken.

-- Rotate the patient's connect code whenever a connection is revoked.
--
-- With the approval gate in 20260803, a removed caregiver who still knows the
-- code can no longer regain access on their own — re-entering it only creates
-- another PENDING request. But they can still generate those requests, and the
-- code stays valid forever. Rotating on revoke makes "remove this caregiver"
-- mean what the Terms say it means: their code stops working.
--
-- Also replaces random() in the generator. random() is a non-cryptographic
-- PRNG, which is the wrong tool for a secret that gates account access.
-- gen_random_uuid() is a built-in (pg_catalog, PG13+) backed by a
-- cryptographic source, so this needs no extension and is unaffected by
-- search_path. Length and alphabet are unchanged — the code still reads the
-- same to users.

create or replace function public.generate_connect_code()
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
  hex text;
  i int;
begin
  loop
    hex := replace(gen_random_uuid()::text, '-', '');  -- 32 hex chars = 16 bytes
    code := '';
    for i in 1..6 loop
      code := code || substr(
        alphabet,
        (('x' || substr(hex, i * 2 - 1, 2))::bit(8)::int % length(alphabet)) + 1,
        1
      );
    end loop;
    exit when not exists (select 1 from public.profiles where connect_code = code);
  end loop;
  return code;
end;
$$;

-- SECURITY DEFINER because the row may be revoked by the caregiver declining
-- out, and a caregiver has no RLS write access to the patient's profile row.
create or replace function public.rotate_code_on_revoke()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'revoked' and old.status is distinct from 'revoked' then
    update public.profiles
       set connect_code = public.generate_connect_code()
     where id = new.patient_id;
  end if;
  return new;
end;
$$;

drop trigger if exists care_rotate_code_on_revoke on public.care_relationships;
create trigger care_rotate_code_on_revoke
  after update on public.care_relationships
  for each row execute function public.rotate_code_on_revoke();

-- generate_connect_code is currently callable over the REST API by anyone
-- (POST /rest/v1/rpc/generate_connect_code returns 200). It leaks no existing
-- codes, but there is no reason for a client to call it. It is only ever used
-- by the signup trigger and the rotation trigger above, both SECURITY DEFINER.
--
-- PUBLIC has to be revoked first. Postgres grants EXECUTE on new functions to
-- PUBLIC by default, its ACL entry is the `=X/postgres` one, and privileges are
-- additive: anon and authenticated are members of PUBLIC, so revoking from just
-- those two roles leaves the PUBLIC grant standing and both can still call it.
-- The named roles are then revoked as well to clear their explicit grants.
revoke execute on function public.generate_connect_code() from public;
revoke execute on function public.generate_connect_code() from anon, authenticated;
