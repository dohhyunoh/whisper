import { useAppContext } from '@/context/app-context';
import { Quote } from '@/data/types';
import { getTodayDeckProgress, recordDeckSwipe } from '@/utils/deck-engine';
import { Events, posthog } from '@/utils/posthog';
import { hasSeenDeckHint, markDeckHintSeen, recordSwipe, SwipeDir } from '@/utils/tag-weights';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { QuoteCard } from './quote-card';
import { SwipeCard } from './swipe-card';

interface SwipeDeckProps {
  quotes: Quote[];
  height: number;
  onFirstSwipe?: () => void;
  onHeartTapped?: () => void;
  // Fires when the deck switches between showing cards and the end-of-deck recap.
  // The recap has its own (always-light) background, so floating controls need it.
  onRecapChange?: (showingRecap: boolean) => void;
}

interface SwipeRecord {
  quote: Quote;
  dir: SwipeDir;
}

export function SwipeDeck({ quotes, height, onFirstSwipe, onHeartTapped, onRecapChange }: SwipeDeckProps) {
  const { dispatch } = useAppContext();
  // Resume from persisted progress so a cold reopen doesn't replay today's deck.
  const resumed = useState<{ index: number; history: SwipeRecord[] }>(() => {
    const stored = getTodayDeckProgress();
    if (!stored) return { index: 0, history: [] };
    const byId = new Map(quotes.map((q) => [q.id, q]));
    const history: SwipeRecord[] = [];
    for (const s of stored.swipes) {
      const quote = byId.get(s.id);
      if (quote) history.push({ quote, dir: s.dir });
    }
    return { index: history.length, history };
  })[0];

  const [index, setIndex] = useState(resumed.index);
  const [history, setHistory] = useState<SwipeRecord[]>(resumed.history);
  const [showHint] = useState(() => !hasSeenDeckHint());
  // When the current top card became visible, for dwell-time analytics.
  const cardShownAt = useRef(Date.now());

  useEffect(() => {
    posthog.capture(Events.DECK_OPENED, {
      progress: resumed.index,
      deck_size: quotes.length,
      completed: resumed.index >= quotes.length,
    });
    // Fire once per mount; resumed.index is fixed at mount time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSwipe = useCallback(
    (quote: Quote, dir: SwipeDir) => {
      posthog.capture(Events.QUOTE_VIEWED, {
        quote_id: quote.id,
        tags: quote.tags ?? [],
        author: quote.author,
        direction: dir,
        position_in_deck: index + 1,
        dwell_ms: Date.now() - cardShownAt.current,
      });
      cardShownAt.current = Date.now();
      if (index + 1 >= quotes.length) {
        posthog.capture(Events.DECK_COMPLETED, {
          deck_size: quotes.length,
          liked_count:
            history.filter((h) => h.dir === 'like').length + (dir === 'like' ? 1 : 0),
        });
      }
      recordSwipe(quote.id, quote.tags, dir);
      recordDeckSwipe(quote.id, dir);
      // Weights are now updated in MMKV; bump the nonce so the widget re-syncs.
      dispatch({ type: 'RECORD_SWIPE' });
      if (!hasSeenDeckHint()) markDeckHintSeen();
      if (process.env.EXPO_OS === 'ios') {
        Haptics.impactAsync(
          dir === 'like' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
        );
      }
      setHistory((h) => {
        if (h.length === 0) onFirstSwipe?.();
        return [...h, { quote, dir }];
      });
      setIndex((i) => i + 1);
    },
    [onFirstSwipe, dispatch, index, history, quotes.length],
  );

  const totalSlots = quotes.length;
  const showingRecap = index >= totalSlots;

  useEffect(() => {
    onRecapChange?.(showingRecap);
  }, [showingRecap, onRecapChange]);

  if (showingRecap) {
    return <DeckRecap height={height} history={history} />;
  }

  const renderSlot = (slotIndex: number) => {
    if (slotIndex >= totalSlots) return null;
    const isTop = slotIndex === index;
    const quote = quotes[slotIndex];
    if (!quote) return null;

    return (
      <View key={quote.id} style={[StyleSheet.absoluteFill, !isTop && styles.behind]}>
        <SwipeCard
          isTop={isTop}
          onSwipe={(dir) => handleSwipe(quote, dir)}
          showHint={showHint && slotIndex === 0}
        >
          <QuoteCard quote={quote} height={height} onLike={onHeartTapped} />
        </SwipeCard>
      </View>
    );
  };

  return (
    <View style={[styles.deck, { height }]}>
      {renderSlot(index + 1)}
      {renderSlot(index)}
    </View>
  );
}

function DeckRecap({ height, history }: { height: number; history: SwipeRecord[] }) {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [1, 0], 'clamp'),
    transform: [{ translateY: interpolate(scrollY.value, [0, 80], [0, -24], 'clamp') }],
  }));

  const openQuote = useCallback((quoteId: string) => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({
      pathname: '/quote-viewer',
      params: { favorites: 'true', favoriteId: quoteId, hideTitle: 'true' },
    });
  }, []);

  return (
    <View style={[styles.empty, { height }]}>
      <LinearGradient
        colors={['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0']}
        locations={[0, 0.25, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.recapHeader, headerStyle]} pointerEvents="none">
        <Text style={styles.eyebrow}>TODAY'S DECK</Text>
        <Text style={styles.emptyHeadline}>That's today.</Text>
        <Text style={styles.emptyBody}>See you tomorrow.</Text>
      </Animated.View>

      <Animated.ScrollView
        style={styles.recap}
        contentContainerStyle={styles.recapContent}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {history.map((rec, i) => {
          const liked = rec.dir === 'like';
          return (
            <Pressable
              key={`${rec.quote.id}-${i}`}
              onPress={() => openQuote(rec.quote.id)}
              style={({ pressed }) => [
                styles.recapRow,
                pressed && styles.recapRowPressed,
              ]}
            >
              <View
                style={[
                  styles.dirChip,
                  liked ? styles.dirChipLike : styles.dirChipSkip,
                ]}
              >
                <Ionicons
                  name={liked ? 'heart' : 'close'}
                  size={liked ? 14 : 16}
                  color="#FFF"
                />
              </View>
              <View style={styles.recapTextWrap}>
                <Text style={styles.recapQuote} numberOfLines={3}>
                  "{rec.quote.text}"
                </Text>
                <Text style={styles.recapAuthor}>— {rec.quote.author}</Text>
              </View>
            </Pressable>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
}

const HEADER_HEIGHT = 180;

const styles = StyleSheet.create({
  deck: {
    width: '100%',
  },
  behind: {
    transform: [{ scale: 0.95 }],
    opacity: 0.6,
  },
  empty: {
    width: '100%',
    alignItems: 'center',
  },
  recapHeader: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 72,
    paddingHorizontal: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5A8BA8',
    letterSpacing: 2.4,
    marginBottom: 10,
    textAlign: 'center',
    width: '100%',
  },
  emptyHeadline: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3A6B80',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
    width: '100%',
  },
  emptyBody: {
    fontSize: 15,
    fontWeight: '500',
    color: '#7B9AAA',
    textAlign: 'center',
    marginBottom: 0,
    width: '100%',
  },
  recap: {
    width: '100%',
    flex: 1,
  },
  recapContent: {
    paddingTop: HEADER_HEIGHT,
    paddingBottom: 120,
    paddingHorizontal: 20,
    gap: 12,
  },
  recapRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(58, 107, 128, 0.08)',
    shadowColor: '#5A8BA8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  recapRowPressed: {
    backgroundColor: 'rgba(255,255,255,1)',
    transform: [{ scale: 0.98 }],
  },
  dirChip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  dirChipLike: {
    backgroundColor: '#E85D75',
  },
  dirChipSkip: {
    backgroundColor: 'rgba(58, 107, 128, 0.4)',
  },
  recapTextWrap: {
    flex: 1,
    gap: 4,
  },
  recapQuote: {
    fontSize: 15,
    color: '#3A6B80',
    lineHeight: 21,
    fontWeight: '500',
  },
  recapAuthor: {
    fontSize: 13,
    color: '#7B9AAA',
  },
});
