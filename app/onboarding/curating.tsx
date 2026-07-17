import { useAppContext } from '@/context/app-context';
import { UserData, defaultUserData } from '@/data/types';
import { RELIGION_INTEREST_FOR_FAITH } from '@/utils/interest-tags';
import { prefetchPaywallData } from '@/utils/paywall-prefetch';
import { Events, posthog } from '@/utils/posthog';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function deriveInterests(user: UserData): string[] {
  const interests: string[] = [];

  const religionInterest = RELIGION_INTEREST_FOR_FAITH[user.faithDetail];
  if (religionInterest) interests.push(religionInterest);

  if (user.faithDetail === 'Mindfulness') interests.push('mood-boosters:calm');
  if (user.faithDetail === 'Manifestation') {
    interests.push('mood-boosters:manifestation', 'self-love:self-worth', 'mood-boosters:daily-motivation');
  }
  if (user.faithDetail === 'Stoicism') interests.push('mood-boosters:philosophy');

  if (['Anxious', 'Exhausted'].includes(user.primaryEmotion)) {
    interests.push('self-love:mental-health', 'self-love:rest-recharge');
  }
  if (['Sad', 'Numb'].includes(user.primaryEmotion)) {
    interests.push('self-love:self-worth');
  }

  if (user.emotionRoot?.includes('Self-image')) {
    interests.push('self-love:body-positivity');
  }

  if (user.heartStatus === 'An ex-partner') {
    interests.push('relationships:letting-go');
  }
  if (['A new partner', 'A long-term partner'].includes(user.heartStatus)) {
    interests.push('relationships:partnership', 'relationships:dating');
  }
  if (user.heartStatus === 'Just me') {
    interests.push('self-love:self-worth', 'relationships:attracting-love');
  }
  if (user.heartStatus === 'My family/friends') {
    interests.push('relationships:family', 'relationships:friendship');
  }

  if (user.heaviestRole === 'The Careerist') interests.push('empowerment:career');
  if (user.heaviestRole === 'The Critic') interests.push('self-love:self-worth');

  if (user.whatHelps === 'Encouragement') interests.push('empowerment:overcoming-obstacles');
  if (user.whatHelps === 'Wisdom') interests.push('mood-boosters:philosophy');
  if (user.whatHelps === 'Compassion') interests.push('self-love:mental-health');
  if (user.whatHelps === 'Understanding') interests.push('self-love:self-worth');
  if (user.whatHelps === 'Stillness') interests.push('mood-boosters:calm');

  if (['A safe space for my thoughts', 'All of the above'].includes(user.appExpect)) {
    interests.push('self-love:rest-recharge');
  }
  if (['A daily reminder to keep going', 'All of the above'].includes(user.appExpect)) {
    interests.push('mood-boosters:daily-motivation', 'mood-boosters:gratitude');
  }
  if (['A companion that understands', 'All of the above'].includes(user.appExpect)) {
    interests.push('self-love:self-worth', 'mood-boosters:calm');
  }

  interests.push('mood-boosters:daily-motivation');
  if (user.tonePreference === 'Gentle') interests.push('mood-boosters:calm');
  if (user.tonePreference === 'Playful') interests.push('mood-boosters:philosophy');

  return [...new Set(interests)];
}

export default function CuratingScreen() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const s = Math.max(0.85, Math.min(1, Math.min(width / 390, height / 844)));
  const navigated = useRef(false);

  const user = { ...defaultUserData, ...state.user };
  const emotion = user.primaryEmotion || 'your emotions';
  const tone = user.tonePreference || 'personal';
  const narrative = user.narrative?.split(', ')[0] || 'your story';

  const steps = [
    `Analyzing ${emotion.toLowerCase()}...`,
    `Aligning with your ${tone.toLowerCase()} tone...`,
    `Curating quotes to combat "${narrative}"...`,
    'Building your Whisper...',
  ];

  const [stepIndex, setStepIndex] = useState(0);

  const RING_SIZE = 100 * s;
  const STROKE = 6 * s;
  const RADIUS = (RING_SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const progress = useSharedValue(0);

  useEffect(() => {
    posthog.capture(Events.ONBOARDING_SCREEN_VIEWED, { screen_name: 'curating' });
    // Warm the paywall's RevenueCat lookups behind the progress ring so the
    // paywall screen renders without its blocking spinner.
    prefetchPaywallData();
  }, []);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 4000, easing: Easing.linear });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [steps.length]);

  const textStyle = useAnimatedStyle(() => ({
    opacity: 1,
  }));

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  useEffect(() => {
    const interests = deriveInterests(user);

    dispatch({
      type: 'SET_USER',
      payload: { ...user, interests },
    });

    const timeout = setTimeout(() => {
      if (!navigated.current) {
        navigated.current = true;
        router.push('/onboarding/sneak-peek');
      }
    }, 4500);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <LinearGradient
      colors={['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0']}
      locations={[0, 0.3, 0.7, 1]}
      style={styles.gradient}
    >
      <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.center}>
          <Text style={[styles.title, { fontSize: 28 * s, marginBottom: 32 * s }]}>
            Preparing your whispers
          </Text>

          <View style={{ width: RING_SIZE, height: RING_SIZE, marginBottom: 32 * s }}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke="rgba(90, 139, 168, 0.15)"
                strokeWidth={STROKE}
                fill="none"
              />
              <AnimatedCircle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke="#5A8BA8"
                strokeWidth={STROKE}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                animatedProps={ringProps}
                rotation="-90"
                origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
              />
            </Svg>
          </View>

          <Animated.Text style={[styles.subtitle, { fontSize: 15 * s }, textStyle]}>
            {steps[stepIndex]}
          </Animated.Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  center: { alignItems: 'center', paddingHorizontal: 40 },
  title: { fontWeight: '700', color: '#5A8BA8', textAlign: 'center' },
  subtitle: { fontWeight: '300', color: '#6B8F9E', textAlign: 'center' },
});
