import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAppContext } from '@/context/app-context';

export default function Index() {
  const { state } = useAppContext();

  if (!state.hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F0' }}>
        <ActivityIndicator color="#5A8BA8" />
      </View>
    );
  }

  if (state.onboardingComplete) {
    return <Redirect href="/home" />;
  }

  return <Redirect href="/onboarding" />;
}
