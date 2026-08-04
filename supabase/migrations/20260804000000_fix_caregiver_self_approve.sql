-- SECURITY FIX: close the caregiver self-approval hole.
--
-- The "care: invitee accepts" UPDATE policy let a caregiver update their own
-- care_relationships row (with check caregiver_id = auth.uid()) with no
-- restriction on the status column. After connect_with_code was changed to
-- create a PENDING request, this let a caregiver set their own row to 'active'
-- and gain access WITHOUT the patient's approval — defeating the approval gate.
--
-- Connections are created by the SECURITY DEFINER connect_with_code function,
-- and approval/decline is done by the patient via "care: patient updates".
-- Caregivers have no legitimate need to UPDATE care_relationships, so we drop
-- the policy entirely.

drop policy if exists "care: invitee accepts" on public.care_relationships;
