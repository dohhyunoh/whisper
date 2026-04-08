import { Events, posthog } from '@/utils/posthog';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FACTS = [
  {
    stat: '68%',
    description: 'reduction in stress from just 6 minutes of reading',
    source: 'University of Sussex',
  },
  {
    stat: '20%',
    description: 'reduction in anxiety from 4 minutes of daily mindfulness',
    source: 'Kent State University',
  },
  {
    stat: '25%',
    description: 'happier in 10 weeks with daily gratitude reflection',
    source: 'UC Davis',
  },
];

export default function ScienceFactsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const s = Math.max(0.85, Math.min(1, Math.min(width / 390, height / 844)));

  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(15);
  const subtitleOpacity = useSharedValue(0);
  const cardOpacities = FACTS.map(() => useSharedValue(0));
  const cardTranslateYs = FACTS.map(() => useSharedValue(20));
  const btnOpacity = useSharedValue(0);

  useEffect(() => {
    posthog.capture(Events.ONBOARDING_SCREEN_VIEWED, { screen_name: 'science_facts' });
  }, []);

  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
    titleTranslateY.value = withDelay(800, withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) }));
    subtitleOpacity.value = withDelay(1400, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));

    cardOpacities.forEach((opacity, i) => {
      opacity.value = withDelay(2200 + i * 800, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
    });
    cardTranslateYs.forEach((translateY, i) => {
      translateY.value = withDelay(2200 + i * 800, withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) }));
    });

    // Show button right after the last card finishes: 2200 + (3-1)*800 + 600 = 4400
    const lastCardDone = 2200 + (FACTS.length - 1) * 800 + 600;
    btnOpacity.value = withDelay(lastCardDone, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));
  const subtitleStyle = useAnimatedStyle(() => ({ opacity: subtitleOpacity.value }));
  const btnStyle = useAnimatedStyle(() => ({ opacity: btnOpacity.value }));

  return (
    <LinearGradient
      colors={['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0']}
      locations={[0, 0.3, 0.7, 1]}
      style={styles.gradient}
    >
      <View style={[styles.content, { paddingTop: insets.top + 40 * s, paddingBottom: insets.bottom + 32 * s }]}>
        <View style={styles.header}>
          <Animated.Text style={[styles.title, { fontSize: 28 * s }, titleStyle]}>
            The science is clear.
          </Animated.Text>
          <Animated.Text style={[styles.subtitle, { fontSize: 15 * s, marginTop: 12 * s }, subtitleStyle]}>
            Words don't just feel good - they change your brain.
          </Animated.Text>
        </View>

        <View style={[styles.cards, { gap: 16 * s }]}>
          {FACTS.map((fact, i) => {
            const cardStyle = useAnimatedStyle(() => ({
              opacity: cardOpacities[i].value,
              transform: [{ translateY: cardTranslateYs[i].value }],
            }));

            return (
              <Animated.View key={fact.stat} style={[styles.card, { padding: 20 * s }, cardStyle]}>
                <Text style={[styles.stat, { fontSize: 36 * s }]}>{fact.stat}</Text>
                <Text style={[styles.description, { fontSize: 15 * s, marginTop: 4 * s }]}>
                  {fact.description}
                </Text>
                <Text style={[styles.source, { fontSize: 11 * s, marginTop: 8 * s }]}>
                  {fact.source}
                </Text>
              </Animated.View>
            );
          })}
        </View>

        <Animated.View style={[styles.btnWrapper, btnStyle]}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              { paddingVertical: 18 * s, paddingHorizontal: 40 * s },
              pressed && styles.buttonPressed,
            ]}
            onPress={() => {
              if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/onboarding/quote-ritual');
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
  content: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 32 },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontWeight: '700', color: '#5A8BA8', textAlign: 'center' },
  subtitle: { fontWeight: '300', color: '#6B8F9E', textAlign: 'center' },
  cards: { flex: 1, justifyContent: 'center', marginTop: 16 },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(184, 217, 232, 0.3)',
    shadowColor: '#5A8BA8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  stat: { fontWeight: '800', color: '#5A8BA8' },
  description: { fontWeight: '500', color: '#4A7A90', lineHeight: 21 },
  source: { fontWeight: '400', color: '#9BB8C7', fontStyle: 'italic' },
  btnWrapper: { width: '100%', marginTop: 32, marginBottom: 20 },
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
