import { GlassContainer } from '@/components/glass-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { usePremium } from '@/hooks/use-premium';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';

interface ProfileButtonProps {
  style?: StyleProp<ViewStyle>;
}

const BASE_SIZE = 44;
const BASE_SCREEN_WIDTH = 375;
const MAX_SCREEN_WIDTH = 430;

export function ProfileButton({ style }: ProfileButtonProps) {
  const { currentTheme } = usePremium();
  const iconColor = '#FFF';
  const { width } = useWindowDimensions();
  const scale = 1 + ((Math.min(width, MAX_SCREEN_WIDTH) - BASE_SCREEN_WIDTH) / (MAX_SCREEN_WIDTH - BASE_SCREEN_WIDTH)) * 0.3;
  const size = Math.round(BASE_SIZE * scale);

  const handlePress = () => {
    router.push('/profile-modal');
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
        <View style={styles.iconWrap}>
          <IconSymbol name="person.circle" size={30} color={iconColor} />
        </View>
      </GlassContainer>
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
