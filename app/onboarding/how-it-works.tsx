import { SwipeDemo } from '@/components/swipe-demo';
import { useAppContext } from '@/context/app-context';
import quotesData from '@/data/quotes';
import { Quote } from '@/data/types';
import { setFirstQuote } from '@/utils/first-quote';
import { Events, posthog } from '@/utils/posthog';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const allQuotes: Quote[] = quotesData as Quote[];

type Scene = 'intro' | 'learns' | 'skip' | 'like';
const SCENE_ORDER: Scene[] = ['intro', 'learns', 'skip', 'like'];
const SCENE_MS = 3500;

export default function HowItWorksScreen() {
  const router = useRouter();
  const { state } = useAppContext();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const s = Math.max(0.85, Math.min(1, Math.min(width / 390, height / 844)));

  const interests = state.user?.interests ?? [];

  const demoQuotes = useMemo(() => {
    const short = allQuotes.filter((q) => q.text.length <= 90);
    const matched = interests.length > 0
      ? short.filter((q) => interests.some((interest) => {
          if (interest.includes(':')) {
            const [cat, sub] = interest.split(':');
            return q.category === cat && q.subcategory === sub;
          }
          return q.category === interest;
        }))
      : short;
    const pool = matched.length >= 4 ? matched : short;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  }, [interests]);

  const [sceneIndex, setSceneIndex] = useState(0);
  const [btnReady, setBtnReady] = useState(false);
  const currentScene = SCENE_ORDER[sceneIndex];

  useEffect(() => {
    posthog.capture(Events.ONBOARDING_SCREEN_VIEWED, { screen_name: 'how_it_works' });
    if (demoQuotes[0]) {
      setFirstQuote(`"${demoQuotes[0].text}" — ${demoQuotes[0].author}`);
    }
  }, []);

  useEffect(() => {
    if (sceneIndex >= SCENE_ORDER.length - 1) {
      const t = setTimeout(() => setBtnReady(true), 2200);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setSceneIndex((i) => i + 1), SCENE_MS);
    return () => clearTimeout(t);
  }, [sceneIndex]);

  // Wider than before so QuoteCard's window-based text wrap fits inside.
  const DEMO_WIDTH = Math.min(width - 32, 380);
  const DEMO_HEIGHT = DEMO_WIDTH * 1.35;

  return (
    <LinearGradient
      colors={['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0']}
      locations={[0, 0.3, 0.7, 1]}
      style={styles.gradient}
    >
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 20 * s,
            paddingBottom: insets.bottom + 20 * s,
            paddingHorizontal: 16 * s,
          },
        ]}
      >
        <View style={styles.topRow}>
          <Text style={[styles.title, { fontSize: 22 * s }]}>How Whisper works</Text>
        </View>

        <View style={[styles.stage, { width: DEMO_WIDTH, height: DEMO_HEIGHT }]}>
          {currentScene === 'intro' && (
            <Animated.View
              key="intro"
              style={StyleSheet.absoluteFill}
              entering={FadeIn.duration(500)}
              exiting={FadeOut.duration(300)}
            >
              <IntroScene s={s} />
            </Animated.View>
          )}
          {currentScene === 'learns' && (
            <Animated.View
              key="learns"
              style={StyleSheet.absoluteFill}
              entering={FadeIn.duration(500)}
              exiting={FadeOut.duration(300)}
            >
              <LearnsScene s={s} />
            </Animated.View>
          )}
          {currentScene === 'skip' && (
            <Animated.View
              key="skip"
              style={StyleSheet.absoluteFill}
              entering={FadeIn.duration(500)}
              exiting={FadeOut.duration(300)}
            >
              <SwipeDemo
                quotes={demoQuotes}
                width={DEMO_WIDTH}
                height={DEMO_HEIGHT}
                directions={['skip']}
                loop={false}
              />
            </Animated.View>
          )}
          {currentScene === 'like' && (
            <Animated.View
              key="like"
              style={StyleSheet.absoluteFill}
              entering={FadeIn.duration(500)}
              exiting={FadeOut.duration(300)}
            >
              <SwipeDemo
                quotes={demoQuotes}
                width={DEMO_WIDTH}
                height={DEMO_HEIGHT}
                directions={['like']}
                loop={false}
              />
            </Animated.View>
          )}
        </View>

        <View style={styles.captionStage}>
          <Animated.View
            key={`cap-${currentScene}`}
            entering={SlideInDown.duration(450).easing(Easing.out(Easing.cubic))}
            exiting={SlideOutUp.duration(250)}
            style={styles.captionWrap}
          >
            <Text style={[styles.caption, { fontSize: 16 * s }]}>
              {captionFor(currentScene)}
            </Text>
          </Animated.View>
        </View>

        <View style={[styles.btnSlot, { paddingHorizontal: 16 }]}>
          {btnReady && (
            <Animated.View entering={FadeIn.duration(400)} style={{ width: '100%' }}>
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
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

function captionFor(scene: Scene): string {
  switch (scene) {
    case 'intro': return '10 daily quotes tailored to you';
    case 'learns': return 'The app learns from every swipe';
    case 'skip': return "Swipe left if it doesn't speak to you";
    case 'like': return 'Swipe right if it speaks to you';
  }
}

// ─── Scene 1: Intro ──────────────────────────────────────────────────────────

function IntroScene({ s }: { s: number }) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.learnsCenter]}>
      <Animated.View
        entering={ZoomIn.duration(600).easing(Easing.out(Easing.back(1.3)))}
        style={[
          styles.brainCircle,
          { width: 140 * s, height: 140 * s, borderRadius: 70 * s },
        ]}
      >
        <Ionicons name="albums-outline" size={70 * s} color="#5A8BA8" />
      </Animated.View>

      <Animated.View
        entering={ZoomIn.duration(500).delay(500)}
        style={[styles.badge, { paddingHorizontal: 14 * s, paddingVertical: 6 * s, borderRadius: 999, marginTop: 24 * s, position: 'relative', top: 0, right: 0 }]}
      >
        <Text style={[styles.badgeText, { fontSize: 13 * s }]}>10 daily</Text>
      </Animated.View>
    </View>
  );
}

