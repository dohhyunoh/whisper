// register-push-token — save (or clear) this device's Expo push token. Verifies
// the caller's JWT, then writes with the service role (bypassing RLS), the same
// pattern as submit-post/submit-reply. Body: { token } to register; { token:
// null } to unregister (message notifications turned off).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ status: 'error' }, 401);

  const { token } = await req.json().catch(() => ({}));

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

  if (typeof token === 'string' && token.length > 0) {
    const { error } = await admin
      .from('push_tokens')
      .upsert({ user_id: userId, token, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) {
      console.error('token upsert failed:', error);
      return json({ status: 'error' }, 500);
    }
  } else {
    // Unregister (message notifications turned off).
    await admin.from('push_tokens').delete().eq('user_id', userId);
  }

  return json({ status: 'ok' });
});
