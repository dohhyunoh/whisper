-- "Notes for you" needs to show the recipient WHICH of their own notes each
-- reply is answering — otherwise a reply floats with no context. Recreate
-- get_my_replies to also return the parent post's text + mood so the client can
-- group replies under the note they belong to.
-- (Return shape changes, so drop then recreate. Same block/ban exclusions as 0004.)

drop function if exists public.get_my_replies();

create function public.get_my_replies()
returns table (
  id uuid,
  post_id uuid,
  text text,
  created_at timestamptz,
  post_text text,
  post_mood text
)
language sql
security definer
set search_path = public
as $$
  select r.id, r.post_id, r.text, r.created_at, p.text as post_text, p.mood as post_mood
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

grant execute on function public.get_my_replies() to authenticated;
