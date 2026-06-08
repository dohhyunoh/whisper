import { Quote } from '@/data/types';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useLayoutEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { QuoteCard } from './quote-card';

const LIKE_COLOR = '#5A8BA8';
const SKIP_COLOR = '#E85D75';
const INDICATOR_SIZE = 84;

interface SwipeDemoProps {
  quotes: Quote[];
  width: number;
  height: number;
  /**
   * Per-quote swipe directions. Repeats if shorter than quotes.length.
   * Defaults to alternating right/left.
   */
  directions?: ('like' | 'skip')[];
  /**
   * If false, stops after `directions.length` swipes (one shot per direction).
   * Defaults to true.
   */
  loop?: boolean;
}

const SETTLE_MS = 700;
const DRAG_MS = 1200;
const FLY_MS = 500;
const TOTAL_PER_CARD_MS = SETTLE_MS + DRAG_MS + FLY_MS + 100;

export function SwipeDemo({ quotes, width, height, directions, loop = true }: SwipeDemoProps) {
  const { width: screenWidth } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const [topIndex, setTopIndex] = useState(0);

  const dirs = directions ?? ['like', 'skip', 'like', 'skip'];
  const finished = !loop && topIndex >= dirs.length;
  const currentDir = dirs[topIndex % dirs.length];

  const advance = () => setTopIndex((i) => i + 1);

  useLayoutEffect(() => {
    if (quotes.length < 2) return;

    // Re-center the promoted card on every advance — including when the demo has
    // finished — so the card that was peeking behind becomes the visible top card
    // instead of being stranded off-screen (which revealed the wrong quote).
    translateX.value = 0;
    if (finished) return;

    const sign = currentDir === 'like' ? 1 : -1;
    const dragTarget = sign * screenWidth * 0.32;
    const exitTarget = sign * screenWidth * 1.4;

    translateX.value = withSequence(
      withDelay(SETTLE_MS, withTiming(dragTarget, { duration: DRAG_MS })),
      withTiming(exitTarget, { duration: FLY_MS }, (done) => {
        if (done) runOnJS(advance)();
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topIndex, quotes.length, screenWidth, currentDir, finished]);

  const topCardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-screenWidth, 0, screenWidth], [-14, 0, 14]);
    return {
      transform: [{ translateX: translateX.value }, { rotate: `${rotate}deg` }],
    };
  });

  const likeIndicatorStyle = useAnimatedStyle(() => {
    const reveal = screenWidth * 0.18;
    const progress = interpolate(translateX.value, [0, reveal], [0, 1], 'clamp');
    return {
      opacity: progress,
      transform: [{ scale: 0.85 + progress * 0.15 }],
    };
  });

  const skipIndicatorStyle = useAnimatedStyle(() => {
    const reveal = screenWidth * 0.18;
    const progress = interpolate(translateX.value, [-reveal, 0], [1, 0], 'clamp');
    return {
      opacity: progress,
      transform: [{ scale: 0.85 + progress * 0.15 }],
    };
  });

  if (quotes.length === 0) return null;
  const safeIdx = topIndex % quotes.length;
  const topQuote = quotes[safeIdx];
  const nextQuote = quotes[(safeIdx + 1) % quotes.length];

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      <View style={[styles.cardSlot, styles.behind]}>
        <QuoteCard quote={nextQuote} height={height} />
      </View>

      <Animated.View style={[styles.cardSlot, topCardStyle]}>
        <QuoteCard quote={topQuote} height={height} />
      </Animated.View>

      <Animated.View style={[styles.indicator, styles.likeIndicator, likeIndicatorStyle]} pointerEvents="none">
        <BlurView intensity={30} tint="light" style={styles.indicatorInner}>
          <Ionicons name="heart" size={42} color={LIKE_COLOR} />
        </BlurView>
      </Animated.View>

      <Animated.View style={[styles.indicator, styles.skipIndicator, skipIndicatorStyle]} pointerEvents="none">
        <BlurView intensity={30} tint="light" style={styles.indicatorInner}>
          <Ionicons name="close" size={44} color={SKIP_COLOR} />
        </BlurView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 24,
  },
  cardSlot: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    overflow: 'hidden',
  },
  behind: {
    transform: [{ scale: 0.94 }],
    opacity: 0.55,
  },
  indicator: {
    position: 'absolute',
    top: 36,
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  likeIndicator: {
    right: 24,
  },
  skipIndicator: {
    left: 24,
  },
  indicatorInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
