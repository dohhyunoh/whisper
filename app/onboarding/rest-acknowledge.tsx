import { useAppContext } from '@/context/app-context';
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

// 4 moods × 6 roles = 24 Barnum-effect combinations
const barnumCopy: Record<string, Record<string, { archetype: string; title: string; subtitle: string }>> = {
  Clear: {
    'The Careerist': {
      archetype: 'THE QUIET ARCHITECT',
      title: 'Your ambition is a quiet engine that never stops.',
      subtitle: "Even when your sky is clear, your mind is already planning the next move. You rarely let yourself celebrate — there's always another summit.",
    },
    'The Caretaker': {
      archetype: 'THE GENTLE HARBOR',
      title: 'You pour into everyone before you pour into yourself.',
      subtitle: "Your sky may be clear, but that's because you've been absorbing everyone else's clouds. The calm you project is a gift you rarely give yourself.",
    },
    'The People Pleaser': {
      archetype: 'THE HIDDEN DIPLOMAT',
      title: "Your peace comes at a price only you know.",
      subtitle: "The sky looks clear because you've learned to smooth every edge. But the effort to keep everyone comfortable is quietly exhausting — even on your best days.",
    },
    'The Perfectionist': {
      archetype: 'THE INVISIBLE STANDARD',
      title: "You hold everything to a standard most people can't see.",
      subtitle: "A clear sky doesn't mean a quiet mind. You notice what others miss, and that attention to detail is both your superpower and your heaviest weight.",
    },
    'The Critic': {
      archetype: 'THE SHARP LENS',
      title: 'You see the truth that others avoid.',
      subtitle: "Your clarity comes from a mind that never stops analyzing. Even in calm moments, you're quietly measuring the gap between what is and what could be.",
    },
    'The Strong One': {
      archetype: 'THE SILENT PILLAR',
      title: 'You project a surface of effortless stability that others rely on.',
      subtitle: "While the sky is clear, you take on the role of the anchor. You often feel that you aren't allowed to have 'off' days because so many people have built their own security around your strength.",
    },
  },
  Cloudy: {
    'The Careerist': {
      archetype: 'THE TIRELESS CLIMBER',
      title: 'You keep climbing even when the path disappears into fog.',
      subtitle: "The clouds aren't slowing you down — but they're making every step cost twice the energy. You push through because stopping feels like falling behind.",
    },
    'The Caretaker': {
      archetype: 'THE QUIET SHOULDER',
      title: "You're carrying more than anyone realizes.",
      subtitle: "The clouds gather because you absorb other people's weather. You make sure everyone is warm while quietly shivering yourself.",
    },
    'The People Pleaser': {
      archetype: 'THE SHAPESHIFTER',
      title: "You bend so others don't have to feel uncomfortable.",
      subtitle: "The cloudiness comes from holding too many versions of yourself at once. You've become so good at reading rooms that you've forgotten how to read your own needs.",
    },
    'The Perfectionist': {
      archetype: 'THE ENDLESS EDITOR',
      title: "The haze comes from trying to get everything exactly right.",
      subtitle: "Your clouds aren't confusion — they're the weight of impossibly high standards. You redo, rethink, and refine until there's nothing left for yourself.",
    },
    'The Critic': {
      archetype: 'THE WATCHFUL EYE',
      title: 'Your mind sees every flaw, including your own.',
      subtitle: "The clouds are made of all the things you've noticed but couldn't fix. Your sharp eye is a gift, but it rarely lets you rest.",
    },
    'The Strong One': {
      archetype: 'THE UNSHAKEN WALL',
      title: "You weather other people's storms and call it a cloudy day.",
      subtitle: "Everyone leans on you because you never crack. But the clouds have been building quietly, and you've convinced yourself that asking for help means failing.",
    },
  },
  Stormy: {
    'The Careerist': {
      archetype: 'THE BURNING TORCH',
      title: "The storm hit because you've been running on fumes.",
      subtitle: "You gave everything to the climb and now the mountain is pushing back. The pressure you feel isn't failure — it's the cost of caring deeply about something most people never attempt.",
    },
    'The Caretaker': {
      archetype: 'THE CRACKED VESSEL',
      title: "You've been everyone's shelter, and now the rain is getting in.",
      subtitle: "The storm isn't a sign of weakness — it's what happens when you pour from an empty cup for too long. You deserve the same tenderness you give so freely to others.",
    },
    'The People Pleaser': {
      archetype: 'THE RISING TIDE',
      title: "The storm is everything you've swallowed finally surfacing.",
      subtitle: "You've spent so long making sure everyone else is okay that your own feelings have nowhere left to hide. This isn't breaking — it's your truth demanding to be heard.",
    },
    'The Perfectionist': {
      archetype: 'THE TIGHTENED SPRING',
      title: "The storm comes from holding yourself to an impossible standard.",
      subtitle: "You've been trying to control every outcome, and the weight of that precision has become unbearable. Letting go isn't giving up — it's finally giving yourself room to breathe.",
    },
    'The Critic': {
      archetype: 'THE DOUBLE-EDGED MIND',
      title: "The storm is the sound of a mind that won't stop judging itself.",
      subtitle: "You hold yourself to an account that would break most people. The sharpness that makes you brilliant is also the blade that cuts the deepest when turned inward.",
    },
    'The Strong One': {
      archetype: 'THE FRACTURED FOUNDATION',
      title: 'Even pillars need foundations. Yours is shaking.',
      subtitle: "You've held the weight for so long that the cracks feel like a personal failure. But this storm isn't weakness — it's the sound of someone who has been strong for far too long.",
    },
  },
  Windy: {
    'The Careerist': {
      archetype: 'THE RESTLESS ENGINE',
      title: "Your mind is racing between the life you're building and the one you're living.",
      subtitle: "The wind is the constant pull between ambition and rest. You feel restless because standing still feels like wasted potential — but the motion is wearing you thin.",
    },
    'The Caretaker': {
      archetype: 'THE SCATTERED LIGHT',
      title: "You're pulled in every direction by people who need you.",
      subtitle: "The wind is all the demands that tug at your attention. You want to be present for everyone, but the constant shifting leaves you scattered and quietly depleted.",
    },
    'The People Pleaser': {
      archetype: 'THE WEATHERVANE',
      title: "The wind changes direction every time someone needs you to be different.",
      subtitle: "You shift and adapt so seamlessly that even you've lost track of which direction is truly yours. The restlessness is your real self trying to find solid ground.",
    },
    'The Perfectionist': {
      archetype: 'THE UNFINISHED CANVAS',
      title: "Your mind won't settle because nothing feels quite finished.",
      subtitle: "The wind is the constant urge to adjust, redo, and refine. You chase a version of 'done' that keeps moving just out of reach.",
    },
    'The Critic': {
      archetype: 'THE SPINNING COMPASS',
      title: "Your thoughts won't stop circling what went wrong.",
      subtitle: "The wind is a mind that replays, analyzes, and second-guesses. You see what needs fixing everywhere — and the spinning rarely includes permission to rest.",
    },
    'The Strong One': {
      archetype: 'THE ROOTED OAK',
      title: "You stand firm while everything around you is in motion.",
      subtitle: "The wind is everyone else's chaos that you absorb so they don't have to feel it. You stay grounded for others, but inside, the turbulence is real.",
    },
  },
};

