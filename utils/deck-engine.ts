import { Quote } from '@/data/types';
import { filterQuotesByFaith, interestTagOverlap, moodMatchesQuote, tagsForInterests } from './interest-tags';
import { getJSON, setJSON } from './mmkv';
import { getSeenIds, getWeights, markSeen, SwipeDir } from './tag-weights';

const KEY_DECK = 'deck.v1';
const KEY_PROGRESS = 'deck.progress.v1';
const DECK_SIZE = 10;
const EXPLORATION_SLOTS = 2;
const MOOD_BONUS = 5;
const DIVERSITY_PENALTY_PER_REPEAT = 3;
const COLD_START_INTEREST_BONUS = 4;
const COLD_START_TONE_BONUS = 2;

export interface StoredDeck {
  date: string;
  quoteIds: string[];
}

export interface SwipedRecord {
  id: string;
  dir: SwipeDir;
}

export interface DeckProgress {
  date: string;
  swipes: SwipedRecord[];
}

export interface BuildDeckInput {
  allQuotes: Quote[];
  todayDate: string;
  mood?: string;
  interests?: string[];
  tonePreference?: string;
  likedIds?: string[];
}

function todayKey(d: Date = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function scoreQuote(
  quote: Quote,
  weights: Record<string, number>,
  hasHistory: boolean,
  interestTags: Set<string>,
  input: BuildDeckInput,
): number {
  let score = 0;
  const tags = quote.tags ?? [];
  for (const tag of tags) {
    score += weights[tag] ?? 0;
  }

  if (input.mood && moodMatchesQuote(input.mood, quote)) {
    score += MOOD_BONUS;
  }

  if (!hasHistory) {
    if (interestTagOverlap(quote, interestTags) > 0) {
      score += COLD_START_INTEREST_BONUS;
    }
    if (input.tonePreference && quote.tone === input.tonePreference.toLowerCase()) {
      score += COLD_START_TONE_BONUS;
    }
  }

  return score;
}

export function buildDailyDeck(input: BuildDeckInput): string[] {
  const seen = new Set(getSeenIds());
  const liked = new Set(input.likedIds ?? []);
  const weights = getWeights();
  const hasHistory = Object.keys(weights).length > 0;
  const interestTags = tagsForInterests(input.interests);

  // Faith gate applies to the whole pool, so personalized picks, cold-start
  // decks, and exploration wildcards all respect it.
  const pool = filterQuotesByFaith(input.allQuotes, input.interests).filter(
    (q) => !seen.has(q.id) && !liked.has(q.id),
  );

  const scored = pool
    .map((q) => ({ q, base: scoreQuote(q, weights, hasHistory, interestTags, input) }))
    .sort((a, b) => b.base - a.base + (Math.random() - 0.5) * 0.01);

  // Greedy selection with a diversity penalty: each pick re-ranks the
  // remaining candidates against tags already in the deck, so one dominant
  // tag can't fill all slots. Only the top candidates can ever win a slot,
  // so the scan is capped for speed.
  const candidates = scored.slice(0, 200);
  const picks: Quote[] = [];
  const tagCounts: Record<string, number> = {};
  // With swipe history, reserve slots for exploration wildcards — quotes the
  // engine knows nothing about. Swipes on those teach it the most and keep
  // the deck from narrowing onto early likes.
  const personalizedTarget = hasHistory ? DECK_SIZE - EXPLORATION_SLOTS : DECK_SIZE;

  while (picks.length < personalizedTarget && candidates.length > 0) {
    let bestIdx = 0;
    let bestAdjusted = -Infinity;
    for (let i = 0; i < candidates.length; i++) {
      let adjusted = candidates[i].base;
      for (const tag of candidates[i].q.tags ?? []) {
        const count = tagCounts[tag] ?? 0;
        if (count >= 2) adjusted -= DIVERSITY_PENALTY_PER_REPEAT * (count - 1);
      }
      if (adjusted > bestAdjusted) {
        bestAdjusted = adjusted;
        bestIdx = i;
      }
    }
    const picked = candidates.splice(bestIdx, 1)[0].q;
    picks.push(picked);
    for (const tag of picked.tags ?? []) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }

  if (hasHistory) {
    // Wildcards: random picks from the quotes whose tags carry the least
    // learned signal (sum of absolute weights), i.e. unexplored territory.
    const pickedIds = new Set(picks.map((q) => q.id));
    const leastKnown = pool
      .filter((q) => !pickedIds.has(q.id))
      .map((q) => ({
        q,
        known: (q.tags ?? []).reduce((s, t) => s + Math.abs(weights[t] ?? 0), 0),
      }))
      .sort((a, b) => a.known - b.known)
      .slice(0, 50)
      .map((s) => s.q);
    for (let i = 0; i < EXPLORATION_SLOTS && leastKnown.length > 0; i++) {
      const idx = Math.floor(Math.random() * leastKnown.length);
      picks.push(leastKnown.splice(idx, 1)[0]);
    }
  }

  if (picks.length < DECK_SIZE) {
    return picks.map((q) => q.id);
  }

  const ids = picks.map((q) => q.id);
  if (hasHistory) {
    // picks = 8 personalized (best first) + 2 wildcards. Open with the
    // strongest cards: sessions are decided at cards 1-3 (28% of sessions end
    // there; past card 3 most users finish all 10), so the decision window
    // gets the ranker's best. Wildcards wait until slots 6 and 9, after the
    // user is invested — skip data showed wildcards at slots 3/8 drew the
    // deck's highest skip rates.
    const [p0, p1, p2, p3, p4, p5, p6, p7, e0, e1] = ids;
    return [p0, p1, p2, p3, p4, e0, p5, p6, e1, p7];
  }
  // Cold start: already strongest-first; the first deck is the moment that
  // confirms the purchase, so no reshuffling.
  return ids;
}

export function getStoredDeck(): StoredDeck | null {
  return getJSON<StoredDeck>(KEY_DECK);
}

export function saveDeck(deck: StoredDeck): void {
  setJSON(KEY_DECK, deck);
  markSeen(deck.quoteIds);
}

export function getOrBuildTodayDeck(input: Omit<BuildDeckInput, 'todayDate'>): StoredDeck {
  const today = todayKey();
  const stored = getStoredDeck();
  if (stored && stored.date === today) return stored;

  const quoteIds = buildDailyDeck({ ...input, todayDate: today });
  const deck: StoredDeck = { date: today, quoteIds };
  saveDeck(deck);
  return deck;
}

// Returns swipe progress for today's deck only; stale (prior-day) progress is ignored.
export function getTodayDeckProgress(): DeckProgress | null {
  const progress = getJSON<DeckProgress>(KEY_PROGRESS);
  if (!progress || progress.date !== todayKey()) return null;
  return progress;
}

// Appends a swipe to today's progress, resetting if the stored progress is from a prior day.
export function recordDeckSwipe(id: string, dir: SwipeDir): void {
  const today = todayKey();
  const existing = getJSON<DeckProgress>(KEY_PROGRESS);
  const swipes = existing && existing.date === today ? existing.swipes : [];
  if (swipes.some((s) => s.id === id)) return;
  setJSON(KEY_PROGRESS, { date: today, swipes: [...swipes, { id, dir }] });
}
