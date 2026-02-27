import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useFonts as useIndieFlower, IndieFlower_400Regular } from '@expo-google-fonts/indie-flower';
import { useFonts as usePermanentMarker, PermanentMarker_400Regular } from '@expo-google-fonts/permanent-marker';
import { useFonts as useLuckiestGuy, LuckiestGuy_400Regular } from '@expo-google-fonts/luckiest-guy';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppProvider } from '@/context/app-context';
import { PostHogProvider } from 'posthog-react-native';
import { posthog } from '@/utils/posthog';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [indieFlowerLoaded] = useIndieFlower({
    IndieFlower_400Regular,
  });

  const [permanentMarkerLoaded] = usePermanentMarker({
    PermanentMarker_400Regular,
  });

  const [luckiestGuyLoaded] = useLuckiestGuy({
    LuckiestGuy_400Regular,
  });

  const fontsLoaded = indieFlowerLoaded && permanentMarkerLoaded && luckiestGuyLoaded;

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <PostHogProvider client={posthog}>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="home" options={{ headerShown: false }} />
            <Stack.Screen
              name="category-feed"
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="profile-modal"
              options={{
                presentation: 'card',
                headerShown: false,
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="edit-profile"
              options={{
                presentation: 'card',
                headerShown: false,
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="edit-name"
              options={{
                presentation: 'card',
                headerShown: false,
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="edit-gender"
              options={{
                presentation: 'card',
                headerShown: false,
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="add-quote-modal"
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="appearance"
              options={{
                presentation: 'card',
                headerShown: false,
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="appearance-classic"
              options={{
                presentation: 'card',
                headerShown: false,
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="appearance-pictures"
              options={{
                presentation: 'card',
                headerShown: false,
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="appearance-shuffle"
              options={{
                presentation: 'card',
                headerShown: false,
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="streak-detail"
              options={{
                presentation: 'card',
                headerShown: false,
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
              }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AppProvider>
    </GestureHandlerRootView>
    </PostHogProvider>
  );
}
