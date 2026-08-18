-- =====================================================================
-- Rekalla — saved chats, so the assistant keeps a history the elder can
-- reopen, start fresh from, or delete (like ChatGPT's sidebar).
-- Each row belongs to one person; RLS keeps it to them alone.
-- =====================================================================

create table if not exists public.chat_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  title       text not null default 'New chat',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists chat_conversations_user_idx
  on public.chat_conversations (user_id, updated_at desc);

create trigger chat_conversations_set_updated_at
  before update on public.chat_conversations
  for each row execute function public.set_updated_at();

create table if not exists public.chat_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  role            text not null check (role in ('me', 'rekalla')),
  content         text not null default '',
  image_url       text,
  meta            jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists chat_messages_convo_idx
  on public.chat_messages (conversation_id, created_at);

alter table public.chat_conversations enable row level security;
alter table public.chat_messages      enable row level security;

create policy chat_conversations_own on public.chat_conversations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy chat_messages_own on public.chat_messages
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
