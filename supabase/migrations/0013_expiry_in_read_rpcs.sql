-- Surface expiry in the read RPCs so the client can show "fades in Xh" on
-- notes instead of letting them vanish unexplained. A reply's effective
-- lifetime is the earlier of its own expiry and its post's, since replies die
-- with their post (0011). get_my_replies also returns the post's own expiry so
-- the "Notes for you" context card can show how long the conversation lives.
-- Return shapes change → drop and recreate; bodies otherwise match 0010/0005.

drop function if exists public.get_my_replies();

create function public.get_my_replies()
returns table (
  id uuid,
  post_id uuid,
  text text,
  created_at timestamptz,
  post_text text,
  post_mood text,
  liked boolean,
  expires_at timestamptz,
  post_expires_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select r.id, r.post_id, r.text, r.created_at,
         p.text as post_text, p.mood as post_mood,
         (l.reply_id is not null) as liked,
         least(r.expires_at, p.expires_at) as expires_at,
         p.expires_at as post_expires_at
  from public.replies r
  join public.posts p on p.id = r.post_id
  left join public.reply_likes l on l.reply_id = r.id
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

grant execute on function public.get_my_replies() to authenticated;

drop function if exists public.get_my_sent_replies();

create function public.get_my_sent_replies()
returns table (
  id uuid,
  text text,
  created_at timestamptz,
  liked boolean,
  expires_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select r.id, r.text, r.created_at, (l.reply_id is not null) as liked,
         least(r.expires_at, p.expires_at) as expires_at
  from public.replies r
  join public.posts p on p.id = r.post_id
  left join public.reply_likes l on l.reply_id = r.id
  where r.author_id = auth.uid()
    and r.expires_at > now()
  order by r.created_at desc;
$$;

grant execute on function public.get_my_sent_replies() to authenticated;
