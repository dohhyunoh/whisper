import { useMemo } from 'react';
import { Category, Quote, SubCategory } from '@/data/types';
import { useAppContext } from '@/context/app-context';
import quotesData from '@/data/quotes';
import { shuffle } from '@/utils/shuffle';
import { FREE_CATEGORIES, getTodayUnlockedCategory } from '@/constants/categories';
import { hasPremiumAccess } from '@/utils/premium-check';

const allQuotes: Quote[] = quotesData as Quote[];

function filterByInterests(quotes: Quote[], interests: string[] | undefined): Quote[] {
  if (!interests || interests.length === 0) {
    return quotes;
  }
  return quotes.filter((q) => {
    for (const interest of interests) {
      if (interest.includes(':')) {
        const [category, sub] = interest.split(':');
        if (q.category === category && q.subcategory === sub) {
          return true;
        }
      } else {
        if (q.category === interest) {
          return true;
        }
      }
    }
    return false;
  });
}

export function useQuotes(category?: Category, subcategory?: SubCategory, applyInterests = false): Quote[] {
  const { state } = useAppContext();
  const interests = state.user?.interests;
  const isPremium = hasPremiumAccess(state.premium.status);
  const ownQuotes = state.ownQuotes;

  return useMemo(() => {
    let filtered = category
      ? allQuotes.filter((q) => q.category === category)
      : allQuotes;

    // Filter for free users (only when browsing all quotes / home feed)
    if (!category && !isPremium) {
      const todayUnlocked = getTodayUnlockedCategory();
      filtered = filtered.filter(
        (q) => FREE_CATEGORIES.includes(q.category) || q.category === todayUnlocked
      );
    }

    if (subcategory) {
      filtered = filtered.filter((q) => q.subcategory === subcategory);
    }
    if (applyInterests) {
      filtered = filterByInterests(filtered, interests);

      // Merge own quotes into the feed when selected
      if (interests?.includes('ownQuotes') && ownQuotes.length > 0) {
        const ownAsQuotes: Quote[] = ownQuotes.map((oq) => ({
          id: oq.id,
          text: oq.text,
          author: oq.author || 'You',
          source: oq.source,
          category: 'empowerment' as Category,
        }));
        filtered = [...filtered, ...ownAsQuotes];
      }
    }
    return shuffle(filtered);
  }, [category, subcategory, interests, applyInterests, isPremium, ownQuotes]);
}

export function useQuotesByIds(ids: string[]): Quote[] {
  return useMemo(() => {
    return allQuotes.filter((q) => ids.includes(q.id));
  }, [ids]);
}
