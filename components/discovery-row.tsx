import { IconSymbol } from '@/components/ui/icon-symbol';
import { CategoryInfo, SubcategoryInfo } from '@/constants/categories';
import { Quote } from '@/data/types';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

interface DiscoveryRowProps {
  title: string;
  subtitle?: string;
  items: DiscoveryCard[];
  onToggle?: (card: DiscoveryCard) => void;
  onSeeAll?: () => void;
}

export interface DiscoveryCard {
  category: CategoryInfo;
  subcategory?: SubcategoryInfo;
  previewQuote?: Quote;
  quoteCount: number;
  isLocked: boolean;
  isFollowed: boolean;
}

function QuoteCard({
  card,
  width,
  onToggle,
}: {
  card: DiscoveryCard;
  width: number;
  onToggle?: (card: DiscoveryCard) => void;
}) {
  const cardWidth = width * 0.6;
  const label = card.subcategory?.label ?? card.category.label;
  const categoryKey = card.category.key;
  const subcategoryKey = card.subcategory?.key;

  const handlePress = () => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (card.isLocked) {
      router.push('/onboarding/paywall');
      return;
    }
    const params: Record<string, string> = { category: categoryKey };
    if (subcategoryKey) params.subcategory = subcategoryKey;
    router.push({ pathname: '/category-feed', params });
  };

  const handleToggle = () => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (card.isLocked) {
      router.push('/onboarding/paywall');
      return;
    }
    onToggle?.(card);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        { width: cardWidth },
        pressed && styles.cardPressed,
      ]}
    >
      {/* Quote preview area */}
      <View style={styles.cardContent}>
        {card.previewQuote && !card.isLocked && (
          <>
            <Text style={styles.quoteText} numberOfLines={4}>
              "{card.previewQuote.text}"
            </Text>
            <Text style={styles.quoteAuthor} numberOfLines={1}>
              — {card.previewQuote.author}
            </Text>
          </>
        )}
        {card.isLocked && (
          <View style={styles.lockedContent}>
            <View style={styles.lockBadge}>
              <IconSymbol name="lock.fill" size={20} color="#FFFFFF" />
            </View>
          </View>
        )}
        {!card.previewQuote && !card.isLocked && (
          <View style={styles.emptyPreview}>
            <IconSymbol name="quote.opening" size={28} color="rgba(58,107,128,0.2)" />
          </View>
        )}
      </View>

      {/* Bottom label + toggle */}
      <View style={styles.cardFooter}>
        <View style={styles.cardFooterText}>
          <Text style={[styles.cardLabel, card.isLocked && styles.cardLabelLocked]} numberOfLines={1}>
            {label}
          </Text>
          <Text style={styles.cardCount}>
            {card.isLocked
              ? `Unlock ${card.quoteCount} quotes`
              : `${card.quoteCount} quotes`}
          </Text>
        </View>
        <Pressable onPress={handleToggle} hitSlop={8} style={styles.toggleButton}>
          {card.isLocked ? (
            <IconSymbol name="lock.fill" size={18} color="#7B9AAA" />
          ) : (
            <IconSymbol
              name={card.isFollowed ? 'checkmark.circle.fill' : 'plus.circle'}
              size={22}
              color={card.isFollowed ? '#3A6B80' : '#B0C9D4'}
            />
          )}
        </Pressable>
      </View>
    </Pressable>
  );
}

export function DiscoveryRow({ title, subtitle, items, onToggle, onSeeAll }: DiscoveryRowProps) {
  const { width } = useWindowDimensions();

  if (items.length === 0) return null;

  return (
    <View style={styles.rowContainer}>
      <View style={styles.rowHeader}>
        <View style={styles.rowTitleWrap}>
          <Text style={styles.rowTitle}>{title}</Text>
          {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
        </View>
        {onSeeAll && (
          <Pressable onPress={onSeeAll} hitSlop={8}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={width * 0.6 + 12}
      >
        {items.map((card, i) => (
          <QuoteCard
            key={`${card.category.key}-${card.subcategory?.key ?? 'all'}-${i}`}
            card={card}
            width={width}
            onToggle={onToggle}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    gap: 12,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  rowTitleWrap: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3A6B80',
  },
  rowSubtitle: {
    fontSize: 13,
    color: '#7B9AAA',
    marginTop: 2,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A8BA8',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  // Card
  card: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardContent: {
    padding: 16,
    minHeight: 140,
    justifyContent: 'center',
  },
  quoteText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3A6B80',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    fontSize: 12,
    color: '#7B9AAA',
    marginTop: 8,
  },
  // Locked state
  lockedContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(58,107,128,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3A6B80',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  // Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 10,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(58,107,128,0.08)',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  cardFooterText: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A6B80',
  },
  cardLabelLocked: {
    color: '#7B9AAA',
  },
  cardCount: {
    fontSize: 12,
    color: '#7B9AAA',
    marginTop: 2,
  },
  toggleButton: {
    padding: 6,
  },
});
