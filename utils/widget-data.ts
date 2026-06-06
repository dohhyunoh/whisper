import { Platform } from 'react-native';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import { reloadAllTimelines } from 'react-native-widgetkit';
import allQuotes from '@/data/quotes';
import { Quote, OwnQuote } from '@/data/types';
import { getWeights } from './tag-weights';

const APP_GROUP = 'group.com.dohhyun.whisper';
const WIDGET_DATA_KEY = 'widgetData';

interface WidgetQuote {
  id: string;
  text: string;
  author: string;
  isLiked: boolean;
}

interface WidgetData {
  quotes: WidgetQuote[];
  likedQuotes: WidgetQuote[];
  updatedAt: number;
  // When true, the widget shows the "Whisper evolved" upgrade card instead of quotes.
  locked: boolean;
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Mirror the daily deck's weighting: sum the swipe-learned tag weights for a quote.
function scoreByWeights(q: Quote, weights: Record<string, number>): number {
  let score = 0;
  for (const tag of q.tags ?? []) {
    score += weights[tag] ?? 0;
  }
  return score;
}

function toWidgetQuote(q: Quote | OwnQuote, isLiked: boolean): WidgetQuote {
  return {
    id: q.id,
    text: q.text,
    author: q.author || 'Unknown',
    isLiked,
  };
}

export async function syncWidgetData(
  likedIds: string[],
  ownQuotes: OwnQuote[],
  includeFavorites: boolean = true,
  includeOwnQuotes: boolean = true,
  isPremium: boolean = true
): Promise<void> {
  if (Platform.OS !== 'ios') return;

  try {
    // Whisper is premium-only — non-subscribers get a locked upgrade card
    // instead of quotes. Don't ship any quote content in that case.
    if (!isPremium) {
      await SharedGroupPreferences.setItem(
        WIDGET_DATA_KEY,
        { quotes: [], likedQuotes: [], updatedAt: Date.now(), locked: true } as WidgetData,
        APP_GROUP
      );
      reloadAllTimelines();
      return;
    }

    const MAX_QUOTE_LENGTH = 50;
    const WIDGET_POOL_SIZE = 50;

    // Curate to short quotes that fit the widget, then rank by the same
    // swipe-learned weights the daily deck uses. A touch of jitter keeps the
    // pool rotating between syncs even when weights are unchanged.
    const weights = getWeights();
    const rankedPool = allQuotes
      .filter((q) => q.text.length <= MAX_QUOTE_LENGTH)
      .map((q) => ({ q, score: scoreByWeights(q, weights) + (Math.random() - 0.5) * 0.01 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, WIDGET_POOL_SIZE)
      .map((s) => s.q);

    // Include short own quotes in the random pool
    const shortOwnQuotes = ownQuotes.filter((q) => q.text.length <= MAX_QUOTE_LENGTH);
    // Exclude favorites from the pool when Include Favorites is off
    const basePool = includeFavorites
      ? rankedPool
      : rankedPool.filter((q) => !likedIds.includes(q.id));
    // Add own quotes to the pool only when Include Own Quotes is on
    const poolWithExtras = includeOwnQuotes
      ? [...basePool, ...shortOwnQuotes]
      : basePool;
    const randomQuotes = pickRandom(poolWithExtras, 50).map((q) =>
      toWidgetQuote(q, likedIds.includes(q.id))
    );

    // Liked pool: liked quotes from allQuotes (own quotes already in random pool)
    const likedFromAll = allQuotes.filter(
      (q) => likedIds.includes(q.id) && q.text.length <= MAX_QUOTE_LENGTH
    );
    const likedQuotes = includeFavorites
      ? pickRandom(likedFromAll, 20).map((q) => toWidgetQuote(q, true))
      : [];

    const widgetData: WidgetData = {
      quotes: randomQuotes,
      likedQuotes,
      updatedAt: Date.now(),
      locked: false,
    };

    await SharedGroupPreferences.setItem(
      WIDGET_DATA_KEY,
      widgetData,
      APP_GROUP
    );
    reloadAllTimelines();
  } catch (e) {
    console.warn('Failed to sync widget data:', e);
  }
}
