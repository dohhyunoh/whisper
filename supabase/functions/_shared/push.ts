// Send a push via Expo's push service. No credentials needed — Expo routes by
// the recipient's ExpoPushToken. Best-effort: notification failures never break
// the action that triggered them.

// deno-lint-ignore no-explicit-any
export async function getPushToken(admin: any, userId: string): Promise<string | null> {
  const { data } = await admin
    .from('push_tokens')
    .select('token')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.token ?? null;
}

export async function sendPush(
  token: string | null | undefined,
  title: string,
  body: string,
  data: Record<string, unknown> = {},
): Promise<void> {
  if (!token) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: token, title, body, data, sound: 'default' }),
    });
  } catch (e) {
    console.error('push send failed:', e);
  }
}
