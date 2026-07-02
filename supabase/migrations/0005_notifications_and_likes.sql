-- Push notifications + likes.
--
--   push_tokens — each device's Expo push token, tied to its anon user id, so
--     the Edge Functions can notify the right person. Service-role reads only.
--   reply_likes — the recipient hearts a reply; fires a one-time notification to
--     its author. One like per reply (a reply is received by exactly one person).
--   get_my_sent_replies() — the "Notes you've sent" screen: your own replies
--     (unexpired) with whether each was liked.

create table if not exists public.push_tokens (
  user_id    uuid primary key,
  token      text not null,
  updated_at timestamptz not null default now()
);
alter table public.push_tokens enable row level security;

-- A user may write only their own token row (upsert). No SELECT policy — only
-- the service role (Edge Functions) reads tokens to send.
drop policy if exists push_tokens_insert_own on public.push_tokens;
create policy push_tokens_insert_own on public.push_tokens
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists push_tokens_update_own on public.push_tokens;
create policy push_tokens_update_own on public.push_tokens
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
-- A user may remove their own token (turning message notifications off).
drop policy if exists push_tokens_delete_own on public.push_tokens;
create policy push_tokens_delete_own on public.push_tokens
  for delete to authenticated using (user_id = auth.uid());

create table if not exists public.reply_likes (
  reply_id   uuid primary key references public.replies(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.reply_likes enable row level security;
-- No client policies — written only by the like-reply Edge Function (service
-- role). The `liked` flag is exposed via the RPC below.

create or replace function public.get_my_sent_replies()
returns table (id uuid, text text, created_at timestamptz, liked boolean)
language sql
security definer
set search_path = public
as $$
  select r.id, r.text, r.created_at, (l.reply_id is not null) as liked
  from public.replies r
  left join public.reply_likes l on l.reply_id = r.id
  where r.author_id = auth.uid()
    and r.expires_at > now()
  order by r.created_at desc;
$$;
grant execute on function public.get_my_sent_replies() to authenticated;
