-- Give responders more than an emotion to write to: attach the author's gender
-- and top soul-signature tags to each post, so replies can be concrete and
-- personal instead of bot-like. Both optional (null / empty for new users or
-- "prefer not to say"). Return them from get_stranger_post (shape changes →
-- drop + recreate, keeping the 0004 banned/blocked exclusions).

alter table public.posts add column if not exists author_gender text;
alter table public.posts add column if not exists author_tags   text[];

drop function if exists public.get_stranger_post();

create function public.get_stranger_post()
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

grant execute on function public.get_stranger_post() to authenticated;
