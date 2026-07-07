-- Seed data for LOCAL DEVELOPMENT ONLY (`supabase db reset` runs this).
-- Never run against production.
--
-- Creates two users:
--   rose@example.com   / password123  (older adult)
--   maria@example.com  / password123  (Rose's daughter, caregiver)

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    'a1000000-0000-4000-8000-000000000001',
    'authenticated', 'authenticated',
    'rose@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Rose Alvarez"}',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a1000000-0000-4000-8000-000000000002',
    'authenticated', 'authenticated',
    'maria@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Maria Alvarez"}',
    now(), now()
  );

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
values
  (
    gen_random_uuid(), 'a1000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000001',
    '{"sub":"a1000000-0000-4000-8000-000000000001","email":"rose@example.com"}',
    'email', now(), now(), now()
  ),
  (
    gen_random_uuid(), 'a1000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000002',
    '{"sub":"a1000000-0000-4000-8000-000000000002","email":"maria@example.com"}',
    'email', now(), now(), now()
  );

-- Profiles are created by the on_auth_user_created trigger; add phone numbers.
update public.profiles set phone = '(555) 010-2345' where id = 'a1000000-0000-4000-8000-000000000001';
update public.profiles set phone = '(555) 010-6789' where id = 'a1000000-0000-4000-8000-000000000002';

-- ---------------------------------------------------------------------------
-- Care relationship: Maria cares for Rose
-- ---------------------------------------------------------------------------

insert into public.care_relationships (patient_id, caregiver_id, invited_email, relationship, status)
values (
  'a1000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000002',
  'maria@example.com',
  'Daughter',
  'active'
);

-- ---------------------------------------------------------------------------
-- Reminders for Rose
-- ---------------------------------------------------------------------------

insert into public.reminders (user_id, created_by, title, description, category, time_of_day, recurrence, days_of_week)
values
  ('a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001',
   'Take blood pressure medication', 'One tablet of Lisinopril with a glass of water.', 'medication', '08:00', 'daily', '{}'),
  ('a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001',
   'Eat breakfast', 'Something warm — oatmeal is in the pantry.', 'meals', '08:30', 'daily', '{}'),
  ('a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002',
   'Call Maria', 'She gets home from work around 6.', 'family_calls', '18:00', 'weekly', '{0,3}'),
  ('a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001',
   'Evening walk around the block', 'Take the cane and wear the good shoes.', 'exercise', '17:00', 'weekly', '{1,3,5}'),
  ('a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001',
   'Take evening medication', 'Metformin — after dinner, not before.', 'medication', '19:30', 'daily', '{}'),
  ('a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002',
   'Dr. Chen check-up', 'Annual physical. Maria will drive.', 'appointments', '10:30', 'once', '{}');

-- ---------------------------------------------------------------------------
-- Daily routine for Rose
-- ---------------------------------------------------------------------------

insert into public.routine_items (user_id, title, period, time_of_day, sort_order)
values
  ('a1000000-0000-4000-8000-000000000001', 'Open the curtains and water the ferns', 'morning', '07:30', 0),
  ('a1000000-0000-4000-8000-000000000001', 'Morning medication with breakfast', 'morning', '08:00', 1),
  ('a1000000-0000-4000-8000-000000000001', 'Do the crossword', 'morning', '09:30', 2),
  ('a1000000-0000-4000-8000-000000000001', 'Lunch and the midday news', 'afternoon', '12:30', 0),
  ('a1000000-0000-4000-8000-000000000001', 'Rest or read in the sunroom', 'afternoon', '14:00', 1),
  ('a1000000-0000-4000-8000-000000000001', 'Walk around the block', 'afternoon', '16:30', 2),
  ('a1000000-0000-4000-8000-000000000001', 'Dinner', 'evening', '18:30', 0),
  ('a1000000-0000-4000-8000-000000000001', 'Evening medication', 'evening', '19:30', 1),
  ('a1000000-0000-4000-8000-000000000001', 'Lock the doors and lights out', 'evening', '21:30', 2);

-- ---------------------------------------------------------------------------
-- Memory vault for Rose
-- ---------------------------------------------------------------------------

insert into public.vault_items (user_id, category, title, subtitle, phone, email, notes, date_value, is_pinned)
values
  ('a1000000-0000-4000-8000-000000000001', 'family', 'Maria Alvarez', 'Daughter', '(555) 010-6789', 'maria@example.com',
   'Lives 20 minutes away. Visits every Sunday.', null, true),
  ('a1000000-0000-4000-8000-000000000001', 'family', 'Daniel Alvarez', 'Grandson', '(555) 010-8811', null,
   'Maria''s son. Studying engineering at State.', null, false),
  ('a1000000-0000-4000-8000-000000000001', 'doctor', 'Dr. Grace Chen', 'Primary care physician', '(555) 010-4400', null,
   'Office on Maple Street, second floor. Appointments through the front desk.', null, true),
  ('a1000000-0000-4000-8000-000000000001', 'doctor', 'Dr. Omar Haddad', 'Cardiologist', '(555) 010-4622', null,
   'Check-up every six months.', null, false),
  ('a1000000-0000-4000-8000-000000000001', 'medication', 'Lisinopril', '10 mg — every morning', null, null,
   'For blood pressure. Take with water, with or without food.', null, false),
  ('a1000000-0000-4000-8000-000000000001', 'medication', 'Metformin', '500 mg — with dinner', null, null,
   'For blood sugar. Take after eating, not before.', null, false),
  ('a1000000-0000-4000-8000-000000000001', 'emergency', 'Maria Alvarez', 'Daughter — first call', '(555) 010-6789', null,
   null, null, true),
  ('a1000000-0000-4000-8000-000000000001', 'emergency', 'Neighbor — Pat Reyes', 'Next door, has a spare key', '(555) 010-3377', null,
   null, null, false),
  ('a1000000-0000-4000-8000-000000000001', 'important_date', 'Wedding anniversary', 'With Eduardo', null, null,
   'Married in 1968 at St. Agnes.', '1968-06-14', false),
  ('a1000000-0000-4000-8000-000000000001', 'important_date', 'Maria''s birthday', null, null, null,
   null, '1975-03-22', false),
  ('a1000000-0000-4000-8000-000000000001', 'contact', 'Corner Pharmacy', 'Prescription refills', '(555) 010-9900', null,
   'Ask for Sam. Refills are usually ready in an hour.', null, false),
  ('a1000000-0000-4000-8000-000000000001', 'note', 'Where things are kept', null, null, null,
   'Spare glasses: top drawer of the hallway table. House keys: hook by the back door. Insurance folder: filing cabinet, blue tab.', null, true);

-- ---------------------------------------------------------------------------
-- Two weeks of wellness history for Rose
-- ---------------------------------------------------------------------------

insert into public.wellness_entries (user_id, entry_date, mood, sleep_hours, energy, notes)
select
  'a1000000-0000-4000-8000-000000000001',
  current_date - offs,
  3 + ((offs * 7) % 3) - 1,        -- mood varies 2..4
  6.0 + ((offs * 3) % 5) * 0.5,    -- sleep varies 6.0..8.0
  2 + ((offs * 5) % 3),            -- energy varies 2..4
  case when offs % 4 = 0 then 'Felt good after the walk today.' else null end
from generate_series(1, 14) as offs;
