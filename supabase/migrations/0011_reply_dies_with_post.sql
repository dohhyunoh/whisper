-- Simplify the letter-exchange lifecycle: a post lasts 24h and its replies die
-- with it. Two changes:
--
-- 1. Drop the extend-on-reply trigger (0007) that pushed a post's expiry out to
--    match its latest reply — that kept active posts alive indefinitely. We now
--    intentionally accept that a reply the poster never opened before the post
--    expired is gone with the post. That ephemerality is the point: it creates
--    urgency to open the app (better retention) and keeps nothing lingering on
--    the server. (A future "someone replied — expiring soon" nudge can soften
--    the miss for the poster.)
--
-- 2. Don't hand out a post that's within 1h of expiry. This protects the
--    *replier*: without it, someone could be served a post with seconds left,
--    write a heartfelt reply, and have it die immediately (or fail the insert
--    outright once the post is cleaned up). A 1h floor guarantees ample time to
--    write. Independent of the poster-side ephemerality above.
--
-- Unchanged: posts expire at created_at + 24h (0001), replies cascade-delete
-- with their post, the cleanup cron reclaims expired rows, and seed posts
-- (expires_at = 'infinity' > now() + 1h) stay permanent and always servable.

drop trigger if exists extend_post_on_reply on public.replies;
drop function if exists public.extend_post_on_reply();

create or replace function public.get_stranger_post()
returns table (
  id uuid,
  mood text,
  text text,
  author_gender text,
  author_tags text[]
)
language sql
security definer
set search_path = public
as $$
  select p.id, p.mood, p.text, p.author_gender, p.author_tags
  from public.posts p
  where p.author_id <> auth.uid()
    and p.expires_at > now() + interval '1 hour'
    and p.author_id not in (select user_id from public.banned_users)
    and p.author_id not in (
      select blocked_id from public.blocks where blocker_id = auth.uid()
      union
      select blocker_id from public.blocks where blocked_id = auth.uid()
    )
  order by random()
  limit 1;
$$;

grant execute on function public.get_stranger_post() to authenticated;
