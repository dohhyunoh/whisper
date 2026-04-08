import * as Haptics from 'expo-haptics';
import { OnboardingLayout } from '@/components/onboarding-layout';
import { useAppContext } from '@/context/app-context';
import { defaultUserData } from '@/data/types';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { posthog, Events } from '@/utils/posthog';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const options = [
  "I'm not good enough",
  "I'll always be alone",
  "It's too late for me",
  "I can't handle this",
  "Nobody understands me",
  "I have to do it all myself",
  "I need to keep moving forward",
  "Everything is going to work out",
];

export default function NarrativeScreen() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const [selected, setSelected] = useState<string[]>([]);
  const { width, height } = useWindowDimensions();
  const s = Math.max(0.85, Math.min(1, Math.min(width / 390, height / 844)));

  useEffect(() => {
    posthog.capture(Events.ONBOARDING_SCREEN_VIEWED, { screen_name: 'narrative' });
  }, []);

  const toggle = (option: string) => {
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option],
    );
  };

  return (
    <OnboardingLayout
      title={"What is the story\nplaying on loop?"}
      subtitle="Select all that whisper when it's quiet."
      onContinue={() => {
        if (selected.length > 0) {
          dispatch({
            type: 'SET_USER',
            payload: { ...defaultUserData, ...state.user, narrative: selected.join(', ') },
          });
          router.push('/onboarding/rest-compassion');
        }
      }}
      onSkip={() => router.push('/onboarding/rest-compassion')}
      hideSkip
      buttonDisabled={selected.length === 0}
    >
      <View style={styles.wrap}>
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <Pressable
              key={option}
              style={({ pressed }) => [
                styles.pill,
                { paddingVertical: 12 * s, paddingHorizontal: 20 * s },
                active && styles.pillSelected,
                pressed ? styles.pillPressed : undefined,
              ]}
              onPress={() => {
                toggle(option);
                if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                posthog.capture(Events.ONBOARDING_CHOICE_MADE, { screen: 'narrative', choice: option });
              }}
            >
              <Text style={[styles.pillText, { fontSize: 14 * s }, active && styles.pillTextSelected]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(184, 217, 232, 0.4)',
  },
  pillSelected: { backgroundColor: '#5A8BA8', borderColor: '#5A8BA8' },
  pillPressed: { transform: [{ translateY: 1 }] },
  pillText: { fontWeight: '600', color: '#5A8BA8' },
  pillTextSelected: { color: '#FFFFFF' },
});
