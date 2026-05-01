import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAppContext } from '@/context/app-context';
import { getTodayDateString } from '@/utils/streak';

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

  const today = getTodayDateString();
  const hasCheckedInToday = state.moodHistory.some((e) => e.date === today);
  if (!hasCheckedInToday) {
    return <Redirect href="/daily-check-in" />;
  }

  return <Redirect href="/home" />;
}
