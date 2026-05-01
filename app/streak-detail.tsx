import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppContext } from '@/context/app-context';
import { findMoodByLabel, MOODS } from '@/data/moods';
import { computeMoodStreak, computeStreak, getTodayDateString } from '@/utils/streak';
import { RiveFileFactory, RiveView } from '@rive-app/react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

type RiveFile = Awaited<ReturnType<typeof RiveFileFactory.fromSource>>;

const MAX_STREAK_DISPLAY = 30;
const RING_SIZE = 170;
const STROKE_WIDTH = 10;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const RIVE_SIZE = 180;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MOOD_SUPPORT: Record<string, { headline: string; encouragement: string }> = {
  clear: {
    headline: "It's a bright one. Soak it in.",
    encouragement: 'Your skies are clearing — keep going!',
  },
  cloudy: {
    headline: "It's okay to have cloudy days. You're still showing up.",
    encouragement: 'The clouds are lifting, day by day.',
  },
  stormy: {
    headline: "It's okay to feel the storm. You're standing strong.",
    encouragement: 'Even through storms, you showed up.',
  },
  windy: {
    headline: "It's okay to feel restless. You're finding your center.",
    encouragement: 'Finding your calm, one day at a time.',
  },
};

function getCurrentWeekDates(): string[] {
  // Returns 7 ISO dates from Monday → Sunday for the current week (local time).
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const day = now.getDay(); // 0=Sun..6=Sat
  const offsetToMonday = (day + 6) % 7; // Mon=0, Sun=6
  const monday = new Date(now);
  monday.setDate(now.getDate() - offsetToMonday);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
}

