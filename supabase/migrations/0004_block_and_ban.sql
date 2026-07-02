-- Block & ban (App Store Guideline 1.2: "the ability to block abusive users").
--
--   banned_users — developer ban. Checked by the Edge Functions on write AND by
--     the read RPCs, so a ban immediately pulls the user's in-flight content and
--     stops them posting/replying. Service-role only (you ban via SQL review).
--   blocks — user A blocks user B. Enforced bidirectionally in routing so they
--     never reach each other again. Created only via the security-definer RPC
--     below, so the client never learns the blocked author's id (anonymity).

create table if not exists public.banned_users (
  user_id    uuid primary key,
  reason     text,
  created_at timestamptz not null default now()
);
alter table public.banned_users enable row level security;
-- No policies → clients can't read or write it; only the service role (Edge
-- Functions / dashboard) touches it.

create table if not exists public.blocks (
  blocker_id uuid not null,
  blocked_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);
alter table public.blocks enable row level security;
-- No client policies either — blocks are written via block_reply_author().

create index if not exists blocks_blocker_idx on public.blocks (blocker_id);
create index if not exists blocks_blocked_idx on public.blocks (blocked_id);

-- Block the author of a reply you received, without ever exposing their id.
create or replace function public.block_reply_author(p_reply_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author uuid;
begin
  select author_id into v_author from public.replies where id = p_reply_id;
  if v_author is null or v_author = auth.uid() then
    return;  -- reply expired/gone, or self — nothing to do
  end if;
  insert into public.blocks (blocker_id, blocked_id)
  values (auth.uid(), v_author)
  on conflict do nothing;
end;
$$;
grant execute on function public.block_reply_author(uuid) to authenticated;

-- Recreate the read RPCs with banned + (bidirectional) block exclusions.

create or replace function public.get_stranger_post()
returns table (id uuid, mood text, text text)
language sql
security definer
set search_path = public
as $$
  select p.id, p.mood, p.text
  from public.posts p
  where p.author_id <> auth.uid()
    and p.expires_at > now()
    and p.author_id not in (select user_id from public.banned_users)
    and p.author_id not in (
      select blocked_id from public.blocks where blocker_id = auth.uid()
      union
      select blocker_id from public.blocks where blocked_id = auth.uid()
    )
  order by random()
  limit 1;
$$;

create or replace function public.get_my_replies()
returns table (id uuid, post_id uuid, text text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select r.id, r.post_id, r.text, r.created_at
  from public.replies r
  join public.posts p on p.id = r.post_id
  where p.author_id = auth.uid()
    and r.expires_at > now()
    and r.author_id not in (select user_id from public.banned_users)
    and r.author_id not in (
      select blocked_id from public.blocks where blocker_id = auth.uid()
      union
      select blocker_id from public.blocks where blocked_id = auth.uid()
    )
  order by r.created_at desc;
$$;
