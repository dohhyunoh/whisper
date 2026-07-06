import React, { useEffect } from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedChoiceProps {
  /** Position in the option list — drives the entrance stagger. */
  index: number;
  selected?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

// Shared wrapper for onboarding choice pills: staggered fade/rise on mount,
// scale-down while pressed, and a small pop when the option becomes selected.
export function AnimatedChoice({
  index,
  selected = false,
  onPress,
  style,
  children,
}: AnimatedChoiceProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);
  const scale = useSharedValue(1);

  useEffect(() => {
    const delay = 300 + index * 70;
    opacity.value = withDelay(delay, withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
  }, []);

  useEffect(() => {
    if (!selected) return;
    scale.value = withSequence(
      withTiming(1.04, { duration: 120, easing: Easing.out(Easing.ease) }),
      withSpring(1, { damping: 12, stiffness: 200 }),
    );
  }, [selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(0.97, { duration: 90, easing: Easing.out(Easing.ease) });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 14, stiffness: 220 });
        }}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
