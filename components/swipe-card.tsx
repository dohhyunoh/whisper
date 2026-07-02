import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { ReactNode, useCallback, useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const SWIPE_THRESHOLD_RATIO = 0.25;
const SWIPE_VELOCITY_THRESHOLD = 800;
const INDICATOR_REVEAL_RATIO = 0.18;
const LIKE_COLOR = '#5A8BA8';
const SKIP_COLOR = '#E85D75';
const INDICATOR_SIZE = 48;
const INDICATOR_TOP = 130;

interface SwipeCardProps {
  isTop: boolean;
  onSwipe: (dir: 'like' | 'skip') => void;
  children: ReactNode;
  showHint?: boolean;
}

export function SwipeCard({ isTop, onSwipe, children, showHint }: SwipeCardProps) {
  const { width: screenWidth } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const hintOffset = useSharedValue(0);

  useEffect(() => {
    if (!isTop || !showHint) return;
    hintOffset.value = withDelay(
      400,
      withSequence(
        withTiming(60, { duration: 700 }),
        withTiming(-60, { duration: 1000 }),
        withTiming(0, { duration: 700 }),
      ),
    );
  }, [isTop, showHint]);

  const flyOff = useCallback(
    (dir: 'like' | 'skip') => {
      onSwipe(dir);
    },
    [onSwipe],
  );

  const pan = Gesture.Pan()
    .enabled(isTop)
    .activeOffsetX([-12, 12])
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.3;
    })
    .onEnd((e) => {
      const threshold = screenWidth * SWIPE_THRESHOLD_RATIO;
      const shouldFly =
        Math.abs(e.translationX) > threshold || Math.abs(e.velocityX) > SWIPE_VELOCITY_THRESHOLD;

      if (shouldFly) {
        const dir = e.translationX > 0 ? 'like' : 'skip';
        const exitX = (dir === 'like' ? 1 : -1) * screenWidth * 1.5;
        translateX.value = withTiming(exitX, { duration: 250 }, () => {
          runOnJS(flyOff)(dir);
        });
      } else {
        translateX.value = withTiming(0, { duration: 220 });
        translateY.value = withTiming(0, { duration: 220 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const totalX = translateX.value + hintOffset.value;
    const dragRotate = interpolate(totalX, [-screenWidth, 0, screenWidth], [-12, 0, 12]);
    return {
      transform: [
        { translateX: totalX },
        { translateY: translateY.value },
        { rotate: `${dragRotate}deg` },
      ],
    };
  });

  const likeIndicatorStyle = useAnimatedStyle(() => {
    const totalX = translateX.value + hintOffset.value;
    const reveal = screenWidth * INDICATOR_REVEAL_RATIO;
    const progress = interpolate(totalX, [0, reveal], [0, 1], 'clamp');
    return {
      opacity: progress,
      transform: [{ scale: 0.8 + progress * 0.2 }],
    };
  });

  const skipIndicatorStyle = useAnimatedStyle(() => {
    const totalX = translateX.value + hintOffset.value;
    const reveal = screenWidth * INDICATOR_REVEAL_RATIO;
    const progress = interpolate(totalX, [-reveal, 0], [1, 0], 'clamp');
    return {
      opacity: progress,
      transform: [{ scale: 0.8 + progress * 0.2 }],
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, cardStyle]}>{children}</Animated.View>

        <Animated.View style={[styles.indicator, styles.likeIndicator, likeIndicatorStyle]} pointerEvents="none">
          <BlurView intensity={30} tint="light" style={styles.indicatorInner}>
            <Ionicons name="heart" size={24} color={LIKE_COLOR} />
          </BlurView>
        </Animated.View>

        <Animated.View style={[styles.indicator, styles.skipIndicator, skipIndicatorStyle]} pointerEvents="none">
          <BlurView intensity={30} tint="light" style={styles.indicatorInner}>
            <Ionicons name="close" size={25} color={SKIP_COLOR} />
          </BlurView>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    top: INDICATOR_TOP,
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
