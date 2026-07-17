// Ephemeral handoff: sneak-peek picks a quote, notification-preview and the
// paywall reuse it. Lives outside UserData since it's transient UI state, not
// user profile data.

import { Quote } from '@/data/types';
import { filterQuotesByFaith, interestTagOverlap, moodMatchesQuote, tagsForInterests } from '@/utils/interest-tags';

let firstQuote: string | null = null;

export function setFirstQuote(quote: string) {
  firstQuote = quote;
}

export function getFirstQuote(): string | null {
  return firstQuote;
}

// The user's very first quote: score every short quote against everything
// onboarding told us (interest tags, current emotion, tone preference) and
// pick from the handful of best hits. Shared by sneak-peek and the paywall's
// relaunch fallback (module state doesn't survive an app restart).
export function pickFirstQuote(
  allQuotes: Quote[],
  opts: { interests?: string[]; mood?: string; tone?: string },
): Quote | null {
  const short = filterQuotesByFaith(allQuotes, opts.interests).filter(
    (q) => q.text.length <= 120,
  );
  if (short.length === 0) return null;

  const interestTags = tagsForInterests(opts.interests);
  const tone = opts.tone?.toLowerCase();

  const scored = short
    .map((q) => {
      let score = interestTagOverlap(q, interestTags) * 2;
      if (opts.mood && moodMatchesQuote(opts.mood, q)) score += 3;
      if (tone && q.tone === tone) score += 1;
      return { q, score };
    })
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 5);
  return top[Math.floor(Math.random() * top.length)].q;
}
