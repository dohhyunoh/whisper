// Server-side moderation via OpenAI's (free) Moderation endpoint, tuned for a
// comfort app where a MISSED self-harm note is the worst outcome.
//
// Self-harm → crisis if EITHER OpenAI flags a self-harm category OR the
// self-harm SCORE clears a low threshold (catches softer phrasing that sits
// below OpenAI's own default flag). Bias: a false positive (a helpline shown to
// someone venting) is far cheaper than a false negative.
//
// This is one layer. It keeps most vulnerable posts out of the pool, but it
// cannot catch contextual harm (a benign-looking reply that's cruel in context)
// — that's covered by the human async backstop + the report button.
//
// Runs only in Edge Functions, so OPENAI_API_KEY never reaches the client and
// the check can't be bypassed.

export type Verdict = 'ok' | 'blocked' | 'crisis';

export interface ModResult {
  verdict: Verdict;
  selfHarmScore: number; // surfaced for threshold tuning; safe to hide later
}

const SELF_HARM_CATS = ['self-harm', 'self-harm/intent', 'self-harm/instructions'];

// Route to resources when the self-harm score clears this, even if OpenAI's own
// boolean didn't flag it. Tuned low on purpose (see bias note above).
const SELF_HARM_SCORE_THRESHOLD = 0.1;

// Throws on any API failure so callers can FAIL CLOSED (nothing published).
export async function moderate(text: string): Promise<ModResult> {
  const key = Deno.env.get('OPENAI_API_KEY');
  if (!key) throw new Error('OPENAI_API_KEY not configured');

  const res = await fetch('https://api.openai.com/v1/moderations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'omni-moderation-latest', input: text }),
  });
  if (!res.ok) throw new Error(`moderation api returned ${res.status}`);

  const data = await res.json();
  const result = data.results?.[0] ?? {};
  const categories: Record<string, boolean> = result.categories ?? {};
  const scores: Record<string, number> = result.category_scores ?? {};

  const selfHarmScore = Math.max(...SELF_HARM_CATS.map((c) => scores[c] ?? 0));

  // Crisis takes precedence: flagged category OR score over threshold.
  const crisisByCategory = SELF_HARM_CATS.some((c) => categories[c]);
  if (crisisByCategory || selfHarmScore >= SELF_HARM_SCORE_THRESHOLD) {
    return { verdict: 'crisis', selfHarmScore };
  }

  // Any other flagged harm category (harassment, hate, sexual, violence, …).
  for (const k of Object.keys(categories)) {
    if (categories[k]) return { verdict: 'blocked', selfHarmScore };
  }

  return { verdict: 'ok', selfHarmScore };
}
