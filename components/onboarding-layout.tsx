import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface OnboardingLayoutProps {
  title: string;
  subtitle?: string;
  buttonLabel?: string;
  buttonDisabled?: boolean;
  onContinue: () => void;
  skipLabel?: string;
  onSkip: () => void;
  hideSkip?: boolean;
  hasKeyboard?: boolean;
  children: React.ReactNode;
}

export function OnboardingLayout({
  title,
  subtitle,
  buttonLabel = 'Continue',
  buttonDisabled = false,
  onContinue,
  skipLabel = 'Skip',
  onSkip,
  hideSkip = false,
  hasKeyboard = false,
  children,
}: OnboardingLayoutProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  // Scale factor: 1.0 on iPhone 14 (390×844), scales down for smaller screens
  const s = Math.max(0.85, Math.min(1, Math.min(width / 390, height / 844)));

  const content = (
    <View
      style={[
        styles.content,
        {
          paddingTop: insets.top + 8 * s,
          paddingBottom: insets.bottom + 20 * s,
          paddingHorizontal: 32 * s,
        },
      ]}
    >
      {/* Skip button - top right */}
      <View style={styles.skipRow}>
        {!hideSkip && (
          <Pressable onPress={() => {
            if (process.env.EXPO_OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
            }
            onSkip();
          }} hitSlop={12} style={styles.skipButton}>
            <Text style={[styles.skipText, { fontSize: 15 * s }]}>
              {skipLabel}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={[styles.top, { gap: 16 * s, marginBottom: 24 * s }]}>
        <Text style={[styles.title, { fontSize: 34 * s, lineHeight: 42 * s }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { fontSize: 16 * s }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.middle}>{children}</View>

      <View style={[styles.bottom, { paddingBottom: 32 * s }]}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { paddingVertical: 18 * s, paddingHorizontal: 40 * s },
            buttonDisabled && styles.buttonDisabled,
            pressed && !buttonDisabled ? styles.buttonPressed : undefined,
          ]}
          onPress={() => {
            if (process.env.EXPO_OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            onContinue();
          }}
          disabled={buttonDisabled}
        >
          <Text
            style={[
              styles.buttonText,
              { fontSize: 18 * s },
              buttonDisabled && styles.buttonTextDisabled,
            ]}
          >
            {buttonLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0']}
      locations={[0, 0.3, 0.7, 1]}
      style={styles.gradient}
    >
      {hasKeyboard ? (
        <KeyboardAvoidingView
          style={styles.gradient}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  skipRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  top: {},
  title: {
    fontWeight: '700',
    color: '#5A8BA8',
  },
  subtitle: {
    fontWeight: '300',
    color: '#6B8F9E',
  },
  middle: {
    flex: 1,
    justifyContent: 'center',
  },
  bottom: {
    alignItems: 'center',
  },
  skipText: {
    fontWeight: '500',
    color: '#6B8F9E',
  },
  button: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(184, 217, 232, 0.4)',
    alignItems: 'center',
    shadowColor: '#5A8BA8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  buttonPressed: {
    transform: [{ translateY: 2 }],
  },
  buttonText: {
    fontWeight: '700',
    color: '#5A8BA8',
    letterSpacing: 0.5,
  },
  buttonTextDisabled: {
    color: '#9BB8C7',
  },
});
