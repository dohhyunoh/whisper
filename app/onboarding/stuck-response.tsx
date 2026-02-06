import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppContext } from '@/context/app-context';

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

  return (
    <LinearGradient
      colors={['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0']}
      locations={[0, 0.3, 0.7, 1]}
      style={styles.gradient}
    >
      <View style={styles.content}>
        <View style={styles.top}>
          <Text style={styles.title}>
            What do you do{'\n'}when you feel{'\n'}stuck?
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <Pressable
              key={option}
              style={({ pressed }) => [
                styles.pill,
                selected.includes(option) && styles.pillSelected,
                pressed ? styles.pillPressed : undefined,
              ]}
              onPress={() => setSelected((prev) =>
                prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
              )}
            >
              <Text
                style={[
                  styles.pillText,
                  selected.includes(option) && styles.pillTextSelected,
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
              selected.length === 0 && styles.buttonDisabled,
              pressed && selected.length > 0 ? styles.buttonPressed : undefined,
            ]}
            onPress={() => {
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
            disabled={selected.length === 0}
          >
            <Text
              style={[
                styles.buttonText,
                selected.length === 0 && styles.buttonTextDisabled,
              ]}
            >
              Continue
            </Text>
          </Pressable>

          <Pressable onPress={() => router.push('/onboarding/notification-preview')}>
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
