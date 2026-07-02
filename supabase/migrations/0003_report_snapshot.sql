-- Capture a snapshot of the reported text at report time, so it survives the
-- ~24h expiry of the original post/reply and gives you a durable moderation log
-- to review. Nullable (older reports won't have it).

alter table public.reports add column if not exists snapshot_text text;
