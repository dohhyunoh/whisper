import { Quote } from '@/data/types';
import { getJSON, setJSON } from './mmkv';
import { getSeenIds, getWeights, markSeen } from './tag-weights';

const KEY_DECK = 'deck.v1';
const DECK_SIZE = 10;
const MOOD_BONUS = 5;
const DIVERSITY_PENALTY_PER_REPEAT = 3;
const COLD_START_INTEREST_BONUS = 4;
const COLD_START_TONE_BONUS = 2;

export interface StoredDeck {
  date: string;
  quoteIds: string[];
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

function moodMatchesQuote(mood: string, quote: Quote): boolean {
  if (!quote.tags) return false;
  const moodLower = mood.toLowerCase();
  return quote.tags.some((t) => t.startsWith('emotion:') && t.toLowerCase().includes(moodLower));
}

function interestMatchesQuote(interest: string, quote: Quote): boolean {
  if (interest.includes(':')) {
    const [cat, sub] = interest.split(':');
    return quote.category === cat && quote.subcategory === sub;
  }
  return quote.category === interest;
}

function scoreQuote(
  quote: Quote,
  weights: Record<string, number>,
  hasHistory: boolean,
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
    if (input.interests?.length) {
      for (const interest of input.interests) {
        if (interestMatchesQuote(interest, quote)) {
          score += COLD_START_INTEREST_BONUS;
          break;
        }
      }
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

  const pool = input.allQuotes.filter(
    (q) => !seen.has(q.id) && !liked.has(q.id),
  );

  const scored = pool
    .map((q) => ({ q, base: scoreQuote(q, weights, hasHistory, input) }))
    .sort((a, b) => b.base - a.base + (Math.random() - 0.5) * 0.01);

  const picks: Quote[] = [];
  const tagCounts: Record<string, number> = {};

  for (const { q, base } of scored) {
    if (picks.length >= DECK_SIZE) break;
    let adjusted = base;
    for (const tag of q.tags ?? []) {
      const count = tagCounts[tag] ?? 0;
      if (count >= 2) adjusted -= DIVERSITY_PENALTY_PER_REPEAT * (count - 1);
    }
    picks.push(q);
    for (const tag of q.tags ?? []) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
    void adjusted;
  }

  if (picks.length < DECK_SIZE) {
    return picks.map((q) => q.id);
  }

  const ids = picks.map((q) => q.id);
  // Strongest hit lands at slot 4 (last free card before paywall).
  // picks[0] is highest base score; swap into slot 4.
  if (ids.length >= 5) {
    [ids[0], ids[4]] = [ids[4], ids[0]];
  }
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
