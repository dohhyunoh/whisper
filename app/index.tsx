import { useAppContext } from '@/context/app-context';
import { refreshQuoteNotifications } from '@/utils/notifications';
import { hasPremiumAccess } from '@/utils/premium-check';
import { hasSeenExchangeAnnouncement, hasSeenV2Migration, isOnboardingPaywallPending } from '@/utils/migration';
import { getTodayDateString } from '@/utils/streak';
import { Redirect } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { state } = useAppContext();

  // Top up the next few days of personalized notifications once per launch,
  // using the latest swipe-learned weights.
  const notificationsRefreshed = useRef(false);
  useEffect(() => {
    if (!state.hydrated || !state.onboardingComplete || notificationsRefreshed.current) return;
    notificationsRefreshed.current = true;
    refreshQuoteNotifications(state.user?.interests).catch(() => {});
  }, [state.hydrated, state.onboardingComplete, state.user?.interests]);

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
    // A brand-new user who quit at the onboarding paywall isn't a lapsed
    // subscriber — resume their onboarding paywall (personalized layout,
    // widget-promo completion path) instead of the gate.
    if (isOnboardingPaywallPending()) {
      return <Redirect href={{ pathname: '/onboarding/paywall', params: { from: 'onboarding' } }} />;
    }
    return state.premium.trialEndsAt != null
      ? <Redirect href="/gift-ended" />
      : <Redirect href="/subscription-required" />;
  }

  // One-time announcement of the letter exchange for existing subscribers.
  // (New users saw it in onboarding and marked it seen there.)
  if (!hasSeenExchangeAnnouncement()) {
    return <Redirect href="/exchange-announcement" />;
  }

  const today = getTodayDateString();
  const hasCheckedInToday = state.moodHistory.some((e) => e.date === today);
  if (!hasCheckedInToday) {
    return <Redirect href="/daily-check-in" />;
  }

  return <Redirect href="/daily-deck" />;
}
