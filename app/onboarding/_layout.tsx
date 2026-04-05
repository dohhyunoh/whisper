import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* ACT 1: Who are you */}
      <Stack.Screen name="index" />
      <Stack.Screen name="name-input" />
      <Stack.Screen name="gender-selection" />
      <Stack.Screen name="rest-welcome" />
      {/* ACT 2: What's your world */}
      <Stack.Screen name="heart-check" />
      <Stack.Screen name="heart-detail" />
      <Stack.Screen name="faith-base" />
      <Stack.Screen name="faith-detail" />
      <Stack.Screen name="identity-role" />
      <Stack.Screen name="rest-acknowledge" />
      {/* ACT 3: How is that affecting you */}
      <Stack.Screen name="primary-emotion" />
      <Stack.Screen name="emotion-root" />
      <Stack.Screen name="narrative" />
      <Stack.Screen name="rest-compassion" />
      {/* ACT 4: What do you need */}
      <Stack.Screen name="what-helps" />
      <Stack.Screen name="words-shape" />
      <Stack.Screen name="quote-ritual" />
      {/* ACT 5: The bridge */}
      <Stack.Screen name="app-expect" />
      <Stack.Screen name="tone-preference" />
      <Stack.Screen name="science-facts" />
      {/* ACT 6: Delivery */}
      <Stack.Screen name="curating" />
      <Stack.Screen name="notification-preview" />
      <Stack.Screen name="trial-offer" />
      <Stack.Screen name="trial-reminder" />
      <Stack.Screen name="paywall" />
      <Stack.Screen name="widget-promo" />
      <Stack.Screen name="widget-home" />
    </Stack>
  );
}
