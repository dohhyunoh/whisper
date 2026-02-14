import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="weather-source" />
      <Stack.Screen name="name-input" />
      <Stack.Screen name="gender-selection" />
      <Stack.Screen name="primary-emotion" />
      <Stack.Screen name="emotion-root" />
      <Stack.Screen name="body-check" />
      <Stack.Screen name="narrative" />
      <Stack.Screen name="heart-check" />
      <Stack.Screen name="heart-detail" />
      <Stack.Screen name="identity-role" />
      <Stack.Screen name="faith-base" />
      <Stack.Screen name="faith-detail" />
      <Stack.Screen name="tone-preference" />
      <Stack.Screen name="curating" />
      <Stack.Screen name="notification-preview" />
      <Stack.Screen name="paywall" />
    </Stack>
  );
}
