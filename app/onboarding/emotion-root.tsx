import * as Haptics from 'expo-haptics';
import { OnboardingLayout } from '@/components/onboarding-layout';
import { useAppContext } from '@/context/app-context';
import { defaultUserData } from '@/data/types';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { posthog, Events } from '@/utils/posthog';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const optionsMap: Record<string, string[]> = {
  Anxious: ['Fear of failure', 'Social pressure', 'Unknown future', 'Health', 'Self-image or appearance'],
  Sad: ['Grief / Loss', 'Loneliness', 'Disappointment', 'Hormonal / Body', 'Self-image or appearance'],
  Angry: ['Betrayal', 'Injustice', 'Frustration with self', 'Boundary crossed'],
  Numb: ['Burnout', 'Emotional shutdown', 'Disconnection', 'Apathy'],
  Exhausted: ['Physical fatigue', 'Mental overload', 'Emotional drain', 'Life demands'],
  Hopeful: ['New beginnings', 'Healing progress', 'Faith renewal', 'Self-discovery'],
};

export default function EmotionRootScreen() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const [selected, setSelected] = useState<string[]>([]);
  const { width, height } = useWindowDimensions();
  const s = Math.max(0.85, Math.min(1, Math.min(width / 390, height / 844)));

  const emotion = state.user?.primaryEmotion || 'Anxious';
  const options = optionsMap[emotion] || optionsMap.Anxious;

  useEffect(() => {
    posthog.capture(Events.ONBOARDING_SCREEN_VIEWED, { screen_name: 'emotion_root' });
  }, []);

  const toggle = (option: string) => {
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option],
    );
  };

  return (
    <OnboardingLayout
      title={"Where does it\ncome from?"}
      subtitle="Select all that resonate."
      onContinue={() => {
        if (selected.length > 0) {
          dispatch({
            type: 'SET_USER',
            payload: { ...defaultUserData, ...state.user, emotionRoot: selected.join(', ') },
          });
          router.push('/onboarding/narrative');
        }
      }}
      onSkip={() => router.push('/onboarding/narrative')}
      hideSkip
      buttonDisabled={selected.length === 0}
    >
      <View style={{ gap: 12 * s }}>
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <Pressable
              key={option}
              style={({ pressed }) => [
                styles.pill,
                { paddingVertical: 14 * s, paddingHorizontal: 20 * s },
                active && styles.pillSelected,
                pressed ? styles.pillPressed : undefined,
              ]}
              onPress={() => {
                toggle(option);
                if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                posthog.capture(Events.ONBOARDING_CHOICE_MADE, { screen: 'emotion_root', choice: option });
              }}
            >
              <Text style={[styles.pillText, { fontSize: 16 * s }, active && styles.pillTextSelected]}>
                {option}
              </Text>
              <View style={[styles.checkbox, { width: 22 * s, height: 22 * s, borderRadius: 6 * s }, active && styles.checkboxSelected]}>
                {active && <Text style={[styles.checkmark, { fontSize: 14 * s }]}>✓</Text>}
              </View>
            </Pressable>
          );
        })}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(184, 217, 232, 0.4)',
  },
  pillSelected: { backgroundColor: '#5A8BA8', borderColor: '#5A8BA8' },
  pillPressed: { transform: [{ translateY: 1 }] },
  pillText: { fontWeight: '600', color: '#5A8BA8' },
  pillTextSelected: { color: '#FFFFFF' },
  checkbox: { borderWidth: 2, borderColor: 'rgba(90, 139, 168, 0.3)', alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { borderColor: 'rgba(255, 255, 255, 0.6)', backgroundColor: 'rgba(255, 255, 255, 0.25)' },
  checkmark: { color: '#FFFFFF', fontWeight: '700' },
});