// ─── Scene 2: Learns ─────────────────────────────────────────────────────────

function LearnsScene({ s }: { s: number }) {
  const pulse = useSharedValue(0);
  const glow = useSharedValue(0.6);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    glow.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 900 }),
          withTiming(0.6, { duration: 900 }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.94 + pulse.value * 0.1 }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.9 + pulse.value * 0.25 }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.3 }],
    opacity: 0.35 - pulse.value * 0.25,
  }));

  return (
    <View style={[StyleSheet.absoluteFill, styles.learnsCenter]}>
      <Animated.View
        style={[
          styles.glowRing,
          { width: 220 * s, height: 220 * s, borderRadius: 110 * s },
          ringStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.glow,
          { width: 180 * s, height: 180 * s, borderRadius: 90 * s },
          glowStyle,
        ]}
      />
      <Animated.View
        entering={ZoomIn.duration(600).easing(Easing.out(Easing.back(1.3)))}
        style={[
          styles.brainCircle,
          { width: 140 * s, height: 140 * s, borderRadius: 70 * s },
          pulseStyle,
        ]}
      >
        <Ionicons name="logo-electron" size={80 * s} color="#5A8BA8" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'space-between' },
  topRow: { alignItems: 'center' },
  title: { fontWeight: '700', color: '#3A6B80', textAlign: 'center' },
  stage: { alignSelf: 'center' },
  captionStage: { height: 50, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  captionWrap: { paddingHorizontal: 16 },
  caption: { fontWeight: '600', color: '#3A6B80', textAlign: 'center' },
  btnSlot: { width: '100%', minHeight: 64, justifyContent: 'flex-end' },
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
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#3A6B80',
  },
  badgeText: { color: '#FFF', fontWeight: '700', letterSpacing: 0.5 },
  miniInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  miniText: {
    fontWeight: '500',
    color: '#3A6B80',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  miniAuthor: {
    fontWeight: '500',
    color: '#6B8F9E',
    textAlign: 'center',
    marginTop: 12,
  },
  learnsCenter: { alignItems: 'center', justifyContent: 'center' },
  brainCircle: {
    backgroundColor: 'rgba(90, 139, 168, 0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(90, 139, 168, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: 'rgba(90, 139, 168, 0.15)',
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(90, 139, 168, 0.5)',
  },
});
