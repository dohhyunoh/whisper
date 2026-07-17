// Minimum lengths for exchange writes. Low-effort content ("pee", "lol") kills
// the exchange's emotional credibility; these floors keep genuine short
// messages possible while filtering throwaways. The Edge Functions enforce the
// same floors server-side (supabase/functions/submit-post, submit-reply) —
// keep the values in sync when changing.
export const MIN_POST_CHARS = 30;
// 50, not 30: every reply starter must leave real writing to do — the longest
// starter is ~48 chars, so a bare tapped starter can never clear the floor.
export const MIN_REPLY_CHARS = 50;

// Daily reply ceiling, enforced server-side in submit-reply. The client shows
// it ("N of 5 notes today") and tracks a local counter so the UI can present
// the limit honestly without an extra round-trip.
export const MAX_REPLIES_PER_DAY = 5;
