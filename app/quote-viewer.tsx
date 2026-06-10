import { QuoteFeed } from '@/components/quote-feed';
import { useAppContext } from '@/context/app-context';
import { Quote } from '@/data/types';
import { useLikes } from '@/hooks/use-likes';
import { useQuotesByIds } from '@/hooks/use-quotes';
import { useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function QuoteViewerScreen() {
  const { favorites, ownQuotes: ownQuotesParam, ownQuoteId, favoriteId, hideTitle } = useLocalSearchParams<{
    favorites?: string;
    ownQuotes?: string;
    ownQuoteId?: string;
    favoriteId?: string;
    hideTitle?: string;
  }>();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { state } = useAppContext();
  const { likedIds } = useLikes();

  const isFavorites = favorites === 'true';
  const isOwnQuotes = ownQuotesParam === 'true';

  const favoriteQuotes = useQuotesByIds(favoriteId ? [favoriteId] : likedIds);

  const ownQuotesAsQuotes: Quote[] = useMemo(() => {
    const source = ownQuoteId
      ? state.ownQuotes.filter((oq) => oq.id === ownQuoteId)
      : state.ownQuotes;
    return source.map((oq) => ({
      id: oq.id,
      text: oq.text,
      author: oq.author || 'You',
      source: oq.source,
    }));
  }, [state.ownQuotes, ownQuoteId]);

  const quotes = isOwnQuotes ? ownQuotesAsQuotes : favoriteQuotes;
  const title = isOwnQuotes ? 'My Quotes' : 'Favorites';

  return (
    <View style={styles.container}>
      {quotes.length > 0 ? (
        <QuoteFeed quotes={quotes} cardHeight={screenHeight} infinite={false} />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No quotes found</Text>
        </View>
      )}
      {hideTitle !== 'true' && (
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
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
    color: '#FFFFFF',
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
