import { ArgoEmotionView } from '@/components/argo-emotion';
import { useAppContext } from '@/context/app-context';
import { MOODS } from '@/data/moods';
import { defaultUserData } from '@/data/types';
import { Events, posthog } from '@/utils/posthog';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MOOD_ICON_SIZE = 22;
const moods = MOODS;

function getScale(screenW: number, screenH: number) {
  return Math.max(0.85, Math.min(1, Math.min(screenW / 390, screenH / 844)));
}

function SparkleParticle({
  style,
  size,
  delay,
  duration,
}: {
  style: object;
  size: number;
  delay: number;
  duration: number;
}) {
  const opacity = useSharedValue(0.1);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.6, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute' as const,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#FFFFFF',
        },
        style,
        animatedStyle,
      ]}
    />
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const s = useMemo(() => getScale(screenW, screenH), [screenW, screenH]);

  const heroSize = 280 * s;

  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const displayIndex = selectedIndex >= 0 ? selectedIndex : 0; // default to Clear visually
  const displayMood = moods[displayIndex];

  useEffect(() => {
    posthog.capture(Events.ONBOARDING_SCREEN_VIEWED, { screen_name: 'welcome' });
  }, []);

  // Hero pop animation when selection changes
  const heroScale = useSharedValue(1);
  const heroBreathing = useSharedValue(0);

  useEffect(() => {
    heroBreathing.value = withRepeat(
      withTiming(1, { duration: 3500, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, []);

  useEffect(() => {
    if (selectedIndex < 0) return;
    heroScale.value = withTiming(0.85, { duration: 120, easing: Easing.out(Easing.ease) });
    heroScale.value = withDelay(
      120,
      withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) }),
    );
  }, [selectedIndex]);

  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: heroScale.value * (1 + heroBreathing.value * 0.025) },
    ],
  }));

  // Label / message: re-fade on each change (including default Clear)
  const labelOpacity = useSharedValue(0);
  const labelTranslateY = useSharedValue(8);
  useEffect(() => {
    labelOpacity.value = withTiming(1, { duration: 500 });
    labelTranslateY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) });
  }, [displayIndex]);
  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateY: labelTranslateY.value }],
  }));

  // Button enabled when a mood is selected
  const btnOpacity = useSharedValue(0.4);
  useEffect(() => {
    btnOpacity.value = withTiming(selectedIndex >= 0 ? 1 : 0.4, { duration: 300 });
  }, [selectedIndex]);
  const btnStyle = useAnimatedStyle(() => ({ opacity: btnOpacity.value }));

  const handleSelect = (index: number) => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedIndex(index);
    posthog.capture(Events.ONBOARDING_CHOICE_MADE, { screen: 'welcome', choice: moods[index].label });
  };

  const handleContinue = () => {
    if (selectedIndex < 0) return;
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const mood = moods[selectedIndex];
    dispatch({
      type: 'SET_USER',
      payload: { ...defaultUserData, ...state.user, weatherMood: mood.label },
    });
    posthog.capture(Events.ONBOARDING_STARTED);
    router.push('/onboarding/name-input');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <SparkleParticle style={{ top: '15%', left: '20%' }} size={8} delay={0} duration={3000} />
        <SparkleParticle style={{ top: '25%', right: '25%' }} size={6} delay={1000} duration={4000} />
        <SparkleParticle style={{ top: '60%', left: '15%' }} size={4} delay={2000} duration={3500} />
        <SparkleParticle style={{ top: '70%', right: '30%' }} size={6} delay={500} duration={4000} />
        <SparkleParticle style={{ top: '40%', right: '15%' }} size={4} delay={1500} duration={3000} />
      </View>

      <View style={[styles.questionContainer, { top: insets.top + 60 * s }]} pointerEvents="none">
        <Text style={[styles.questionText, { fontSize: 24 * s }]}>How does your mind feel?</Text>
      </View>

      {/* Hero Argo */}
      <View style={styles.heroStage} pointerEvents="none">
        <Animated.View
          style={[
            {
              width: heroSize,
              height: heroSize,
              alignItems: 'center',
              justifyContent: 'center',
            },
            heroStyle,
          ]}
        >
          <ArgoEmotionView
            emotion={displayMood.emotion}
            style={{
              width: heroSize,
              height: heroSize,
              backgroundColor: 'transparent',
            }}
          />

        </Animated.View>

        {/* Selected label + message */}
        <Animated.View style={[styles.labelBlock, labelStyle]} pointerEvents="none">
          <Text style={[styles.selectedLabel, { fontSize: 26 * s, color: displayMood.color }]}>
            {displayMood.label}
          </Text>
          <Text style={[styles.selectedMessage, { fontSize: 15 * s, marginTop: 6 * s }]}>
            {displayMood.message}
          </Text>
        </Animated.View>
      </View>

      {/* Bottom controls: pills + button */}
      <View style={[styles.bottomBlock, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.moodSelector}>
          {moods.map((mood, i) => {
            const isSelected = selectedIndex === i;
            return (
              <Pressable
                key={mood.id}
                onPress={() => handleSelect(i)}
                style={[
                  styles.moodBubble,
                  {
                    backgroundColor: isSelected ? mood.color : 'rgba(255,255,255,0.6)',
                    borderColor: isSelected ? mood.color : 'transparent',
                  },
                ]}
              >
                <View style={styles.moodIcon}>
                  {mood.icon(MOOD_ICON_SIZE, isSelected ? '#fff' : mood.color)}
                </View>
                <Text
                  style={[
                    styles.moodBubbleLabel,
                    { color: isSelected ? '#fff' : '#7B9AAA' },
                  ]}
                >
                  {mood.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Animated.View style={[{ marginTop: 24, paddingHorizontal: 32 }, btnStyle]}>
          <Pressable
            disabled={selectedIndex < 0}
            style={({ pressed }) => [
              styles.button,
              { paddingVertical: 18 * s, paddingHorizontal: 40 * s },
              pressed && selectedIndex >= 0 && styles.buttonPressed,
            ]}
            onPress={handleContinue}
          >
            <Text style={[styles.buttonText, { fontSize: 18 * s }]}>Get Started</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  questionContainer: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  questionText: { fontWeight: '300', color: '#5A8BA8' },
  heroStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelBlock: {
    marginTop: 12,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  selectedLabel: { fontWeight: '700', letterSpacing: 0.5 },
  selectedMessage: { fontWeight: '300', color: '#6B8F9E', textAlign: 'center' },
  bottomBlock: {
    paddingTop: 16,
  },
  moodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  moodBubble: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    minWidth: 72,
  },
  moodIcon: {
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodBubbleLabel: {
    fontSize: 11,
    fontWeight: '600',
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
  buttonPressed: { transform: [{ translateY: 2 }] },
  buttonText: { fontWeight: '700', color: '#5A8BA8', letterSpacing: 0.5 },
});
