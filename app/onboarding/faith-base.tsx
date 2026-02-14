import { OnboardingLayout } from '@/components/onboarding-layout';
import { useAppContext } from '@/context/app-context';
import { defaultUserData } from '@/data/types';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { posthog, Events } from '@/utils/posthog';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const options = [
  { label: 'Up (God / Faith)', value: 'Up' },
  { label: 'In (Self / Mind)', value: 'In' },
  { label: 'Out (Nature / Universe)', value: 'Out' },
  { label: 'Around (Community)', value: 'Around' },
];

export default function FaithBaseScreen() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const [selected, setSelected] = useState<string | null>(null);
  const { width, height } = useWindowDimensions();
  const s = Math.max(0.85, Math.min(1, Math.min(width / 390, height / 844)));

  useEffect(() => {
    posthog.capture(Events.ONBOARDING_SCREEN_VIEWED, { screen_name: 'faith_base' });
  }, []);

  return (
    <OnboardingLayout
      title={"Where do you\nlook for light?"}
      subtitle="Where you find meaning, strength, or peace."
      onContinue={() => {
        if (selected) {
          dispatch({
            type: 'SET_USER',
            payload: { ...defaultUserData, ...state.user, lightSource: selected },
          });
          if (selected === 'Around') {
            router.push('/onboarding/tone-preference');
          } else {
            router.push('/onboarding/faith-detail');
          }
        }
      }}
      onSkip={() => router.push('/onboarding/tone-preference')}
      buttonDisabled={!selected}
    >
      <View style={{ gap: 12 * s }}>
        {options.map((option) => {
          const active = selected === option.value;
          return (
            <Pressable
              key={option.value}
              style={({ pressed }) => [
                styles.pill,
                { paddingVertical: 14 * s, paddingHorizontal: 20 * s },
                active && styles.pillSelected,
                pressed ? styles.pillPressed : undefined,
              ]}
              onPress={() => {
                setSelected(option.value);
                posthog.capture(Events.ONBOARDING_CHOICE_MADE, { screen: 'faith_base', choice: option.value });
              }}
            >
              <Text style={[styles.pillText, { fontSize: 16 * s }, active && styles.pillTextSelected]}>
                {option.label}
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
