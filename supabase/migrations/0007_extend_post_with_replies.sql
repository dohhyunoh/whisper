-- Keep a post alive at least as long as its replies.
--
-- Problem: posts.expires_at is fixed at created_at + 24h, but a reply written
-- late in the post's life expires later — and replies CASCADE-delete when the
-- post is cleaned up. So a fresh reply could be deleted with the post before the
-- recipient has time to read it.
--
-- Fix: on each reply insert, push the post's expires_at out to at least the
-- reply's expires_at. The post then dies together with its last reply (each
-- reply still gets its full ~24h). The 'infinity' seed post is unaffected
-- (greatest(infinity, …) = infinity).

create or replace function public.extend_post_on_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts
  set expires_at = greatest(expires_at, new.expires_at)
  where id = new.post_id;
  return new;
end;
$$;

drop trigger if exists extend_post_on_reply on public.replies;
create trigger extend_post_on_reply
  after insert on public.replies
  for each row
  execute function public.extend_post_on_reply();
