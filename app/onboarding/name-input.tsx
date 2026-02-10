import { OnboardingLayout } from '@/components/onboarding-layout';
import { useAppContext } from '@/context/app-context';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TextInput, useWindowDimensions } from 'react-native';

export default function NameInputScreen() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const [name, setName] = useState('');
  const { width, height } = useWindowDimensions();
  const s = Math.max(0.85, Math.min(1, Math.min(width / 390, height / 844)));

  return (
    <OnboardingLayout
      title={"What should\nwe call you?"}
      subtitle="This is how we'll greet you in the app."
      onContinue={() => {
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
      onSkip={() => router.push('/onboarding/gender-selection')}
      buttonDisabled={!name.trim()}
    >
      <TextInput
        style={[
          styles.input,
          {
            paddingVertical: 16 * s,
            paddingHorizontal: 20 * s,
            fontSize: 18 * s,
          },
        ]}
        placeholder="Your name"
        placeholderTextColor="#9BB8C7"
        value={name}
        onChangeText={setName}
        autoFocus
        autoCapitalize="words"
        autoCorrect={false}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(184, 217, 232, 0.4)',
    color: '#3A6B80',
    fontWeight: '500',
  },
});
