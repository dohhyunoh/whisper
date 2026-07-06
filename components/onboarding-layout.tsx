import { RiveFileFactory, RiveView } from '@rive-app/react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TYPE_INTERVAL_MS = 24;

// Reveals text character by character. The not-yet-typed remainder is rendered
// transparent so the bubble keeps its final size from the first frame.
function TypewriterText({
  text,
  style,
  startDelay = 0,
}: {
  text: string;
  style: StyleProp<TextStyle>;
  startDelay?: number;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(() => {
      let i = 0;
      interval = setInterval(() => {
        i += 1;
        setCount(i);
        if (i >= text.length && interval) clearInterval(interval);
      }, TYPE_INTERVAL_MS);
    }, startDelay);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [text, startDelay]);

  return (
    <Text style={style}>
      {text.slice(0, count)}
      <Text style={styles.untypedText}>{text.slice(count)}</Text>
    </Text>
  );
}

type RiveFile = Awaited<ReturnType<typeof RiveFileFactory.fromSource>>;

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

  // Argo taking notes, shown to the left of the question title.
  const [memoRive, setMemoRive] = useState<RiveFile | null>(null);
  useEffect(() => {
    let cancelled = false;
    RiveFileFactory.fromSource(require('@/assets/rive/argo_memo_v1.riv'), undefined)
      .then((f) => {
        if (!cancelled) setMemoRive(f);
      })
      .catch((err) => console.warn('Failed to load Argo memo Rive file:', err));
    return () => {
      cancelled = true;
    };
  }, []);

  // Manual line breaks in titles were tuned for the old 34pt heading; inside
  // the bubble the text wraps naturally, so collapse them.
  const bubbleTitle = title.replace(/\s*\n\s*/g, ' ');
  const bubbleSubtitle = subtitle?.replace(/\s*\n\s*/g, ' ');

  // Bubble pops in softly before Argo "speaks".
  const bubbleOpacity = useSharedValue(0);
  const bubbleShift = useSharedValue(8);
  useEffect(() => {
    bubbleOpacity.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) });
    bubbleShift.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) });
  }, []);
  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: bubbleOpacity.value,
    transform: [{ translateY: bubbleShift.value }],
  }));

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

      <View style={[styles.headerRow, { gap: 10 * s, marginBottom: 24 * s }]}>
        {memoRive && (
          <RiveView
            file={memoRive}
            artboardName="main"
            stateMachineName="main"
            autoPlay
            style={{ width: 110 * s, height: 110 * s, backgroundColor: 'transparent' }}
          />
        )}
        <Animated.View
          style={[styles.bubble, { paddingVertical: 14 * s, paddingHorizontal: 18 * s }, bubbleStyle]}
        >
          <View style={styles.bubbleTail} />
          <TypewriterText
            text={bubbleTitle}
            startDelay={350}
            style={[styles.title, { fontSize: 19 * s, lineHeight: 26 * s }]}
          />
          {bubbleSubtitle ? (
            <TypewriterText
              text={bubbleSubtitle}
              startDelay={350 + bubbleTitle.length * TYPE_INTERVAL_MS + 250}
              style={[styles.subtitle, { fontSize: 15 * s, lineHeight: 21 * s, marginTop: 6 * s }]}
            />
          ) : null}
        </Animated.View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bubble: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(184, 217, 232, 0.4)',
    shadowColor: '#5A8BA8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  bubbleTail: {
    position: 'absolute',
    left: -6,
    top: '50%',
    marginTop: -7,
    width: 14,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomLeftRadius: 3,
    transform: [{ rotate: '45deg' }],
  },
  title: {
    fontWeight: '600',
    color: '#5A8BA8',
  },
  subtitle: {
    fontWeight: '300',
    color: '#6B8F9E',
  },
  untypedText: {
    color: 'transparent',
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
