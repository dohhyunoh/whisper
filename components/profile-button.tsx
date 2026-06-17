import { GlassContainer } from '@/components/glass-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';

interface ProfileButtonProps {
  style?: StyleProp<ViewStyle>;
  // true → dark icon (for light backgrounds), false → white icon (for dark ones).
  dark?: boolean;
}

const BASE_SIZE = 44;
const BASE_SCREEN_WIDTH = 375;
const MAX_SCREEN_WIDTH = 430;

export function ProfileButton({ style, dark = true }: ProfileButtonProps) {
  const iconColor = dark ? '#2C2C2C' : '#FFFFFF';
  const { width } = useWindowDimensions();
  const scale = 1 + ((Math.min(width, MAX_SCREEN_WIDTH) - BASE_SCREEN_WIDTH) / (MAX_SCREEN_WIDTH - BASE_SCREEN_WIDTH)) * 0.3;
  const size = Math.round(BASE_SIZE * scale);

  const handlePress = () => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/settings');
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        style,
        pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }
      ]}
      hitSlop={12}
    >
      {/* Icon is overlaid on top of the glass, not nested inside it: native Liquid
          Glass applies a vibrancy effect to its children that washes the icon white,
          ignoring tintColor. Rendering it as a sibling keeps the real color. */}
      <View style={{ width: size, height: size }}>
        <GlassContainer style={{ width: size, height: size, borderRadius: size / 2 }} />
        <View style={styles.iconWrap} pointerEvents="none">
          <IconSymbol name="person.circle" size={30} color={iconColor} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
