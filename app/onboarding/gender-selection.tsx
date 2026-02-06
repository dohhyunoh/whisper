import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppContext } from '@/context/app-context';

const options = ['Female', 'Male', 'Other', 'Prefer not to say'];

export default function GenderSelectionScreen() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <LinearGradient
      colors={['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0']}
      locations={[0, 0.3, 0.7, 1]}
      style={styles.gradient}
    >
      <View style={styles.content}>
        <View style={styles.top}>
          <Text style={styles.title}>I identify as...</Text>
        </View>

        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <Pressable
              key={option}
              style={({ pressed }) => [
                styles.pill,
                selected === option && styles.pillSelected,
                pressed ? styles.pillPressed : undefined,
              ]}
              onPress={() => setSelected(option)}
            >
              <Text
                style={[
                  styles.pillText,
                  selected === option && styles.pillTextSelected,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.bottom}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              !selected && styles.buttonDisabled,
              pressed && selected ? styles.buttonPressed : undefined,
            ]}
            onPress={() => {
              if (selected) {
                dispatch({
                  type: 'SET_USER',
                  payload: {
                    name: state.user?.name ?? '',
                    gender: selected,
                    interests: state.user?.interests ?? [],
                    stuckReason: state.user?.stuckReason ?? '',
                    stuckResponse: state.user?.stuckResponse ?? '',
                  },
                });
                router.push('/onboarding/interests');
              }
            }}
            disabled={!selected}
          >
            <Text
              style={[
                styles.buttonText,
                !selected && styles.buttonTextDisabled,
              ]}
            >
              Continue
            </Text>
          </Pressable>

          <Pressable onPress={() => router.push('/onboarding/interests')}>
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
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 140,
    paddingBottom: 60,
  },
  top: {
    gap: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#5A8BA8',
    lineHeight: 42,
  },
  optionsContainer: {
    gap: 14,
    marginTop: -40,
  },
  pill: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(184, 217, 232, 0.4)',
    paddingVertical: 18,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  pillSelected: {
    backgroundColor: '#5A8BA8',
    borderColor: '#5A8BA8',
  },
  pillPressed: {
    transform: [{ translateY: 1 }],
  },
  pillText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5A8BA8',
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },
  bottom: {
    paddingBottom: 32,
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
    opacity: 0.5,
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
    color: '#9BB8C7',
  },
});
