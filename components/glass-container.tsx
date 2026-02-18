import { usePremium } from '@/hooks/use-premium';
import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

const useNativeGlass = isGlassEffectAPIAvailable();

interface GlassContainerProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function GlassContainer({ style, children }: GlassContainerProps) {
  const { currentTheme } = usePremium();
  const isLightBackground = currentTheme.key.startsWith('classic') || currentTheme.key === 'default';

  if (useNativeGlass) {
    return (
      <GlassView style={[styles.darkContainer, style]} glassEffectStyle="regular" isInteractive>
        {children}
      </GlassView>
    );
  }

  return (
    <View style={[styles.darkContainer, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  darkContainer: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 20, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  lightContainer: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
});
