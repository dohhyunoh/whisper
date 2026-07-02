-- Tighten the note length from 1000 → 500 chars ("a few kind words", not an
-- essay). The client also caps input at 500; this is the server-side backstop.
-- If this errors on an existing row > 500 chars, clear old test data first
-- (supabase/reset_test_data.sql) — real notes expire in ~24h anyway.

alter table public.posts   drop constraint if exists posts_text_check;
alter table public.posts   add  constraint posts_text_check   check (char_length(text) between 1 and 500);

alter table public.replies drop constraint if exists replies_text_check;
alter table public.replies add  constraint replies_text_check check (char_length(text) between 1 and 500);
