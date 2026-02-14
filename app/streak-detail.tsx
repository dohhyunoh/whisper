import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppContext } from '@/context/app-context';
import { computeStreak } from '@/utils/streak';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

const MAX_STREAK_DISPLAY = 30;
const RING_SIZE = 180;
const STROKE_WIDTH = 8;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const MOOD_CONFIG = {
  clear: {
    ringColor: '#89CFF0',
    bgTint: 'rgba(137,207,240,0.1)',
    message: 'Your skies are clearing — keep going!',
    emoji: '☀️',
    label: 'Clear',
  },
  cloudy: {
    ringColor: '#A0B4C8',
    bgTint: 'rgba(160,180,200,0.1)',
    message: 'The clouds are lifting, day by day.',
    emoji: '☁️',
    label: 'Cloudy',
  },
  stormy: {
    ringColor: '#8DA399',
    bgTint: 'rgba(141,163,153,0.1)',
    message: 'Even through storms, you showed up.',
    emoji: '⛈️',
    label: 'Stormy',
  },
  windy: {
    ringColor: '#BFA6C9',
    bgTint: 'rgba(191,166,201,0.1)',
    message: 'Finding your calm, one day at a time.',
    emoji: '🌬️',
    label: 'Windy',
  },
} as const;

type MoodKey = keyof typeof MOOD_CONFIG;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function StreakDetail() {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useAppContext();
  const streak = computeStreak(state.streakDates);
  const progress = Math.min(streak / MAX_STREAK_DISPLAY, 1);

  const weatherMood = (state.user?.weatherMood || 'clear') as MoodKey;
  const mood = MOOD_CONFIG[weatherMood] || MOOD_CONFIG.clear;

  // Breathing animation
  const breathScale = useSharedValue(1);
  // Arc animation
  const arcProgress = useSharedValue(0);

  useEffect(() => {
    // Greeting pulse then breathing loop
    breathScale.value = withSequence(
      withTiming(1.08, { duration: 400, easing: Easing.out(Easing.ease) }),
      withTiming(1.0, { duration: 300 }),
      withDelay(
        200,
        withRepeat(
          withSequence(
            withTiming(1.03, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            withTiming(1.0, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
        ),
      ),
    );

    // Arc sweep in
    arcProgress.value = withTiming(progress, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const breathingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
  }));

  const arcOffset = CIRCUMFERENCE * (1 - progress);

  const setMood = (key: MoodKey) => {
    if (!state.user) return;
    dispatch({ type: 'SET_USER', payload: { ...state.user, weatherMood: key } });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: mood.bgTint }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <IconSymbol name="chevron.left" size={24} color={mood.ringColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: mood.ringColor }]}>Your Streak</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {/* Breathing ring with SVG arc */}
        <Animated.View style={breathingStyle}>
          <View style={styles.ringContainer}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              {/* Background track */}
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke="rgba(0,0,0,0.06)"
                strokeWidth={STROKE_WIDTH}
                fill="none"
              />
              {/* Foreground arc */}
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke={mood.ringColor}
                strokeWidth={STROKE_WIDTH}
                fill="none"
                strokeDasharray={`${CIRCUMFERENCE}`}
                strokeDashoffset={arcOffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
              />
            </Svg>
            {/* Center text */}
            <View style={styles.centerText}>
              <Text style={[styles.streakNumber, { color: mood.ringColor }]}>{streak}</Text>
              <Text style={[styles.streakLabel, { color: mood.ringColor, opacity: 0.7 }]}>
                {streak === 1 ? 'day' : 'days'}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Text style={[styles.subtitle, { color: mood.ringColor }]}>
          {streak === 0
            ? 'Open the app daily to start your streak!'
            : streak === 1
              ? 'You started a new streak today!'
              : `You've opened Whisper ${streak} days in a row!`}
        </Text>

        <Text style={[styles.moodMessage, { color: mood.ringColor, opacity: 0.8 }]}>
          {mood.message}
        </Text>
      </View>

      {/* Mood selector */}
      <View style={[styles.moodSelector, { paddingBottom: insets.bottom + 24 }]}>
        {(Object.keys(MOOD_CONFIG) as MoodKey[]).map((key) => {
          const isSelected = key === weatherMood;
          const cfg = MOOD_CONFIG[key];
          return (
            <Pressable
              key={key}
              onPress={() => setMood(key)}
              style={[
                styles.moodBubble,
                {
                  backgroundColor: isSelected ? cfg.ringColor : 'rgba(0,0,0,0.04)',
                  borderColor: isSelected ? cfg.ringColor : 'transparent',
                },
              ]}
            >
              <Text style={styles.moodEmoji}>{cfg.emoji}</Text>
              <Text
                style={[
                  styles.moodBubbleLabel,
                  { color: isSelected ? '#fff' : '#7B9AAA' },
                ]}
              >
                {cfg.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginRight: 32,
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: -40,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakNumber: {
    fontSize: 52,
    fontWeight: '700',
  },
  streakLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: -4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  moodMessage: {
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
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
  },
  moodEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  moodBubbleLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
