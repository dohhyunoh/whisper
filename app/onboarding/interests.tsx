import { useAppContext } from '@/context/app-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const interestOptions = [
  // Main categories
  { label: 'Motivation', value: 'motivation' },
  { label: 'Philosophy', value: 'philosophy' },
  // Health subcategories
  { label: 'Mental Health', value: 'health:mental' },
  { label: 'Physical Health', value: 'health:physical' },
  // Relationships subcategories
  { label: 'Dating', value: 'relationships:dating' },
  { label: 'Breaking Up', value: 'relationships:breaking-up' },
  { label: 'Single', value: 'relationships:single' },
  // Religion subcategories
  { label: 'Christianity', value: 'religion:christianity' },
  { label: 'Islam', value: 'religion:islam' },
  { label: 'Hinduism', value: 'religion:hinduism' },
  { label: 'Buddhism', value: 'religion:buddhism' },
];

export default function InterestsScreen() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const [selected, setSelected] = useState<string[]>([]);

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
    <LinearGradient
      colors={['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0']}
      locations={[0, 0.3, 0.7, 1]}
      style={styles.gradient}
    >
      <View style={styles.content}>
        <View style={styles.top}>
          <Text style={styles.title}>What speaks{'\n'}to you?</Text>
          <Text style={styles.subtitle}>
            These topics will be{'\n'}used to personalize your feed.
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.pillsContainer}
          showsVerticalScrollIndicator={false}
        >
          {interestOptions.map((option) => (
            <Pressable
              key={option.value}
              style={({ pressed }) => [
                styles.pill,
                selected.includes(option.value) && styles.pillSelected,
                pressed ? styles.pillPressed : undefined,
              ]}
              onPress={() => toggleInterest(option.value)}
            >
              <Text
                style={[
                  styles.pillText,
                  selected.includes(option.value) && styles.pillTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.bottom}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              selected.length === 0 && styles.buttonDisabled,
              pressed && selected.length > 0 ? styles.buttonPressed : undefined,
            ]}
            onPress={handleContinue}
            disabled={selected.length === 0}
          >
            <Text style={[styles.buttonText, selected.length === 0 && styles.buttonTextDisabled]}>
              Continue
            </Text>
          </Pressable>

          <Pressable onPress={handleContinue}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 140,
    paddingBottom: 60,
  },
  top: {
    gap: 12,
    marginBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#5A8BA8',
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '300',
    color: '#6B8F9E',
  },
  scrollView: {
    flex: 1,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 20,
  },
  pill: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(184, 217, 232, 0.4)',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  pillSelected: {
    backgroundColor: '#5A8BA8',
    borderColor: '#5A8BA8',
  },
  pillPressed: {
    transform: [{ translateY: 1 }],
  },
  pillText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5A8BA8',
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },
  bottom: {
    paddingTop: 16,
    alignItems: 'center',
    gap: 16,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B8F9E',
  },
  button: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(184, 217, 232, 0.4)',
    paddingVertical: 22,
    paddingHorizontal: 40,
    alignItems: 'center',
    shadowColor: '#5A8BA8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    shadowOpacity: 0,
  },
  buttonPressed: {
    transform: [{ translateY: 2 }],
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5A8BA8',
    letterSpacing: 0.5,
  },
  buttonTextDisabled: {
    color: 'rgba(90, 139, 168, 0.4)',
  },
});
