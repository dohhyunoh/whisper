import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Phase 1: The Hook & Identity */}
      <Stack.Screen name="index" />
      <Stack.Screen name="name-input" />
      <Stack.Screen name="gender-selection" />
      <Stack.Screen name="rest-welcome" />
      {/* Phase 2: The Deep Dive */}
      <Stack.Screen name="heart-check" />
      <Stack.Screen name="heart-detail" />
      <Stack.Screen name="faith-base" />
      <Stack.Screen name="faith-detail" />
      <Stack.Screen name="identity-role" />
      <Stack.Screen name="rest-acknowledge" />
      <Stack.Screen name="primary-emotion" />
      <Stack.Screen name="emotion-root" />
      <Stack.Screen name="narrative" />
      <Stack.Screen name="rest-compassion" />
      {/* Phase 3: Authority & Ritual */}
      <Stack.Screen name="what-helps" />
      <Stack.Screen name="words-shape" />
      <Stack.Screen name="science-facts" />
      <Stack.Screen name="quote-ritual" />
      <Stack.Screen name="app-expect" />
      <Stack.Screen name="tone-preference" />
      {/* Phase 4: The Conversion Bridge */}
      <Stack.Screen name="curating" />
      <Stack.Screen name="sneak-peek" />
      <Stack.Screen name="how-it-works" />
      <Stack.Screen name="notification-preview" />
      {/* Phase 5: Commitment & Anchoring */}
      <Stack.Screen name="trial-offer" />
      <Stack.Screen name="trial-reminder" />
      <Stack.Screen name="paywall" />
      <Stack.Screen name="widget-promo" />
      <Stack.Screen name="widget-home" />
    </Stack>
  );
}
