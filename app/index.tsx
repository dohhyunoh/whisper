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
    return hasPremiumAccess(state.premium.status)
      ? <Redirect href="/paid-announcement" />
      : <Redirect href="/freemium-upgrade" />;
  }

  const today = getTodayDateString();
  const hasCheckedInToday = state.moodHistory.some((e) => e.date === today);
  if (!hasCheckedInToday) {
    return <Redirect href="/daily-check-in" />;
  }

  return <Redirect href="/daily-deck" />;
}
