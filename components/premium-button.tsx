import { PremiumIcon } from '@/components/icons/premium-icon';
import { usePremium } from '@/hooks/use-premium';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';

interface PremiumButtonProps {
  style?: StyleProp<ViewStyle>;
}

const BASE_SIZE = 44;
const BASE_SCREEN_WIDTH = 375;
const MAX_SCREEN_WIDTH = 430;

export function PremiumButton({ style }: PremiumButtonProps) {
  const { isPremium } = usePremium();
  const { width } = useWindowDimensions();
  const scale = 1 + ((Math.min(width, MAX_SCREEN_WIDTH) - BASE_SCREEN_WIDTH) / (MAX_SCREEN_WIDTH - BASE_SCREEN_WIDTH)) * 0.3;
  const size = Math.round(BASE_SIZE * scale);

  if (isPremium) {
    return null;
  }

  const handlePress = () => {
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
      <View style={[styles.glassContainer, { width: size, height: size, borderRadius: size / 2 }]}>
        <BlurView
          intensity={80}
          tint="light"
          style={styles.blur}
        >
          <View style={styles.iconContainer}>
            <PremiumIcon size={30} color="#F5F5F0" />
          </View>
        </BlurView>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  glassContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(20, 20, 20, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  blur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
