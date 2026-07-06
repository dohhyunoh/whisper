-- Fair reply distribution. `order by random()` let replies pile onto one post
-- while others sat unanswered (observed: 3 replies on one post, 2 posts with
-- none). Serve the least-replied post first — every post gets its first reply
-- before any post gets a second, then seconds before thirds, and so on.
-- Random only breaks ties, so distribution stays even as volume grows.
--
-- Also stop handing out a post the caller already replied to: their next
-- gate should comfort someone new, not stack onto the same person.

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
    and not exists (
      select 1 from public.replies r
      where r.post_id = p.id and r.author_id = auth.uid()
    )
  order by
    (select count(*) from public.replies r where r.post_id = p.id) asc,
    random()
  limit 1;
$$;

grant execute on function public.get_stranger_post() to authenticated;
