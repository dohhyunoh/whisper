import * as Haptics from 'expo-haptics';
import { OnboardingLayout } from '@/components/onboarding-layout';
import { useAppContext } from '@/context/app-context';
import { defaultUserData } from '@/data/types';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { posthog, Events } from '@/utils/posthog';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const options = [
  'The Careerist',
  'The Caretaker',
  'The People Pleaser',
  'The Perfectionist',
  'The Critic',
  'The Strong One',
];

export default function IdentityRoleScreen() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const [selected, setSelected] = useState<string | null>(null);
  const { width, height } = useWindowDimensions();
  const s = Math.max(0.85, Math.min(1, Math.min(width / 390, height / 844)));

  useEffect(() => {
    posthog.capture(Events.ONBOARDING_SCREEN_VIEWED, { screen_name: 'identity_role' });
  }, []);

  return (
    <OnboardingLayout
      title={"Which resonates most\nwith your soul?"}
      subtitle="The role you play most."
      onContinue={() => {
        if (selected) {
          dispatch({
            type: 'SET_USER',
            payload: { ...defaultUserData, ...state.user, heaviestRole: selected },
          });
          router.push('/onboarding/rest-acknowledge');
        }
      }}
      onSkip={() => router.push('/onboarding/rest-acknowledge')}
      buttonDisabled={!selected}
    >
      <View style={{ gap: 8 * s }}>
        {options.map((option) => {
          const active = selected === option;
          return (
            <Pressable
              key={option}
              style={({ pressed }) => [
                styles.pill,
                { paddingVertical: 11 * s, paddingHorizontal: 18 * s },
                active && styles.pillSelected,
                pressed ? styles.pillPressed : undefined,
              ]}
              onPress={() => {
                if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelected(option);
                posthog.capture(Events.ONBOARDING_CHOICE_MADE, { screen: 'identity_role', choice: option });
              }}
            >
              <Text style={[styles.pillText, { fontSize: 16 * s }, active && styles.pillTextSelected]}>
                {option}
              </Text>
              <View style={[styles.radio, { width: 22 * s, height: 22 * s, borderRadius: 11 * s }, active && styles.radioSelected]}>
                {active && <View style={[styles.radioDot, { width: 10 * s, height: 10 * s, borderRadius: 5 * s }]} />}
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
  radio: { borderWidth: 2, borderColor: 'rgba(90, 139, 168, 0.3)', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: 'rgba(255, 255, 255, 0.6)' },
  radioDot: { backgroundColor: '#FFFFFF' },
});
