import { OnboardingLayout } from '@/components/onboarding-layout';
import { useAppContext } from '@/context/app-context';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const options = [
  'I drift away for a distraction',
  'I sink deeper into my thoughts',
  'I pause and wait for it to pass',
  'I look for a hand to hold',
];

export default function StuckResponseScreen() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const [selected, setSelected] = useState<string[]>([]);
  const { width, height } = useWindowDimensions();
  const s = Math.max(0.85, Math.min(1, Math.min(width / 390, height / 844)));

  return (
    <OnboardingLayout
      title={"What do you do\nwhen you feel\nstuck?"}
      onContinue={() => {
        if (selected.length > 0) {
          dispatch({
            type: 'SET_USER',
            payload: {
              name: state.user?.name ?? '',
              gender: state.user?.gender ?? '',
              interests: state.user?.interests ?? [],
              stuckReason: state.user?.stuckReason ?? '',
              stuckResponse: selected.join(', '),
            },
          });
          router.push('/onboarding/notification-preview');
        }
      }}
      onSkip={() => router.push('/onboarding/notification-preview')}
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
              onPress={() =>
                setSelected((prev) =>
                  prev.includes(option)
                    ? prev.filter((o) => o !== option)
                    : [...prev, option]
                )
              }
            >
              <Text
                style={[
                  styles.pillText,
                  { fontSize: 16 * s },
                  active && styles.pillTextSelected,
                ]}
              >
                {option}
              </Text>
              <View
                style={[
                  styles.checkbox,
                  { width: 22 * s, height: 22 * s, borderRadius: 6 * s },
                  active && styles.checkboxSelected,
                ]}
              >
                {active && (
                  <Text style={[styles.checkmark, { fontSize: 14 * s }]}>
                    ✓
                  </Text>
                )}
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
  pillSelected: {
    backgroundColor: '#5A8BA8',
    borderColor: '#5A8BA8',
  },
  pillPressed: {
    transform: [{ translateY: 1 }],
  },
  pillText: {
    fontWeight: '600',
    color: '#5A8BA8',
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },
  checkbox: {
    borderWidth: 2,
    borderColor: 'rgba(90, 139, 168, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: 'rgba(255, 255, 255, 0.6)',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  checkmark: {
    color: '#FFFFFF',
    fontWeight: '700',
    lineHeight: 16,
  },
});