function getInsight(mood: string | null, role: string | null, name: string | null) {
  if (mood && role && barnumCopy[mood]?.[role]) {
    return barnumCopy[mood][role];
  }
  // Fallback
  return {
    archetype: null as string | null,
    title: role
      ? `It takes a lot of energy to be ${role}.`
      : `We are listening${name ? `, ${name}` : ''}.`,
    subtitle: "Now let's talk about how that feels.",
  };
}

export default function RestAcknowledgeScreen() {
  const router = useRouter();
  const { state } = useAppContext();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const s = Math.max(0.85, Math.min(1, Math.min(width / 390, height / 844)));

  const name = state.user?.name || null;
  const role = state.user?.heaviestRole || null;
  const mood = state.user?.weatherMood || null;

  const insight = getInsight(mood, role, name);

  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(15);
  const subtitleOpacity = useSharedValue(0);
  const btnOpacity = useSharedValue(0);

  useEffect(() => {
    posthog.capture(Events.ONBOARDING_SCREEN_VIEWED, { screen_name: 'rest_acknowledge' });
  }, []);

  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
    titleTranslateY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) });
    subtitleOpacity.value = withDelay(800, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
    btnOpacity.value = withDelay(1400, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
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
      <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + 32 * s }]}>
        <View style={styles.center}>
          <Animated.Text style={[styles.title, { fontSize: 24 * s }, titleStyle]}>
            {insight.title}
          </Animated.Text>
          {insight.archetype && (
            <Animated.View style={[{ marginTop: 20 * s, alignItems: 'center' }, subtitleStyle]}>
              <Text style={[styles.archetype, { fontSize: 18 * s }]}>
                {insight.archetype}
              </Text>
              <View style={[styles.archetypeLine, { width: 60 * s, marginTop: 6 * s }]} />
            </Animated.View>
          )}
          <Animated.Text style={[styles.subtitle, { fontSize: 15 * s, marginTop: 16 * s }, subtitleStyle]}>
            {insight.subtitle}
          </Animated.Text>
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
              router.push('/onboarding/primary-emotion');
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
  content: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontWeight: '700', color: '#5A8BA8', textAlign: 'center' },
  archetype: { fontWeight: '800', color: '#3A6B80', letterSpacing: 2, textAlign: 'center' },
  archetypeLine: { height: 2, backgroundColor: '#5A8BA8', borderRadius: 1 },
  subtitle: { fontWeight: '300', color: '#6B8F9E', textAlign: 'center', lineHeight: 22 },
  btnWrapper: { width: '100%', marginBottom: 20 },
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
