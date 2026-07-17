// submit-post — the ONLY write path for a post. Identifies the caller from
// their JWT, moderates the text, and inserts (service role) only if it's clean.
// Direct table inserts are revoked in migration 0002, so moderation can't be
// skipped. Returns { status: 'ok' | 'blocked' | 'crisis' | 'error' }.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { moderate } from '../_shared/moderation.ts';

const MOODS = ['clear', 'cloudy', 'stormy', 'windy'];
// Server-side floor for low-effort content; mirrors constants/exchange.ts.
const MIN_POST_CHARS = 30;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ status: 'error' }, 401);

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ status: 'error' }, 400);
  }
  const { mood, text, gender, tags } = payload ?? {};
  if (typeof text !== 'string' || text.trim().length < MIN_POST_CHARS || !MOODS.includes(mood)) {
    return json({ status: 'error' }, 400);
  }

  // Optional author context for richer replies. Sanitize: short gender string,
  // up to 6 short tag labels.
  const authorGender =
    typeof gender === 'string' && gender.length <= 40 ? gender : null;
  const authorTags = Array.isArray(tags)
    ? tags
        .filter((t: unknown): t is string => typeof t === 'string' && t.length > 0 && t.length <= 40)
        .slice(0, 6)
    : null;

  // Who is calling? Trust the JWT, not a client-supplied id.
  let userId: string | undefined;
  try {
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data } = await userClient.auth.getUser();
    userId = data.user?.id;
  } catch (e) {
    console.error('auth exception:', e);
    return json({ status: 'error' }, 401);
  }
  if (!userId) return json({ status: 'error' }, 401);

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Banned users are refused before we spend a moderation call.
  const { data: banned } = await admin
    .from('banned_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (banned) return json({ status: 'blocked' });

  // Moderate — fail closed (any failure → nothing published).
  let mod;
  try {
    mod = await moderate(text);
  } catch (e) {
    console.error('moderation failed:', e);
    return json({ status: 'error' }, 502);
  }
  if (mod.verdict !== 'ok') return json({ status: mod.verdict });

  // Clean: insert with service role (RLS no longer permits direct inserts).
  try {
    const { error } = await admin.from('posts').insert({
      author_id: userId,
      mood,
      text: text.trim(),
      author_gender: authorGender,
      author_tags: authorTags,
    });
    if (error) {
      console.error('insert failed:', error);
      return json({ status: 'error' }, 500);
    }
  } catch (e) {
    console.error('insert exception:', e);
    return json({ status: 'error' }, 500);
  }

  return json({ status: 'ok' });
});
