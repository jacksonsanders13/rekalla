-- Track when a person finished the welcome survey, so we only ask once.
alter table public.personalization_profiles
  add column if not exists onboarded_at timestamptz;
