import { useAppContext } from '@/context/app-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function NameInputScreen() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const [name, setName] = useState('');

  return (
    <LinearGradient
      colors={['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0']}
      locations={[0, 0.3, 0.7, 1]}
      style={styles.gradient}
    >
      <View style={styles.content}>
        <View style={styles.top}>
          <Text style={styles.title}>What should{'\n'}we call you?</Text>
          <Text style={styles.subtitle}>
            This is how we'll greet you in the app.
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor="#9BB8C7"
            value={name}
            onChangeText={setName}
            autoFocus
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        <View style={styles.bottom}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              !name.trim() && styles.buttonDisabled,
              pressed && name.trim() ? styles.buttonPressed : undefined,
            ]}
            onPress={() => {
              if (name.trim()) {
                dispatch({
                  type: 'SET_USER',
                  payload: {
                    name: name.trim(),
                    gender: state.user?.gender ?? '',
                    interests: state.user?.interests ?? [],
                    stuckReason: state.user?.stuckReason ?? '',
                    stuckResponse: state.user?.stuckResponse ?? '',
                  },
                });
                router.push('/onboarding/gender-selection');
              }
            }}
            disabled={!name.trim()}
          >
            <Text
              style={[
                styles.buttonText,
                !name.trim() && styles.buttonTextDisabled,
              ]}
            >
              Continue
            </Text>
          </Pressable>

          <Pressable onPress={() => router.push('/onboarding/gender-selection')}>
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
  subtitle: {
    fontSize: 16,
    fontWeight: '300',
    color: '#6B8F9E',
  },
  inputContainer: {
    marginTop: -40,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(184, 217, 232, 0.4)',
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: 20,
    color: '#3A6B80',
    fontWeight: '500',
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
