import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppContext } from '@/context/app-context';
import { usePremium } from '@/hooks/use-premium';

export default function OwnQuotesScreen() {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useAppContext();
  const { isPremium } = usePremium();
  const ownQuotes = state.ownQuotes;
  const interests = state.user?.interests ?? [];
  const isFollowed = interests.includes('ownQuotes');

  const handleToggleHomeFeed = () => {
    if (!isPremium) {
      router.push('/onboarding/paywall');
      return;
    }
    const updated = isFollowed
      ? interests.filter((i) => i !== 'ownQuotes')
      : [...interests, 'ownQuotes'];
    dispatch({ type: 'SET_USER', payload: { ...state.user!, interests: updated } });
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Quote',
      'Are you sure you want to delete this quote?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => dispatch({ type: 'REMOVE_OWN_QUOTE', payload: id }) },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => {
          if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }} style={styles.backButton} hitSlop={12}>
          <IconSymbol name="chevron.left" size={24} color="#3A6B80" />
        </Pressable>
        <Text style={styles.headerTitle}>Own Quotes</Text>
        <Pressable onPress={() => {
          if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/add-quote-modal');
        }} hitSlop={12}>
          <IconSymbol name="plus" size={24} color="#3A6B80" />
        </Pressable>
      </View>

      {/* View in Home Feed toggle */}
      <Pressable onPress={() => {
        if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        handleToggleHomeFeed();
      }} style={styles.homeFeedToggle}>
        <Text style={styles.homeFeedLabel}>Show in Home Feed</Text>
        {!isPremium ? (
          <IconSymbol name="lock.fill" size={16} color="#7B9AAA" />
        ) : (
          <IconSymbol
            name={isFollowed ? 'checkmark.circle.fill' : 'circle'}
            size={22}
            color={isFollowed ? '#3A6B80' : '#C5D5DC'}
          />
        )}
      </Pressable>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {ownQuotes.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="pencil.line" size={48} color="#C5D5DC" />
            <Text style={styles.emptyTitle}>No quotes added</Text>
            <Text style={styles.emptySubtitle}>Add your favorite quotes or write your own</Text>
            <Pressable onPress={() => {
              if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/add-quote-modal');
            }} style={styles.addButton}>
              <Text style={styles.addButtonText}>Add Quote</Text>
            </Pressable>
          </View>
        ) : (
          ownQuotes.map((quote) => (
            <Pressable
              key={quote.id}
              style={styles.quoteCard}
              onPress={() => {
                if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: '/category-feed', params: { ownQuotes: 'true', ownQuoteId: quote.id } });
              }}
            >
              <Text style={styles.quoteText}>"{quote.text}"</Text>
              {quote.author && (
                <Text style={styles.quoteAuthor}>— {quote.author}</Text>
              )}
              {quote.source && (
                <Text style={styles.quoteSource}>{quote.source}</Text>
              )}
              <View style={styles.cardFooter}>
                <View style={styles.actionButtons}>
                  <Pressable
                    onPress={() => {
                      if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push({
                        pathname: '/add-quote-modal',
                        params: { editId: quote.id, editText: quote.text, editAuthor: quote.author || '', editSource: quote.source || '' },
                      });
                    }}
                    hitSlop={8}
                  >
                    <IconSymbol name="pencil" size={16} color="#5A8BA8" />
                  </Pressable>
                  <Pressable onPress={() => {
                    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleDelete(quote.id);
                  }} hitSlop={8}>
                    <IconSymbol name="trash" size={16} color="#CF7777" />
                  </Pressable>
                </View>
                <IconSymbol name="chevron.right" size={16} color="#7B9AAA" />
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#3A6B80',
  },
  homeFeedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    padding: 14,
  },
  homeFeedLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#3A6B80',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3A6B80',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7B9AAA',
    textAlign: 'center',
  },
  addButton: {
    marginTop: 12,
    backgroundColor: '#3A6B80',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  quoteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  quoteText: {
    fontSize: 15,
    color: '#3A6B80',
    lineHeight: 22,
  },
  quoteAuthor: {
    fontSize: 13,
    color: '#5A8BA8',
    fontWeight: '500',
  },
  quoteSource: {
    fontSize: 12,
    color: '#7B9AAA',
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
});
