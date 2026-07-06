import { MoodId } from '@/data/moods';
import { getReceivedSeenAt } from '@/utils/exchange-state';
import { getExpoPushToken } from '@/utils/push';
import { loadMessagesNotifEnabled, saveMessagesNotifEnabled } from '@/utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Letter Exchange backend — the app's first server-dependent feature.
// Schema, RLS, and read RPCs live in supabase/migrations/0001_letter_exchange.sql.
// The anon key is designed to be embedded in clients (RLS is the real guard),
// so we hardcode it the same way utils/posthog.ts hardcodes the PostHog key.
const SUPABASE_URL = 'https://xgdfjgfxlxyfivetcpnt.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZGZqZ2Z4bHh5Zml2ZXRjcG50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NDUzNTAsImV4cCI6MjA5ODQyMTM1MH0.0-aE9xz9ch-Aw9UXW2mp7Bb1FUYA4gUaHC_6ZLJL2w4';

export interface StrangerPost {
  id: string;
  mood: MoodId;
  text: string;
  author_gender: string | null;
  author_tags: string[] | null;
}

export interface ReceivedReply {
  id: string;
  post_id: string;
  text: string;
  created_at: string;
  post_text: string;
  post_mood: MoodId;
  liked: boolean;
}

export interface SentReply {
  id: string;
  text: string;
  created_at: string;
  liked: boolean;
}

export type ReportTargetKind = 'post' | 'reply';

// Outcome of a moderated write. 'crisis' → route the writer to resources;
// 'blocked' → harassment/hate/etc, refuse; 'error' → network/server (fail
// closed: nothing was published). Decided server-side by the Edge Function.
export type SubmitResult = { status: 'ok' | 'blocked' | 'crisis' | 'error' };

let client: SupabaseClient | null = null;

// Lazy singleton — created on first exchange entry, not at app boot, so users
// who never opt in pay no cold-start cost (docs §3).
function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

// Ensure a stable anonymous identity. The Supabase SDK persists the session to
// AsyncStorage, so the same auth.uid() survives relaunches — that uid is the
// durable device identity behind "not-your-own" filtering and reply routing.
// Returns the user id, or null if sign-in fails (offline / provider disabled).
async function ensureUserId(): Promise<string | null> {
  const supabase = getClient();
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user?.id) {
    return sessionData.session.user.id;
  }
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    return null;
  }
  return data.user?.id ?? null;
}

// Call once when the user first enters the exchange, before any read/write.
// Surfaces the offline/misconfigured case so screens can show a graceful state
// without trapping the user away from the deck.
export async function initExchange(): Promise<boolean> {
  const uid = await ensureUserId();
  if (uid) void registerPushToken(); // fire-and-forget; never blocks entry
  return uid != null;
}

// Register this device's push token against its anon id, so replies and likes
// can notify the right person. No-op if message notifications are off or push
// is unavailable.
async function registerPushToken(): Promise<void> {
  try {
    if (!(await loadMessagesNotifEnabled())) return;
    const token = await getExpoPushToken();
    if (!token) return;
    const supabase = getClient();
    const uid = await ensureUserId();
    if (!uid) return;
    // Write via the Edge Function (service role) — direct-table RLS on
    // push_tokens rejects the client insert.
    await supabase.functions.invoke('register-push-token', { body: { token } });
  } catch {
    // best-effort; non-fatal
  }
}

// Remove this device's token so the server can no longer push to it.
async function unregisterPushToken(): Promise<void> {
  try {
    const supabase = getClient();
    const uid = await ensureUserId();
    if (!uid) return;
    await supabase.functions.invoke('register-push-token', { body: { token: null } });
  } catch {
    // best-effort; non-fatal
  }
}

// Settings toggle for message (reply + like) notifications. The push_tokens row
// is the whole switch — its presence is what lets the server notify this device.
export async function setMessagesNotificationsEnabled(enabled: boolean): Promise<void> {
  await saveMessagesNotifEnabled(enabled);
  if (enabled) await registerPushToken();
  else await unregisterPushToken();
}

