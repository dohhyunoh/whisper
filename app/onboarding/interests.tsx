import { OnboardingLayout } from '@/components/onboarding-layout';
import { useAppContext } from '@/context/app-context';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions } from 'react-native';

const interestOptions = [
  { label: 'Motivation', value: 'motivation' },
  { label: 'Philosophy', value: 'philosophy' },
  { label: 'Mental Health', value: 'health:mental' },
  { label: 'Physical Health', value: 'health:physical' },
  { label: 'Dating', value: 'relationships:dating' },
  { label: 'Breaking Up', value: 'relationships:breaking-up' },
  { label: 'Single', value: 'relationships:single' },
  { label: 'Christianity', value: 'religion:christianity' },
  { label: 'Islam', value: 'religion:islam' },
  { label: 'Hinduism', value: 'religion:hinduism' },
  { label: 'Buddhism', value: 'religion:buddhism' },
];

export default function InterestsScreen() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const [selected, setSelected] = useState<string[]>([]);
  const { width, height } = useWindowDimensions();
  const s = Math.max(0.85, Math.min(1, Math.min(width / 390, height / 844)));

  const toggleInterest = (value: string) => {
    setSelected((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const handleContinue = () => {
    dispatch({
      type: 'SET_USER',
      payload: {
        name: state.user?.name ?? '',
        gender: state.user?.gender ?? '',
        interests: selected,
        stuckReason: state.user?.stuckReason ?? '',
        stuckResponse: state.user?.stuckResponse ?? '',
      },
    });
    router.push('/onboarding/feeling-stuck');
  };

  return (
    <OnboardingLayout
      title={"What speaks\nto you?"}
      subtitle={"These topics will be\nused to personalize your feed."}
      onContinue={handleContinue}
      onSkip={handleContinue}
      buttonDisabled={selected.length === 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', rowGap: 12 * s, columnGap: 10 * s, paddingBottom: 20 * s, flexGrow: 1, alignContent: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        {interestOptions.map((option) => (
          <Pressable
            key={option.value}
            style={({ pressed }) => [
              styles.pill,
              { paddingVertical: 10 * s, paddingHorizontal: 18 * s },
              selected.includes(option.value) && styles.pillSelected,
              pressed ? styles.pillPressed : undefined,
            ]}
            onPress={() => toggleInterest(option.value)}
          >
            <Text
              style={[
                styles.pillText,
                { fontSize: 15 * s },
                selected.includes(option.value) && styles.pillTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  pill: {
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
});
