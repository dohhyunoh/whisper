-- Letter Exchange — v1 backend
-- Run in the Supabase SQL editor (or via `supabase db push`).
-- See docs/letter-exchange-v1-implementation.md §2.
--
-- MANUAL STEPS (not SQL — do these in the Supabase dashboard):
--   1. Authentication → Providers → Anonymous: ENABLE. (Gives each device a
--      stable auth.uid() with no login — the durable, anonymous identity.)
--   2. Database → Extensions: enable `pg_cron` (or the create extension below).
--
-- Idempotent where practical so it's safe to re-run during setup.

-- ────────────────────────────────────────────────────────────────────────
-- 1. Tables
-- ────────────────────────────────────────────────────────────────────────

create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null,                            -- = auth.uid()
  mood        text not null check (mood in ('clear','cloudy','stormy','windy')),
  text        text not null check (char_length(text) between 1 and 1000),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '24 hours'
);

create table if not exists public.replies (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  author_id   uuid not null,                            -- = auth.uid()
  text        text not null check (char_length(text) between 1 and 1000),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '24 hours'
);

create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null,                            -- = auth.uid()
  target_kind text not null check (target_kind in ('post','reply')),
  target_id   uuid not null,
  created_at  timestamptz not null default now()
);

create index if not exists posts_expires_at_idx   on public.posts (expires_at);
create index if not exists replies_post_id_idx     on public.replies (post_id);
create index if not exists replies_author_id_idx   on public.replies (author_id);
create index if not exists replies_expires_at_idx  on public.replies (expires_at);

-- ────────────────────────────────────────────────────────────────────────
-- 2. Row Level Security
--    Anonymity model: clients never read author_id directly. Reads go through
--    the security-definer RPCs below (which select only safe columns).
--    Direct table RLS here is the backstop + governs INSERTs.
-- ────────────────────────────────────────────────────────────────────────

alter table public.posts   enable row level security;
alter table public.replies enable row level security;
alter table public.reports enable row level security;

-- INSERTs: a client may only write rows authored by itself.
drop policy if exists posts_insert_own on public.posts;
create policy posts_insert_own on public.posts
  for insert to authenticated
  with check (author_id = auth.uid());

drop policy if exists replies_insert_own on public.replies;
create policy replies_insert_own on public.replies
  for insert to authenticated
  with check (author_id = auth.uid());

drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own on public.reports
  for insert to authenticated
  with check (reporter_id = auth.uid());

-- No SELECT/UPDATE/DELETE policies → direct table reads return nothing.
-- All reads happen via the RPCs below.

-- ────────────────────────────────────────────────────────────────────────
-- 3. Read RPCs (security definer — bypass RLS, expose only safe columns)
-- ────────────────────────────────────────────────────────────────────────

-- Hand the caller one random post that isn't theirs and hasn't expired.
-- Returns only id/mood/text — never author_id.
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
  order by random()
  limit 1;
$$;

-- All replies to the caller's own posts. Returns reply text only — never the
-- replier's author_id (the comfort stays anonymous).
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
  order by r.created_at desc;
$$;

grant execute on function public.get_stranger_post() to authenticated;
grant execute on function public.get_my_replies()    to authenticated;

-- ────────────────────────────────────────────────────────────────────────
-- 4. Ephemerality — hourly hard-delete of expired rows
--    (Reads already filter on expires_at; this reclaims storage.)
--    The permanent seed post (§5) has a far-future expiry, so it survives.
-- ────────────────────────────────────────────────────────────────────────

create extension if not exists pg_cron;

select cron.schedule(
  'letter-exchange-cleanup',
  '0 * * * *',                                          -- top of every hour
  $$
    delete from public.replies where expires_at <= now();
    delete from public.posts   where expires_at <= now();
  $$
);

-- ────────────────────────────────────────────────────────────────────────
-- 5. Seed post — keeps the pool non-empty from day one (decision §9.2).
--    Far-future expires_at = permanent starter note, never cleaned up.
--    author_id is a sentinel UUID belonging to no device, so every real
--    user sees it as a "stranger" and nobody is excluded by the not-own rule.
--
--    To receive its replies in-app for dogfooding: sign in on your own device
--    once, grab your auth.uid() (select auth.uid() while authenticated, or read
--    it from the app logs), then UPDATE posts SET author_id = '<your-uid>'
--    WHERE id = the seed. Until then, monitor replies via this dashboard.
-- ────────────────────────────────────────────────────────────────────────

insert into public.posts (id, author_id, mood, text, expires_at)
values (
  '00000000-0000-0000-0000-0000000000aa',               -- fixed seed id (re-run safe)
  '00000000-0000-0000-0000-000000000001',               -- sentinel seed author
  'cloudy',
  'Some days the weight is hard to name. If you''re reading this, you''re not carrying it alone tonight.',
  'infinity'::timestamptz
)
on conflict (id) do nothing;
