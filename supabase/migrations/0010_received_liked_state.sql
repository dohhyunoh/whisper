-- The Received screen ("Notes for you") showed a heart that reset to empty on
-- every reload: the like was persisted in reply_likes all along, but
-- get_my_replies() never returned it, so the client had nothing to rehydrate
-- from and NoteCard defaulted to un-liked on each mount.
--
-- Fix (read-path only, no new storage): recreate get_my_replies() to left join
-- reply_likes and return a `liked` flag, mirroring get_my_sent_replies (0005).
-- (Return shape changes → drop then recreate. Same block/ban exclusions as 0006.)

drop function if exists public.get_my_replies();

create function public.get_my_replies()
returns table (
  id uuid,
  post_id uuid,
  text text,
  created_at timestamptz,
  post_text text,
  post_mood text,
  liked boolean
)
language sql
security definer
set search_path = public
as $$
  select r.id, r.post_id, r.text, r.created_at,
         p.text as post_text, p.mood as post_mood,
         (l.reply_id is not null) as liked
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
