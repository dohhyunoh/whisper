import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  topInset: number;
}

export function Toast({ message, visible, onHide, topInset }: ToastProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-10);

  useEffect(() => {
    if (!visible) return;
    opacity.value = 0;
    translateY.value = -10;
    opacity.value = withSequence(
      withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 1500 }),
      withTiming(0, { duration: 300 }, () => {
        translateY.value = -10;
      }),
    );
    translateY.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) });

    const t = setTimeout(onHide, 2100);
    return () => clearTimeout(t);
  }, [visible, message]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible && opacity.value === 0) return null;

  return (
    <Animated.View style={[styles.wrap, { top: topInset + 12 }, style]} pointerEvents="none">
      <BlurView intensity={50} tint="dark" style={styles.inner}>
        <Ionicons name="heart" size={16} color="#FFFFFF" />
        <Text style={styles.text}>{message}</Text>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
