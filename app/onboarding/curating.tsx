import { useAppContext } from '@/context/app-context';
import { UserData, defaultUserData } from '@/data/types';
import { Events, posthog } from '@/utils/posthog';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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

function deriveInterests(user: UserData): string[] {
  const interests: string[] = [];

  // Faith → religion subcategories
  if (user.faithDetail === 'Christianity') interests.push('religion:christianity');
  if (user.faithDetail === 'Islam') interests.push('religion:islam');
  if (user.faithDetail === 'Hinduism') interests.push('religion:hinduism');
  if (['Judaism', 'General Spirituality'].includes(user.faithDetail)) interests.push('religion:general-spirituality');
  if (['Mindfulness', 'Stoicism'].includes(user.faithDetail)) interests.push('religion:general-spirituality');

  // Emotion → self-love
  if (['Anxious', 'Exhausted'].includes(user.primaryEmotion)) {
    interests.push('self-love:mental-health', 'self-love:rest-recharge');
  }
  if (['Sad', 'Numb'].includes(user.primaryEmotion)) {
    interests.push('self-love:self-worth');
  }

  // Relationships
  if (user.heartStatus === 'An ex-partner') interests.push('relationships:breakups');
  if (['A new partner', 'A long-term partner'].includes(user.heartStatus)) {
    interests.push('relationships:partnership', 'relationships:dating');
  }
  if (user.heartStatus === 'Just me') interests.push('self-love:self-worth');
  if (user.heartStatus === 'My family/friends') {
    interests.push('relationships:family', 'relationships:friendship');
  }

  // Role → empowerment
  if (user.heaviestRole === 'The Careerist') interests.push('empowerment:career');
  if (user.heaviestRole === 'The Critic') interests.push('self-love:self-worth');

  // What helps → map to categories
  if (user.whatHelps === 'Encouragement') interests.push('empowerment:overcoming-obstacles');
  if (user.whatHelps === 'Wisdom') interests.push('mood-boosters:philosophy');
  if (user.whatHelps === 'Compassion') interests.push('self-love:mental-health');
  if (user.whatHelps === 'Understanding') interests.push('self-love:self-worth');
  if (user.whatHelps === 'Stillness') interests.push('mood-boosters:calm');

  // App expectations → weight categories
  if (['A safe space for my thoughts', 'All of the above'].includes(user.appExpect)) {
    interests.push('self-love:rest-recharge');
  }
  if (['A daily reminder to keep going', 'All of the above'].includes(user.appExpect)) {
    interests.push('mood-boosters:daily-motivation', 'mood-boosters:gratitude');
  }
  if (['A companion that understands', 'All of the above'].includes(user.appExpect)) {
    interests.push('self-love:self-worth', 'mood-boosters:calm');
  }

  // Mood boosters (always include)
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

  // Dot animation
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);

  useEffect(() => {
    posthog.capture(Events.ONBOARDING_SCREEN_VIEWED, { screen_name: 'curating' });
  }, []);

  useEffect(() => {
    dot1.value = withRepeat(withSequence(
      withTiming(1, { duration: 400, easing: Easing.ease }),
      withTiming(0.3, { duration: 400, easing: Easing.ease }),
    ), -1);
    dot2.value = withDelay(200, withRepeat(withSequence(
      withTiming(1, { duration: 400, easing: Easing.ease }),
      withTiming(0.3, { duration: 400, easing: Easing.ease }),
    ), -1));
    dot3.value = withDelay(400, withRepeat(withSequence(
      withTiming(1, { duration: 400, easing: Easing.ease }),
      withTiming(0.3, { duration: 400, easing: Easing.ease }),
    ), -1));
  }, []);

  const dot1Style = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: dot3.value }));

  useEffect(() => {
    const user = { ...defaultUserData, ...state.user };
    const interests = deriveInterests(user);

    dispatch({
      type: 'SET_USER',
      payload: { ...user, interests },
    });

    const timeout = setTimeout(() => {
      if (!navigated.current) {
        navigated.current = true;
        router.push('/onboarding/notification-preview');
      }
    }, 2500);

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
          <Text style={[styles.title, { fontSize: 28 * s }]}>
            Preparing your whispers
          </Text>
          <View style={styles.dots}>
            <Animated.View style={[styles.dot, { width: 8 * s, height: 8 * s, borderRadius: 4 * s }, dot1Style]} />
            <Animated.View style={[styles.dot, { width: 8 * s, height: 8 * s, borderRadius: 4 * s }, dot2Style]} />
            <Animated.View style={[styles.dot, { width: 8 * s, height: 8 * s, borderRadius: 4 * s }, dot3Style]} />
          </View>
          <Text style={[styles.subtitle, { fontSize: 15 * s, marginTop: 24 * s }]}>
            Finding the words that were meant for you...
          </Text>
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
  dots: { flexDirection: 'row', gap: 8, marginTop: 16 },
  dot: { backgroundColor: '#5A8BA8' },
  subtitle: { fontWeight: '300', color: '#6B8F9E', textAlign: 'center' },
});
