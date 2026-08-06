-- Connecting to a self-managed account: reject it clearly, and re-check the
-- flag on every call.
--
-- A Loved One who manages their own account has no caregiver, so a connect
-- attempt should fail — but with an explanation, not a generic error. The
-- check reads profiles.self_managed at call time, so as soon as the patient
-- turns self-management off, the very next attempt succeeds.
--
-- Everything else is carried over unchanged from 20260803: the 5-per-15-minute
-- throttle and the pending-approval behaviour.

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

  -- Read fresh from the row we just selected, so toggling self-management off
  -- takes effect on the next attempt with no caching in between.
  if coalesce(patient.self_managed, false) then
    raise exception 'Sorry, the account you are attempting to connect to is currently self-managed.';
  end if;

  -- Create the request as pending. If an active link already exists, leave it
  -- active (re-entering the code shouldn't drop a caregiver who's already in).
  insert into public.care_relationships (patient_id, caregiver_id, invited_email, status)
  values (patient.id, auth.uid(), coalesce(auth.email(), auth.uid()::text), 'pending')
  on conflict (patient_id, lower(invited_email))
    do update set caregiver_id = auth.uid(),
      status = case when care_relationships.status = 'active'
                    then 'active' else 'pending' end;

  return patient;
end;
$$;

grant execute on function public.connect_with_code(text) to authenticated;
