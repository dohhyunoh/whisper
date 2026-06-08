import { useAppContext } from '@/context/app-context';
import { hasPremiumAccess } from '@/utils/premium-check';
import { hasSeenV2Migration } from '@/utils/migration';
import { getTodayDateString } from '@/utils/streak';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { state } = useAppContext();

  if (!state.hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F0' }}>
        <ActivityIndicator color="#5A8BA8" />
      </View>
    );
  }

  if (!state.onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  // Existing user — show v2 migration screen once.
  if (!hasSeenV2Migration()) {
    return hasPremiumAccess(state.premium.status, state.premium.trialEndsAt)
      ? <Redirect href="/paid-announcement" />
      : <Redirect href="/freemium-upgrade" />;
  }

  // Premium-only: no subscription and no active trial → context-aware lock screen.
  // A past trialEndsAt means a founding-member gift that lapsed; otherwise a new
  // user who hasn't subscribed. Each screen leads to the paywall (with a chevron
  // back to it), so the purchase flow is dismissible per App Store guidelines.
  if (!hasPremiumAccess(state.premium.status, state.premium.trialEndsAt)) {
    return state.premium.trialEndsAt != null
      ? <Redirect href="/gift-ended" />
      : <Redirect href="/subscription-required" />;
  }

  const today = getTodayDateString();
  const hasCheckedInToday = state.moodHistory.some((e) => e.date === today);
  if (!hasCheckedInToday) {
    return <Redirect href="/daily-check-in" />;
  }

  return <Redirect href="/daily-deck" />;
}
