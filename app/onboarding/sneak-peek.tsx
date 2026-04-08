import { useAppContext } from '@/context/app-context';
import { defaultUserData } from '@/data/types';
import quotesData from '@/data/quotes';
import { Quote } from '@/data/types';
import { Events, posthog } from '@/utils/posthog';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const allQuotes: Quote[] = quotesData as Quote[];

export default function SneakPeekScreen() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const s = Math.max(0.85, Math.min(1, Math.min(width / 390, height / 844)));

  const interests = state.user?.interests ?? [];
  const emotionRoot = state.user?.emotionRoot || 'your journey';

  const quote = useMemo(() => {
    // Only consider quotes short enough to look good on the card
    const short = allQuotes.filter((q) => q.text.length <= 120);

    // Try to find a quote matching user interests
    if (interests.length > 0) {
      const matched = short.filter((q) =>
        interests.some((interest) => {
          if (interest.includes(':')) {
            const [category, sub] = interest.split(':');
            return q.category === category && q.subcategory === sub;
          }
          return q.category === interest;
        }),
      );
      if (matched.length > 0) {
        return matched[Math.floor(Math.random() * matched.length)];
      }
    }
    // Fallback
    return short[Math.floor(Math.random() * short.length)];
  }, [interests]);

  // Animations
  const labelOpacity = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.95);
  const footerOpacity = useSharedValue(0);
  const btnOpacity = useSharedValue(0);

  useEffect(() => {
    posthog.capture(Events.ONBOARDING_SCREEN_VIEWED, { screen_name: 'sneak_peek' });
    // Save the quote so notification-preview can reuse it
    dispatch({
      type: 'SET_USER',
      payload: { ...defaultUserData, ...state.user, stuckResponse: `"${quote.text}" — ${quote.author}` },
    });
  }, []);

  useEffect(() => {
    labelOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
    cardOpacity.value = withDelay(400, withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) }));
    cardScale.value = withDelay(400, withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) }));
    footerOpacity.value = withDelay(1400, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
    btnOpacity.value = withDelay(2000, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
  }, []);

  const labelStyle = useAnimatedStyle(() => ({ opacity: labelOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));
  const footerStyle = useAnimatedStyle(() => ({ opacity: footerOpacity.value }));
  const btnStyle = useAnimatedStyle(() => ({ opacity: btnOpacity.value }));

  return (
    <LinearGradient
      colors={['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0']}
      locations={[0, 0.3, 0.7, 1]}
      style={styles.gradient}
    >
      <View style={[styles.content, { paddingTop: insets.top + 40 * s, paddingBottom: insets.bottom + 32 * s, paddingHorizontal: 32 * s }]}>
        {/* Label */}
        <Animated.Text style={[styles.label, { fontSize: 16 * s }, labelStyle]}>
          Here is your first Whisper
        </Animated.Text>

        {/* Quote card */}
        <Animated.View style={[styles.card, { padding: 32 * s }, cardStyle]}>
          <Text style={[styles.quoteText, { fontSize: 22 * s, lineHeight: 32 * s }]}>
            "{quote.text}"
          </Text>
          <Text style={[styles.authorText, { fontSize: 14 * s, marginTop: 16 * s }]}>
            — {quote.author}
          </Text>
        </Animated.View>

        {/* Footer text */}
        <Animated.Text style={[styles.footer, { fontSize: 14 * s }, footerStyle]}>
          We've curated 2000+ more quotes to help you navigate {emotionRoot.split(', ')[0].toLowerCase()}.
        </Animated.Text>

        {/* Continue button */}
        <Animated.View style={[styles.btnWrapper, btnStyle]}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              { paddingVertical: 18 * s, paddingHorizontal: 40 * s },
              pressed && styles.buttonPressed,
            ]}
            onPress={() => {
              if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/onboarding/notification-preview');
            }}
          >
            <Text style={[styles.buttonText, { fontSize: 18 * s }]}>Continue</Text>
          </Pressable>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  content: { flex: 1, justifyContent: 'space-between', alignItems: 'center' },
  label: { fontWeight: '600', color: '#5A8BA8', textAlign: 'center' },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(184, 217, 232, 0.4)',
    shadowColor: '#5A8BA8',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    alignItems: 'center',
  },
  quoteText: {
    fontWeight: '600',
    color: '#3A6B80',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  authorText: {
    fontWeight: '400',
    color: '#7B9AAA',
    textAlign: 'center',
  },
  footer: {
    fontWeight: '400',
    color: '#6B8F9E',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  btnWrapper: { width: '100%' },
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
  buttonPressed: { transform: [{ translateY: 2 }] },
  buttonText: { fontWeight: '700', color: '#5A8BA8', letterSpacing: 0.5 },
});