export default function StreakDetail() {
  const insets = useSafeAreaInsets();
  const { state } = useAppContext();
  const streak = computeStreak(state.streakDates);
  const progress = Math.min(streak / MAX_STREAK_DISPLAY, 1);

  const currentMood = findMoodByLabel(state.user?.weatherMood) ?? MOODS[0];
  const ringColor = currentMood.color;
  const support = MOOD_SUPPORT[currentMood.id] ?? MOOD_SUPPORT.clear;

  const weekDates = useMemo(() => getCurrentWeekDates(), []);
  const today = getTodayDateString();
  const streakSet = useMemo(() => new Set(state.streakDates), [state.streakDates]);

  const moodStreak = useMemo(() => {
    const computed = computeMoodStreak(state.moodHistory);
    if (computed) return computed;
    if (currentMood) return { mood: currentMood.id, count: 1 };
    return null;
  }, [state.moodHistory, currentMood]);
  const moodStreakInfo = useMemo(() => {
    if (!moodStreak) return null;
    const m = MOODS.find((x) => x.id === moodStreak.mood);
    if (!m) return null;
    return { mood: m, count: moodStreak.count };
  }, [moodStreak]);

  const [riveFile, setRiveFile] = useState<RiveFile | null>(null);
  useEffect(() => {
    let cancelled = false;
    RiveFileFactory.fromSource(currentMood.rive, undefined)
      .then((f) => {
        if (!cancelled) setRiveFile(f);
      })
      .catch((err) => console.warn('Failed to load Rive file for streak-detail:', err));
    return () => {
      cancelled = true;
    };
  }, [currentMood.id]);

  const breathScale = useSharedValue(1);
  const arcProgress = useSharedValue(0);

  useEffect(() => {
    breathScale.value = withSequence(
      withTiming(1.06, { duration: 400, easing: Easing.out(Easing.ease) }),
      withTiming(1.0, { duration: 300 }),
      withDelay(
        200,
        withRepeat(
          withSequence(
            withTiming(1.025, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            withTiming(1.0, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
        ),
      ),
    );
    arcProgress.value = withTiming(progress, { duration: 1000, easing: Easing.out(Easing.cubic) });
  }, [progress]);

  const breathingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
  }));

  const arcOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <LinearGradient
      colors={['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0']}
      locations={[0, 0.3, 0.7, 1]}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
          hitSlop={12}
        >
          <IconSymbol name="chevron.left" size={24} color={ringColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: ringColor }]}>Your Streak</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Mascot section */}
        <View style={styles.mascotSection}>
          <View style={styles.riveWrapper}>
            {riveFile && (
              <RiveView
                key={currentMood.id}
                file={riveFile}
                autoPlay
                style={{
                  width: RIVE_SIZE,
                  height: RIVE_SIZE,
                  backgroundColor: 'transparent',
                  transform: [{ translateY: currentMood.id === 'stormy' ? 14 : 0 }],
                }}
              />
            )}
          </View>
        </View>

        {/* Today's mood card */}
        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>TODAY YOU'RE FEELING</Text>
          <View style={styles.cardRow}>
            <View style={styles.cardTextCol}>
              <Text style={[styles.cardTitle, { color: ringColor }]}>{currentMood.label}</Text>
              <Text style={styles.cardBody}>{support.headline}</Text>
            </View>
            <View style={styles.cardIconWrap}>
              {currentMood.icon(56, ringColor)}
            </View>
          </View>
        </View>

        {/* Current streak ring card */}
        <View style={styles.card}>
          <Text style={[styles.cardEyebrow, { textAlign: 'center' }]}>CURRENT STREAK</Text>

          <View style={styles.ringRow}>
            <Animated.View style={breathingStyle}>
              <View style={styles.ringContainer}>
                <Svg width={RING_SIZE} height={RING_SIZE}>
                  <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RADIUS}
                    stroke="rgba(122, 154, 170, 0.18)"
                    strokeWidth={STROKE_WIDTH}
                    fill="none"
                  />
                  <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RADIUS}
                    stroke={ringColor}
                    strokeWidth={STROKE_WIDTH}
                    fill="none"
                    strokeDasharray={`${CIRCUMFERENCE}`}
                    strokeDashoffset={arcOffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                  />
                </Svg>
                <View style={styles.centerText}>
                  <Text style={styles.streakNumber}>{streak}</Text>
                  <Text style={styles.streakLabel}>{streak === 1 ? 'day' : 'days'}</Text>
                </View>
              </View>
            </Animated.View>
          </View>
        </View>

        {/* Week progress card */}
        <View style={styles.card}>
          <Text style={[styles.cardEyebrow, { textAlign: 'center' }]}>YOUR PROGRESS</Text>
          <View style={styles.weekRow}>
            {weekDates.map((dateStr, i) => {
              const filled = streakSet.has(dateStr);
              const isToday = dateStr === today;
              return (
                <React.Fragment key={dateStr}>
                  <View style={styles.dayCol}>
                    <View
                      style={[
                        styles.dayDot,
                        filled
                          ? { backgroundColor: ringColor, borderColor: ringColor }
                          : isToday
                            ? { backgroundColor: 'transparent', borderColor: ringColor }
                            : { backgroundColor: 'transparent', borderColor: 'rgba(122, 154, 170, 0.4)' },
                      ]}
                    >
                      {filled && <IconSymbol name="checkmark" size={14} color="#FFF" />}
                    </View>
                    <Text style={[styles.dayLabel, isToday && { color: ringColor, fontWeight: '600' }]}>
                      {WEEKDAYS[i]}
                    </Text>
                  </View>
                  {i < WEEKDAYS.length - 1 && <View style={styles.dayConnector} />}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* Mood-streak / encouragement card */}
        {moodStreakInfo && (
          <View style={styles.bottomCard}>
            <View style={[styles.bottomCardIcon, { backgroundColor: `${moodStreakInfo.mood.color}33`, borderColor: moodStreakInfo.mood.color }]}>
              <IconSymbol name="star.fill" size={20} color={moodStreakInfo.mood.color} />
            </View>
            <View style={styles.bottomCardText}>
              <Text style={styles.bottomCardTitle}>
                {`${moodStreakInfo.mood.label} for ${moodStreakInfo.count} ${moodStreakInfo.count === 1 ? 'day' : 'days'}`}
              </Text>
              <Text style={styles.bottomCardSub}>{support.encouragement}</Text>
            </View>
            <View style={styles.bottomCardAccent}>
              {moodStreakInfo.mood.icon(36, moodStreakInfo.mood.color)}
            </View>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 1,
  },
  backButton: { padding: 4, zIndex: 1 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600', textAlign: 'center' },
  headerSpacer: { width: 32 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  mascotSection: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  riveWrapper: {
    width: RIVE_SIZE,
    height: RIVE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#5A8BA8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  cardEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7B9AAA',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardTextCol: { flex: 1, paddingRight: 12 },
  cardTitle: { fontSize: 28, fontWeight: '700', marginBottom: 6 },
  cardBody: { fontSize: 14, color: '#6B8F9E', lineHeight: 20 },
  cardIconWrap: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  ringRow: {
    height: RING_SIZE + 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  streakNumber: { fontSize: 48, fontWeight: '700', color: '#2C3E50' },
  streakLabel: { fontSize: 14, fontWeight: '500', color: '#7B9AAA', marginTop: -2 },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  dayCol: { alignItems: 'center', width: 32 },
  dayDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: { fontSize: 11, color: '#7B9AAA', marginTop: 6 },
  dayConnector: {
    flex: 1,
    height: 0,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(122, 154, 170, 0.35)',
    marginHorizontal: 2,
    marginBottom: 18,
  },
  bottomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  bottomCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  bottomCardText: { flex: 1 },
  bottomCardTitle: { fontSize: 15, fontWeight: '700', color: '#2C3E50' },
  bottomCardSub: { fontSize: 13, color: '#7B9AAA', marginTop: 2 },
  bottomCardAccent: { width: 40, alignItems: 'center', justifyContent: 'center' },
});
