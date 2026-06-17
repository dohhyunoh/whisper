import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

const useNativeGlass = isGlassEffectAPIAvailable();

interface GlassContainerProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function GlassContainer({ style, children }: GlassContainerProps) {
  // Pure Liquid Glass — no background tint. Passing a backgroundColor here fills
  // the glass with a flat color (the old dark pill), which kills the glass look.
  if (useNativeGlass) {
    return (
      <GlassView style={[styles.container, style]} glassEffectStyle="regular" isInteractive>
        {children}
      </GlassView>
    );
  }

  // Pre-iOS 26 has no Liquid Glass API; approximate with a faint translucent pill.
  return (
    <View style={[styles.container, styles.fallback, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  fallback: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});
