// like-reply — the recipient hearts a reply they received. Verifies the caller
// actually owns the post that reply answers, records the like once, and notifies
// the reply's author (the giver). Idempotent: a second like is a no-op and never
// re-notifies. Returns { status: 'ok' | 'error' }.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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

  const { reply_id } = await req.json().catch(() => ({}));
  if (typeof reply_id !== 'string') return json({ status: 'error' }, 400);

  let userId: string | undefined;
  try {
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data } = await userClient.auth.getUser();
    userId = data.user?.id;
  } catch (_e) {
    return json({ status: 'error' }, 401);
  }
  if (!userId) return json({ status: 'error' }, 401);

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // The reply, and the post it answers.
  const { data: reply } = await admin
    .from('replies')
    .select('id, author_id, post_id')
    .eq('id', reply_id)
    .maybeSingle();
  if (!reply) return json({ status: 'error' });

  const { data: post } = await admin
    .from('posts')
    .select('author_id')
    .eq('id', reply.post_id)
    .maybeSingle();
  // Only the person who received the reply (the post's author) may like it.
  if (!post || post.author_id !== userId) {
    return json({ status: 'error' }, 403);
  }

  // Idempotent: if already liked, don't re-insert or re-notify.
  const { data: existing } = await admin
    .from('reply_likes')
    .select('reply_id')
    .eq('reply_id', reply_id)
    .maybeSingle();
  if (existing) return json({ status: 'ok' });

  const { error } = await admin.from('reply_likes').insert({ reply_id });
  if (error) {
    console.error('like insert failed:', error);
    return json({ status: 'error' }, 500);
  }

  // Notify the giver that their words landed (best-effort).
  try {
    const token = await getPushToken(admin, reply.author_id);
    await sendPush(
      token,
      'Whisper',
      "You made someone's day — your message was liked.",
      { screen: 'sent' },
    );
  } catch (e) {
    console.error('notify failed:', e);
  }

  return json({ status: 'ok' });
});
