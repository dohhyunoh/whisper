import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { Caveat_400Regular } from '@expo-google-fonts/caveat';
import { CormorantGaramond_400Regular } from '@expo-google-fonts/cormorant-garamond';
import { IndieFlower_400Regular } from '@expo-google-fonts/indie-flower';
import { JosefinSans_400Regular } from '@expo-google-fonts/josefin-sans';
import { LuckiestGuy_400Regular } from '@expo-google-fonts/luckiest-guy';
import { Merriweather_400Regular } from '@expo-google-fonts/merriweather';
import { Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import { PermanentMarker_400Regular } from '@expo-google-fonts/permanent-marker';
import { PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display';
import { Satisfy_400Regular } from '@expo-google-fonts/satisfy';
import { useFonts } from 'expo-font';

import { AppProvider } from '@/context/app-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { posthog } from '@/utils/posthog';
import { configureRevenueCat, linkAppsFlyerToRevenueCat } from '@/utils/revenuecat';
import { initializeAppsFlyer } from '@/utils/appsflyer';
import { PostHogProvider } from 'posthog-react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    IndieFlower_400Regular,
    PermanentMarker_400Regular,
    LuckiestGuy_400Regular,
    PlayfairDisplay_400Regular,
    Caveat_400Regular,
    Merriweather_400Regular,
    CormorantGaramond_400Regular,
    Satisfy_400Regular,
    JosefinSans_400Regular,
    Pacifico_400Regular,
  });

  useEffect(() => {
    async function init() {
      await configureRevenueCat();
      await initializeAppsFlyer();
      await linkAppsFlyerToRevenueCat();
    }
    init();
  }, []);

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
            <Stack.Screen name="daily-deck" options={{ headerShown: false }} />
            <Stack.Screen
              name="soul-signature"
              options={{
                presentation: 'card',
                headerShown: false,
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
              }}
            />
            <Stack.Screen name="paid-announcement" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="freemium-upgrade" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="gift-ended" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="subscription-required" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen
              name="daily-check-in"
              options={{
                headerShown: false,
                gestureEnabled: false,
                fullScreenGestureEnabled: false,
                animation: 'fade',
              }}
            />
            <Stack.Screen
              name="category-feed"
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="settings"
              options={{
                presentation: 'card',
                headerShown: false,
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="widget-control"
              options={{
                presentation: 'card',
                headerShown: false,
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="own-quotes"
              options={{
                presentation: 'card',
                headerShown: false,
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="favorites"
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
              name="appearance-font-shuffle"
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
