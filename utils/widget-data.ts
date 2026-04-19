import { Platform } from 'react-native';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import { reloadAllTimelines } from 'react-native-widgetkit';
import allQuotes from '@/data/quotes';
import { Quote, OwnQuote } from '@/data/types';

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
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
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
  interests: string[],
  includeFavorites: boolean = true,
  includeOwnQuotes: boolean = true
): Promise<void> {
  if (Platform.OS !== 'ios') return;

  try {
    const MAX_QUOTE_LENGTH = 50;

    // Extract subcategories from interests (format: "category:subcategory")
    const userSubcategories = interests
      .filter((i) => i.includes(':'))
      .map((i) => i.split(':')[1]);

    // Filter quotes matching user's selected subcategories
    const matchingQuotes = allQuotes.filter(
      (q) =>
        q.text.length <= MAX_QUOTE_LENGTH &&
        q.subcategory &&
        userSubcategories.includes(q.subcategory)
    );

    // Include short own quotes in the random pool
    const shortOwnQuotes = ownQuotes.filter((q) => q.text.length <= MAX_QUOTE_LENGTH);
    const baseCategoryPool =
      matchingQuotes.length >= 10
        ? matchingQuotes
        : allQuotes.filter((q) => q.text.length <= MAX_QUOTE_LENGTH);
    // Exclude favorites from the category pool when Include Favorites is off
    const basePool = includeFavorites
      ? baseCategoryPool
      : baseCategoryPool.filter((q) => !likedIds.includes(q.id));
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
