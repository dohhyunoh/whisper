import { GlassContainer } from '@/components/glass-container';
import { PremiumIcon } from '@/components/icons/premium-icon';
import { usePremium } from '@/hooks/use-premium';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleProp, ViewStyle, useWindowDimensions } from 'react-native';

interface PremiumButtonProps {
  style?: StyleProp<ViewStyle>;
}

const BASE_SIZE = 44;
const BASE_SCREEN_WIDTH = 375;
const MAX_SCREEN_WIDTH = 430;

export function PremiumButton({ style }: PremiumButtonProps) {
  const { isPremium, currentTheme } = usePremium();
  const iconColor = '#FFF';
  const { width } = useWindowDimensions();
  const scale = 1 + ((Math.min(width, MAX_SCREEN_WIDTH) - BASE_SCREEN_WIDTH) / (MAX_SCREEN_WIDTH - BASE_SCREEN_WIDTH)) * 0.3;
  const size = Math.round(BASE_SIZE * scale);

  if (isPremium) {
    return null;
  }

  const handlePress = () => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding/paywall');
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
      <GlassContainer style={{ width: size, height: size, borderRadius: size / 2 }}>
        <PremiumIcon size={30} color={iconColor} />
      </GlassContainer>
    </Pressable>
  );
}
