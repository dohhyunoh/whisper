import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="name-input" />
      <Stack.Screen name="gender-selection" />
      <Stack.Screen name="interests" />
      <Stack.Screen name="feeling-stuck" />
      <Stack.Screen name="stuck-response" />
      <Stack.Screen name="notification-preview" />
    </Stack>
  );
}
