import { useAppContext } from '@/context/app-context';
import { MOODS } from '@/data/moods';
import { Events, posthog } from '@/utils/posthog';
import { getTodayDateString } from '@/utils/streak';
import { RiveFileFactory, RiveView } from '@rive-app/react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
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

type RiveFile = Awaited<ReturnType<typeof RiveFileFactory.fromSource>>;

const MOOD_ICON_SIZE = 22;

function getScale(screenW: number, screenH: number) {
  return Math.max(0.85, Math.min(1, Math.min(screenW / 390, screenH / 844)));
}

export default function DailyCheckInScreen() {
  const { state } = useAppContext();
  // Self-guard: never ask twice on the same day, regardless of how this
  // screen was reached (launch gate, widget deep link, future routes).
  // Captured at mount so answering (which updates moodHistory) doesn't race
  // this Redirect against the handler's own router.replace.
  const [alreadyCheckedIn] = useState(() =>
    state.moodHistory.some((e) => e.date === getTodayDateString()),
  );
  if (alreadyCheckedIn) {
    return <Redirect href="/daily-deck" />;
  }
  return <DailyCheckInContent />;
}

function DailyCheckInContent() {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useAppContext();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const s = useMemo(() => getScale(screenW, screenH), [screenW, screenH]);

  const heroSize = 280 * s;

  const [riveFiles, setRiveFiles] = useState<(RiveFile | null)[]>(() => MOODS.map(() => null));
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [committing, setCommitting] = useState(false);

  const displayIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const displayMood = MOODS[displayIndex];
  const heroRive = riveFiles[displayIndex];

  const userName = state.user?.name?.trim();
  const greeting = userName ? `Good to see you, ${userName}` : 'Good to see you';

  useEffect(() => {
    posthog.capture(Events.ONBOARDING_SCREEN_VIEWED, { screen_name: 'daily_check_in' });
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      MOODS.map((m) =>
        RiveFileFactory.fromSource(m.rive, undefined).catch((err) => {
          console.warn(`Failed to load Rive file for ${m.id}:`, err);
          return null;
        }),
      ),
    ).then((files) => {
      if (!cancelled) setRiveFiles(files);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
    transform: [{ scale: heroScale.value * (1 + heroBreathing.value * 0.025) }],
  }));

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

  const handleSelect = (index: number) => {
    if (committing) return;
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedIndex(index);
  };

  const handleConfirm = () => {
    if (committing || selectedIndex < 0) return;
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setCommitting(true);

    const mood = MOODS[selectedIndex];
    posthog.capture(Events.ONBOARDING_CHOICE_MADE, { screen: 'daily_check_in', choice: mood.label });
    dispatch({
      type: 'RECORD_DAILY_CHECKIN',
      payload: { date: getTodayDateString(), moodId: mood.id, moodLabel: mood.label },
    });

    // Into the letter exchange (optional, skippable → deck). The gate lives at
    // navigation level: respond → compose → deck; skip → deck.
    router.replace('/exchange/respond');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.headerContainer, { top: insets.top + 40 * s }]} pointerEvents="none">
        <Text style={[styles.greetingText, { fontSize: 14 * s }]}>{greeting}</Text>
        <Text style={[styles.questionText, { fontSize: 24 * s, marginTop: 6 * s }]}>How does your mind feel today?</Text>
      </View>

      <View style={styles.heroStage} pointerEvents="none">
        <Animated.View
          style={[
            { width: heroSize, height: heroSize, alignItems: 'center', justifyContent: 'center' },
            heroStyle,
          ]}
        >
          {heroRive && (
            <RiveView
              key={displayMood.id}
              file={heroRive}
              autoPlay
              style={{
                width: heroSize,
                height: heroSize,
                backgroundColor: 'transparent',
                transform: [{ translateY: displayMood.id === 'stormy' ? 20 * s : 0 }],
              }}
            />
          )}
        </Animated.View>

        <Animated.View style={[styles.labelBlock, labelStyle]} pointerEvents="none">
          <Text style={[styles.selectedLabel, { fontSize: 26 * s, color: displayMood.color }]}>
            {selectedIndex >= 0 ? displayMood.label : 'Pick what feels true'}
          </Text>
          <Text style={[styles.selectedMessage, { fontSize: 15 * s, marginTop: 6 * s }]}>
            {selectedIndex >= 0 ? displayMood.message : 'Choose the one that feels closest right now.'}
          </Text>
        </Animated.View>
      </View>

      <View style={[styles.bottomBlock, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.moodSelector}>
          {MOODS.map((mood, i) => {
            const isSelected = selectedIndex === i;
            return (
              <Pressable
                key={mood.id}
                onPress={() => handleSelect(i)}
                disabled={committing}
                style={[
                  styles.moodBubble,
                  {
                    backgroundColor: isSelected ? mood.color : 'rgba(255,255,255,0.6)',
                    borderColor: isSelected ? mood.color : 'transparent',
                    opacity: committing && !isSelected ? 0.4 : 1,
                  },
                ]}
              >
                <View style={styles.moodIcon}>
                  {mood.icon(MOOD_ICON_SIZE, isSelected ? '#fff' : mood.color)}
                </View>
                <Text style={[styles.moodBubbleLabel, { color: isSelected ? '#fff' : '#7B9AAA' }]}>
                  {mood.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: 20, paddingHorizontal: 32 }}>
          <Pressable
            disabled={selectedIndex < 0 || committing}
            onPress={handleConfirm}
            style={({ pressed }) => [
              styles.button,
              {
                paddingVertical: 18 * s,
                paddingHorizontal: 40 * s,
                opacity: selectedIndex < 0 ? 0.4 : 1,
              },
              pressed && selectedIndex >= 0 && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.buttonText, { fontSize: 18 * s }]}>Confirm</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 24 },
  greetingText: { color: '#7B9AAA', fontWeight: '500', letterSpacing: 0.4 },
  questionText: { fontWeight: '300', color: '#5A8BA8', textAlign: 'center' },
  heroStage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  labelBlock: { marginTop: 12, alignItems: 'center', paddingHorizontal: 40 },
  selectedLabel: { fontWeight: '700', letterSpacing: 0.5, textAlign: 'center' },
  selectedMessage: { fontWeight: '300', color: '#6B8F9E', textAlign: 'center' },
  bottomBlock: { paddingTop: 16 },
  moodSelector: { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingHorizontal: 24 },
  moodBubble: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    minWidth: 72,
  },
  moodIcon: { marginBottom: 4, alignItems: 'center', justifyContent: 'center' },
  moodBubbleLabel: { fontSize: 11, fontWeight: '600' },
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
