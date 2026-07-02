-- Reset Letter Exchange test data.
-- Clears all dogfood posts/replies/reports so you can test cleanly, while
-- KEEPING the permanent seed post (so the pool is never empty).
-- Run in the Supabase SQL editor. Safe to re-run.
-- The seed's fixed id is from 0001_letter_exchange.sql §5.

delete from public.reports;
delete from public.replies;                               -- includes replies to the seed
delete from public.posts
  where id <> '00000000-0000-0000-0000-0000000000aa';     -- everything except the seed

-- Verify: expect posts = 1 (the seed), replies = 0, reports = 0.
select
  (select count(*) from public.posts)   as posts,
  (select count(*) from public.replies) as replies,
  (select count(*) from public.reports) as reports;
