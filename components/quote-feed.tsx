import { QuoteCard } from '@/components/quote-card';
import { Quote } from '@/data/types';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface QuoteFeedProps {
  quotes: Quote[];
  cardHeight: number;
  showSwipeHint?: boolean;
  onHintDismissed?: () => void;
  onSwipe?: () => void;
  onLike?: () => void;
}

export function QuoteFeed({
  quotes,
  cardHeight,
  showSwipeHint = false,
  onHintDismissed,
  onSwipe,
  onLike,
}: QuoteFeedProps) {
  const insets = useSafeAreaInsets();
  const [hintActive, setHintActive] = useState(showSwipeHint);
  const hintAnim = useSharedValue(0);

  useEffect(() => {
    if (showSwipeHint) {
      setHintActive(true);
    }
  }, [showSwipeHint]);

  useEffect(() => {
    if (!hintActive) return;

    hintAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [hintActive]);

  const handleScrollBeginDrag = useCallback(() => {
    if (hintActive) {
      setHintActive(false);
      onHintDismissed?.();
    }
    onSwipe?.();
  }, [hintActive, onHintDismissed, onSwipe]);

  const hintStyle = useAnimatedStyle(() => ({
    opacity: hintActive
      ? interpolate(hintAnim.value, [0, 1], [0.4, 0.8])
      : withTiming(0, { duration: 300 }),
    transform: [
      { translateY: interpolate(hintAnim.value, [0, 1], [0, 8]) },
    ],
  }));

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: cardHeight,
      offset: cardHeight * index,
      index,
    }),
    [cardHeight],
  );

  const renderItem = useCallback(
    ({ item }: { item: Quote }) => (
      <QuoteCard quote={item} height={cardHeight} onLike={onLike} />
    ),
    [cardHeight, onLike],
  );

  const keyExtractor = useCallback((item: Quote) => item.id, []);

  return (
    <View style={styles.wrapper}>
      <FlatList
        data={quotes}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={cardHeight}
        decelerationRate="fast"
        bounces={false}
        onScrollBeginDrag={handleScrollBeginDrag}
      />

      {hintActive && (
        <Animated.View style={[styles.hintOverlay, { bottom: insets.bottom + 20 }, hintStyle]} pointerEvents="none">
          <Text style={styles.hintArrow}>↑</Text>
          <Text style={styles.hintText}>swipe up</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  hintOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 16,
    fontWeight: '300',
    color: '#7B9AAA',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  hintArrow: {
    fontSize: 18,
    color: '#7B9AAA',
  },
});
