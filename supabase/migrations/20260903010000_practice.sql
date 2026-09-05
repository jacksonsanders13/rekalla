-- =====================================================================
-- Rekalla — practice.
--
-- The backup half of the practice app. The phone is the source of truth:
-- a session runs with no network at all, and these tables exist so that a
-- lost or replaced phone does not take somebody's family with it.
--
-- Ids are the ones the device generated, not new ones, because the data is
-- made before there is an account to own it. Pushing the same document
-- twice therefore changes nothing, which is what makes a retry after a
-- dropped connection safe.
--
-- The primary key is (user_id, id) rather than id alone. Two devices could
-- in principle mint the same local id, and a shared key space would let one
-- person's retry collide with another's row.
--
-- Nothing here is added to the v1 tables. This app is a different product
-- from the one those serve, and mixing them would make both harder to
-- reason about.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Who is practising.
-- ---------------------------------------------------------------------
create table if not exists public.practice_profiles (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  display_name     text        not null default '',
  daily_goal_cards int         not null default 10,

  -- "HH:MM" in the phone's own zone, or null for no reminder. Stored as
  -- text because the reminder is local to the device and never fired from
  -- here; a timestamp would imply a server that sends it.
  reminder_time    text,

  -- 'self' | 'helper'. Wording only. There is no second account either way.
  setup_mode       text        not null default 'self',
  text_scale       numeric     not null default 1,
  sound_on         boolean     not null default false,

  -- 'dark' | 'light'. Dark is the app's home state; light is a real need for
  -- some eyes rather than a preference, so it travels with the account.
  theme            text        not null default 'dark',

  -- The tap felt on a correct answer. Nothing is ever felt on a wrong one.
  haptics_on       boolean     not null default true,
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- One thing somebody wants to be able to recall.
-- ---------------------------------------------------------------------
create table if not exists public.memory_items (
  user_id      uuid        not null references auth.users (id) on delete cascade,
  id           text        not null,

  category     text        not null check (category in ('person', 'routine', 'place', 'fact')),
  prompt       text        not null,
  answer       text        not null,

  -- Object name inside the practice-photos bucket, under the owner's own
  -- folder. Null when they did not add a picture.
  photo_key    text,
  audio_key    text,
  detail       text,
  relationship text,

  -- Where they sit on the family tree: '-3' to '3', or 'beside' for the
  -- people who are not on the family line. Text rather than an integer so
  -- 'beside' does not need a second column to express.
  placement    text,

  created_at   timestamptz not null,
  created_by   text        not null default 'self',
  is_active    boolean     not null default true,
  updated_at   timestamptz not null default now(),

  primary key (user_id, id)
);

-- ---------------------------------------------------------------------
-- When each item next comes round.
-- ---------------------------------------------------------------------
create table if not exists public.scheduled_cards (
  user_id                     uuid        not null references auth.users (id) on delete cascade,
  id                          text        not null,
  memory_item_id              text        not null,

  interval_index              int         not null default 0,
  last_success_interval_index int         not null default 0,
  due_at                      timestamptz not null,
  consecutive_successes       int         not null default 0,
  review_count                int         not null default 0,
  updated_at                  timestamptz not null default now(),

  primary key (user_id, id),
  constraint scheduled_cards_item_fk
    foreign key (user_id, memory_item_id)
    references public.memory_items (user_id, id) on delete cascade
);

create index if not exists scheduled_cards_due_idx
  on public.scheduled_cards (user_id, due_at);

-- ---------------------------------------------------------------------
-- What happened, for scheduling and for later analysis.
--
-- Never read back as a score. There is no accuracy figure anywhere in the
-- app and nothing here is allowed to become one.
-- ---------------------------------------------------------------------
create table if not exists public.review_logs (
  user_id                 uuid        not null references auth.users (id) on delete cascade,
  id                      text        not null,
  scheduled_card_id       text        not null,
  reviewed_at             timestamptz not null,
  was_correct             boolean     not null,
  interval_index_at_review int        not null,

  primary key (user_id, id)
);

create index if not exists review_logs_reviewed_idx
  on public.review_logs (user_id, reviewed_at);

-- ---------------------------------------------------------------------
-- The days somebody practised. A set of dates, which is all the streak
-- needs, and the only shape that cannot be turned into a failure count.
-- ---------------------------------------------------------------------
create table if not exists public.practice_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null,
  primary key (user_id, day)
);

-- ---------------------------------------------------------------------
-- Row level security. Every table, every command, owner only.
-- ---------------------------------------------------------------------
alter table public.practice_profiles enable row level security;
alter table public.memory_items      enable row level security;
alter table public.scheduled_cards   enable row level security;
alter table public.review_logs       enable row level security;
alter table public.practice_days     enable row level security;

drop policy if exists practice_profiles_own on public.practice_profiles;
create policy practice_profiles_own on public.practice_profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists memory_items_own on public.memory_items;
create policy memory_items_own on public.memory_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists scheduled_cards_own on public.scheduled_cards;
create policy scheduled_cards_own on public.scheduled_cards
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists review_logs_own on public.review_logs;
create policy review_logs_own on public.review_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists practice_days_own on public.practice_days;
create policy practice_days_own on public.practice_days
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Photographs.
--
-- Private bucket, one folder per owner, and the folder name has to be the
-- owner's id. Read back through a short-lived signed url, never a public
-- one: these are pictures of somebody's grandchildren.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('practice-photos', 'practice-photos', false)
on conflict (id) do nothing;

drop policy if exists "practice photos: read own" on storage.objects;
create policy "practice photos: read own" on storage.objects
  for select using (
    bucket_id = 'practice-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "practice photos: write own" on storage.objects;
create policy "practice photos: write own" on storage.objects
  for insert with check (
    bucket_id = 'practice-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "practice photos: replace own" on storage.objects;
create policy "practice photos: replace own" on storage.objects
  for update using (
    bucket_id = 'practice-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "practice photos: delete own" on storage.objects;
create policy "practice photos: delete own" on storage.objects
  for delete using (
    bucket_id = 'practice-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------
-- Deleting an account.
--
-- Every table above cascades from auth.users, so removing the user removes
-- the rows. Storage objects do not cascade, and the app deletes those
-- itself before calling this. Runs as the definer so that somebody can
-- close their own account without an admin key ever reaching the phone.
-- ---------------------------------------------------------------------
create or replace function public.delete_practice_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_practice_account() from public;
grant execute on function public.delete_practice_account() to authenticated;