// One random stranger's post to respond to (never your own, never expired).
// null = pool genuinely empty (shouldn't happen while the seed post exists).
export async function getStrangerPost(): Promise<StrangerPost | null> {
  const supabase = getClient();
  await ensureUserId();
  const { data, error } = await supabase.rpc('get_stranger_post');
  if (error) {
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return row
    ? {
        id: row.id,
        mood: row.mood as MoodId,
        text: row.text,
        author_gender: row.author_gender ?? null,
        author_tags: row.author_tags ?? null,
      }
    : null;
}

// Write back to a stranger (step 2 — the gate). Goes through the moderated
// submit-reply Edge Function; the returned status drives the UI (proceed /
// blocked / crisis). Never inserts directly — the tables reject that.
export async function submitReply(postId: string, text: string): Promise<SubmitResult> {
  const supabase = getClient();
  const uid = await ensureUserId();
  if (!uid) return { status: 'error' };
  const { data, error } = await supabase.functions.invoke('submit-reply', {
    body: { post_id: postId, text },
  });
  if (error) return { status: 'error' };
  return { status: (data?.status as SubmitResult['status']) ?? 'error' };
}

// Post your own answer into the pool (step 3, unlocked by replying). Moderated
// the same way via submit-post. `context` attaches the author's gender + top
// soul-signature tags so responders can write something concrete.
export async function submitPost(
  mood: MoodId,
  text: string,
  context?: { gender?: string | null; tags?: string[] },
): Promise<SubmitResult> {
  const supabase = getClient();
  const uid = await ensureUserId();
  if (!uid) return { status: 'error' };
  const { data, error } = await supabase.functions.invoke('submit-post', {
    body: { mood, text, gender: context?.gender ?? null, tags: context?.tags ?? [] },
  });
  if (error) return { status: 'error' };
  return { status: (data?.status as SubmitResult['status']) ?? 'error' };
}

// Replies to your own posts — the comfort flowing back in.
export async function getMyReplies(): Promise<ReceivedReply[]> {
  const supabase = getClient();
  await ensureUserId();
  const { data, error } = await supabase.rpc('get_my_replies');
  if (error) {
    return [];
  }
  return (data ?? []) as ReceivedReply[];
}

// Count of replies newer than the last time the user opened "Notes for you" —
// drives the unread badge on the deck. Best-effort; returns 0 on any failure.
export async function getUnreadReplyCount(): Promise<number> {
  try {
    const replies = await getMyReplies();
    if (replies.length === 0) return 0;
    const seenAt = await getReceivedSeenAt();
    if (!seenAt) return replies.length; // never opened → all unread
    const seen = new Date(seenAt).getTime();
    return replies.filter((r) => new Date(r.created_at).getTime() > seen).length;
  } catch {
    return 0;
  }
}

// Heart a reply you received — notifies its author ("you made someone's day").
// Idempotent server-side; best-effort.
export async function likeReply(replyId: string): Promise<void> {
  const supabase = getClient();
  const uid = await ensureUserId();
  if (!uid) throw new Error('not signed in');
  const { error } = await supabase.functions.invoke('like-reply', {
    body: { reply_id: replyId },
  });
  if (error) throw new Error(error.message);
}

// Notes you've sent (your own replies, unexpired), with whether each was liked.
export async function getMySentReplies(): Promise<SentReply[]> {
  const supabase = getClient();
  await ensureUserId();
  const { data, error } = await supabase.rpc('get_my_sent_replies');
  if (error) {
    return [];
  }
  return (data ?? []) as SentReply[];
}

// Report a received note. Best-effort — the screen optimistically hides it.
// snapshotText preserves the reported words for review even after the original
// note expires (~24h).
export async function reportTarget(
  kind: ReportTargetKind,
  id: string,
  snapshotText?: string,
): Promise<void> {
  const supabase = getClient();
  const uid = await ensureUserId();
  if (!uid) throw new Error('not signed in');
  const { error } = await supabase
    .from('reports')
    .insert({ reporter_id: uid, target_kind: kind, target_id: id, snapshot_text: snapshotText });
  if (error) throw new Error(error.message);
}

// Block the author of a received reply so they can never reach you again
// (bidirectional in routing). The author's id is resolved server-side — the
// client never sees it, preserving anonymity. Best-effort.
export async function blockReplyAuthor(replyId: string): Promise<void> {
  const supabase = getClient();
  const uid = await ensureUserId();
  if (!uid) throw new Error('not signed in');
  const { error } = await supabase.rpc('block_reply_author', { p_reply_id: replyId });
  if (error) throw new Error(error.message);
}
