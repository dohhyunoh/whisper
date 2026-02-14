import { QuoteFeed } from '@/components/quote-feed';
import { CATEGORIES } from '@/constants/categories';
import { useAppContext } from '@/context/app-context';
import { Category, Quote, SubCategory } from '@/data/types';
import { useLikes } from '@/hooks/use-likes';
import { usePremium } from '@/hooks/use-premium';
import { useQuotes, useQuotesByIds } from '@/hooks/use-quotes';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function getCategoryLabel(category: Category, subcategory?: string): string {
  const cat = CATEGORIES.find((c) => c.key === category);
  if (cat) {
    if (subcategory && cat.subcategories) {
      const sub = cat.subcategories.find((s) => s.key === subcategory);
      if (sub) {
        return `${cat.label} - ${sub.label}`;
      }
    }
    return cat.label;
  }
  return category;
}

export default function CategoryFeedScreen() {
  const { category, subcategory, favorites, ownQuotes: ownQuotesParam } = useLocalSearchParams<{
    category?: Category;
    subcategory?: string;
    favorites?: string;
    ownQuotes?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { isCategoryLocked, isPremium } = usePremium();
  const { state } = useAppContext();

  const { likedIds } = useLikes();
  const categoryQuotes = useQuotes(category, subcategory as SubCategory);
  const favoriteQuotes = useQuotesByIds(likedIds);

  const isFavorites = favorites === 'true';
  const isOwnQuotes = ownQuotesParam === 'true';

  const ownQuotesAsQuotes: Quote[] = useMemo(() => {
    return state.ownQuotes.map((oq) => ({
      id: oq.id,
      text: oq.text,
      author: oq.author || 'You',
      source: oq.source,
      category: 'empowerment' as Category,
    }));
  }, [state.ownQuotes]);

  const quotes = isOwnQuotes ? ownQuotesAsQuotes : isFavorites ? favoriteQuotes : categoryQuotes;
  const title = isOwnQuotes ? 'Own Quotes' : isFavorites ? 'Favorites' : getCategoryLabel(category!, subcategory);

  useEffect(() => {
    if (isOwnQuotes && !isPremium) {
      router.replace('/onboarding/paywall');
      return;
    }
    if (category && !isFavorites && !isOwnQuotes && isCategoryLocked(category)) {
      router.replace('/onboarding/paywall');
    }
  }, [category, isFavorites, isOwnQuotes, isCategoryLocked, isPremium, router]);

  return (
    <View style={styles.container}>
      {quotes.length > 0 ? (
        <QuoteFeed quotes={quotes} cardHeight={screenHeight} />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No quotes found</Text>
        </View>
      )}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7B9AAA',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#7B9AAA',
  },
});
