import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CategoryCollapsible } from '@/components/category-collapsible';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CATEGORIES } from '@/constants/categories';
import { usePremium } from '@/hooks/use-premium';
import { useAppContext } from '@/context/app-context';

export function CollapsibleCategoryList() {
  const { isPremium } = usePremium();
  const { state, dispatch } = useAppContext();

  const interests = state.user?.interests ?? [];
  const isOwnQuotesFollowed = interests.includes('ownQuotes');

  const handleOwnQuotesPress = () => {
    if (!isPremium) {
      router.push('/premium-modal');
      return;
    }
    router.push({ pathname: '/category-feed', params: { ownQuotes: 'true' } });
  };

  const handleOwnQuotesToggle = () => {
    if (!isPremium) {
      router.push('/premium-modal');
      return;
    }
    const updated = isOwnQuotesFollowed
      ? interests.filter((i) => i !== 'ownQuotes')
      : [...interests, 'ownQuotes'];
    dispatch({ type: 'SET_USER', payload: { ...state.user!, interests: updated } });
  };

  return (
    <View style={styles.container}>
      {CATEGORIES.map((category) => (
        <CategoryCollapsible key={category.key} category={category} />
      ))}
      <View style={styles.ownQuotesRow}>
        <Pressable onPress={handleOwnQuotesPress} style={styles.ownQuotesItem}>
          <Text style={[styles.ownQuotesLabel, !isPremium && styles.ownQuotesLabelLocked]}>
            Own Quotes
          </Text>
        </Pressable>
        {!isPremium ? (
          <IconSymbol name="lock.fill" size={16} color="#7B9AAA" />
        ) : (
          <>
            <Pressable onPress={handleOwnQuotesToggle} hitSlop={8}>
              <IconSymbol
                name={isOwnQuotesFollowed ? 'checkmark.circle.fill' : 'circle'}
                size={22}
                color={isOwnQuotesFollowed ? '#3A6B80' : '#C5D5DC'}
              />
            </Pressable>
            <Pressable onPress={handleOwnQuotesPress} hitSlop={8} style={styles.chevronButton}>
              <IconSymbol name="chevron.right" size={18} color="#7B9AAA" />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  ownQuotesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownQuotesItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  ownQuotesLabel: {
    fontSize: 16,
    color: '#3A6B80',
    flex: 1,
  },
  ownQuotesLabelLocked: {
    color: '#7B9AAA',
  },
  chevronButton: {
    paddingRight: 16,
  },
});
