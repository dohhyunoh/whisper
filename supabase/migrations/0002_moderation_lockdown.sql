-- Moderation lockdown.
-- Remove the direct INSERT policies on posts/replies so the ONLY way to write
-- is through the submit-post / submit-reply Edge Functions (which moderate via
-- OpenAI, then insert with the service role, bypassing RLS). This makes the
-- moderation check un-bypassable — a modified client can no longer insert.
--
-- ORDER OF OPERATIONS (important): deploy the Edge Functions and ship the
-- updated client FIRST, then run this. Running this before the functions exist
-- leaves no write path and posting/replying will fail.
--
-- Reports keep their direct-insert policy — they're not user-authored content
-- that needs moderation.

drop policy if exists posts_insert_own   on public.posts;
drop policy if exists replies_insert_own on public.replies;

-- With RLS enabled and no INSERT policy, the `authenticated` role can no longer
-- insert into posts/replies at all. The service role (Edge Functions) bypasses
-- RLS, so the moderated path still works. Read RPCs are unaffected.
