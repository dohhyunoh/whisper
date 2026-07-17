// submit-reply — the ONLY write path for a reply. Same shape as submit-post:
// identify caller from JWT, moderate, insert (service role) only if clean.
// Returns { status: 'ok' | 'blocked' | 'crisis' | 'error' }.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { moderate } from '../_shared/moderation.ts';
import { getPushToken, sendPush } from '../_shared/push.ts';

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
  const { post_id, text } = payload ?? {};
  // Length floor mirrors constants/exchange.ts (MIN_REPLY_CHARS).
  if (typeof text !== 'string' || text.trim().length < 50 || typeof post_id !== 'string') {
    return json({ status: 'error' }, 400);
  }

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

  // Daily ceiling — mirrors constants/exchange.ts (MAX_REPLIES_PER_DAY). Keeps
  // one person from flooding the pool while the client shows "N of 5 today".
  const { count: recentReplies } = await admin
    .from('replies')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', userId)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  if ((recentReplies ?? 0) >= 5) return json({ status: 'error' }, 429);

  let mod;
  try {
    mod = await moderate(text);
  } catch (e) {
    console.error('moderation failed:', e);
    return json({ status: 'error' }, 502);
  }
  if (mod.verdict !== 'ok') return json({ status: mod.verdict });

  try {
    const { error } = await admin.from('replies').insert({
      post_id,
      author_id: userId,
      text: text.trim(),
    });
    if (error) {
      console.error('insert failed:', error);
      return json({ status: 'error' }, 500);
    }
  } catch (e) {
    console.error('insert exception:', e);
    return json({ status: 'error' }, 500);
  }

  // Notify the post's author that a reply arrived (best-effort).
  try {
    const { data: post } = await admin
      .from('posts')
      .select('author_id')
      .eq('id', post_id)
      .maybeSingle();
    if (post?.author_id) {
      const token = await getPushToken(admin, post.author_id);
      await sendPush(token, 'Whisper', 'One soul responded to your note', { screen: 'received' });
    }
  } catch (e) {
    console.error('notify failed:', e);
  }

  return json({ status: 'ok' });
});
