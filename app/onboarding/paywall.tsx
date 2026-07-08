import { REVENUECAT_ENTITLEMENT_ID } from '@/constants/premium';
import { useAppContext } from '@/context/app-context';
import { requestPermissions, scheduleTrialReminder } from '@/utils/notifications';
import { Events, posthog } from '@/utils/posthog';
import { logSubscribeEvent } from '@/utils/appsflyer';
import { checkTrialEligibility, restorePurchases } from '@/utils/revenuecat';
import { markExchangeAnnouncementSeen, markV2MigrationSeen } from '@/utils/migration';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, Linking, Pressable, StyleSheet, Switch, Text, View, useWindowDimensions } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FEATURES = [
  '10 daily quotes tuned to you',
  'Learns deeper with every swipe',
  'Save favorites and add your own',
  'Premium themes, fonts, and widgets',
];

function getTrialTimelineSteps() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const reminderDate = new Date(now);
  reminderDate.setDate(reminderDate.getDate() + 6);
  const billingDate = new Date(now);
  billingDate.setDate(billingDate.getDate() + 7);
  const fmt = (d: Date) => `${months[d.getMonth()]} ${d.getDate()}`;
  return [
    {
      icon: 'lock-open-outline' as const,
      title: 'Today - Free trial starts',
      description: 'Enjoy full access, totally free for your first 7 days',
    },
    {
      icon: 'notifications-outline' as const,
      title: `${fmt(reminderDate)} - Trial reminder`,
      description: "To let you know it's ending soon",
    },
    {
      icon: 'diamond-outline' as const,
      title: `${fmt(billingDate)} - Become member`,
      description: 'Your trial ends unless canceled',
    },
  ];
}

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dispatch } = useAppContext();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { width, height } = useWindowDimensions();
  const s = Math.max(0.85, Math.min(1, Math.min(width / 390, height / 844)));

  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  const [packages, setPackages] = useState<{
    annual?: PurchasesPackage;
    monthly?: PurchasesPackage;
  }>({});
  const [loading, setLoading] = useState(false);
  const [trialEligible, setTrialEligible] = useState<boolean | null>(null);

  useEffect(() => {
    posthog.capture(Events.ONBOARDING_SCREEN_VIEWED, { screen_name: 'paywall' });
  }, []);

  useEffect(() => {
    async function init() {
      const [, eligible] = await Promise.all([
        fetchOfferings(),
        checkTrialEligibility(),
      ]);
      setTrialEligible(eligible);
      if (eligible) {
        posthog.capture(Events.PAYWALL_TRIAL_VIEWED);
      } else {
        posthog.capture(Events.PAYWALL_VIEWED);
      }
    }

    async function fetchOfferings() {
      try {
        const offerings = await Purchases.getOfferings();
        // Explicitly fetch the v2 offering ($6.99 monthly / $39.99 yearly) instead
        // of offerings.current. This guarantees users always see v2 pricing
        // regardless of which offering is marked "Current" in the RC dashboard,
        // and keeps in-app marketing copy consistent with what Apple's reviewer sees.
        const offering = offerings.all['v2_pricing'] ?? offerings.current;
        if (offering) {
          const annual = offering.availablePackages.find(
            (p) => p.packageType === 'ANNUAL',
          );
          const monthly = offering.availablePackages.find(
            (p) => p.packageType === 'MONTHLY',
          );
          setPackages({ annual, monthly });
        }
      } catch (error) {
        console.log('Error fetching offerings:', error);
      }
    }

    init();
  }, []);

  const { state } = useAppContext();
  // Hard paywall gate (premium-only enforcement).
  const gated = from === 'gate';
  // Onboarding membership comes from the explicit param; the onboardingComplete
  // inference (captured at mount, before the effect below flips it) only covers
  // legacy callers. Inference alone breaks on re-entry: back-chevron + continue
  // remounts this screen after onboardingComplete is already true, which made
  // post-purchase routing bounce back to the trial-reminder screen.
  const [cameFromOnboarding] = useState(
    () => from === 'onboarding' || (!state.onboardingComplete && !gated),
  );

  // New users reach this screen only after finishing the questionnaire. Mark
  // onboarding complete on arrival so quitting here returns them straight to the
  // paywall (via the index.tsx gate) instead of replaying the whole flow. Mark
  // the v2 migration seen too, so index never routes them into the freemium gift.
  useEffect(() => {
    if (cameFromOnboarding) {
      dispatch({ type: 'COMPLETE_ONBOARDING' });
      markV2MigrationSeen();
      markExchangeAnnouncementSeen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleComplete = (purchased: boolean) => {
    if (purchased) {
      dispatch({ type: 'SET_PREMIUM_STATUS', payload: 'premium_purchased' });
    }
    if (from === 'freemium-migration' || gated) {
      router.replace('/daily-deck');
      return;
    }
    if (cameFromOnboarding) {
      posthog.capture(Events.ONBOARDING_COMPLETED, { method: purchased ? 'purchased' : 'free' });
      router.replace('/onboarding/widget-promo');
      return;
    }
    // Post-onboarding contextual call (theme picker, etc.): return to caller.
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/daily-deck');
    }
  };

  const handlePurchase = async () => {
    const pkg = selectedPlan === 'annual' ? packages.annual : packages.monthly;
    if (!pkg) {
      Alert.alert('Unavailable', 'This plan is not available right now.');
      return;
    }
    setLoading(true);
    posthog.capture(Events.PAYWALL_PURCHASE_TAPPED, { plan: selectedPlan, trial: trialEligible });
    if (trialEligible) {
      posthog.capture(Events.PAYWALL_TRIAL_STARTED, { plan: selectedPlan });
    }
    try {
      const result = await Purchases.purchasePackage(pkg);
      if (result.customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID]) {
        posthog.capture(Events.PAYWALL_PURCHASE_COMPLETED, { plan: selectedPlan, trial: trialEligible });
        logSubscribeEvent(pkg.product.price, pkg.product.currencyCode);
        handleComplete(true);
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        console.log('Purchase error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    posthog.capture(Events.PAYWALL_RESTORE_TAPPED);
    setLoading(true);
    const hasAccess = await restorePurchases();
    setLoading(false);
    if (hasAccess) {
      handleComplete(true);
    } else {
      Alert.alert('Nothing to Restore', 'No previous purchases found.');
    }
  };

  const annualPrice = packages.annual?.product.priceString ?? '$39.99';
  const monthlyPrice = packages.monthly?.product.priceString ?? '$6.99';
  const annualMonthlyEquiv = packages.annual?.product.price
    ? `$${(Math.floor((packages.annual.product.price / 12) * 100) / 100).toFixed(2)}`
    : '$3.33';

  const handleClose = () => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    posthog.capture(Events.PAYWALL_SKIPPED);
    // Back button: return to whichever screen pushed the paywall. In gate mode
    // that's the context lock screen (gift-ended / subscription-required), so the
    // purchase flow stays dismissible without ever exposing the deck.
    if (from === 'gate') {
      if (router.canGoBack()) router.back();
      else router.replace('/subscription-required');
    } else if (from === 'freemium-migration') {
      router.replace('/freemium-upgrade');
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/daily-deck');
    }
  };

  if (trialEligible === null) {
    return (
      <LinearGradient
        colors={['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0']}
        locations={[0, 0.3, 0.7, 1]}
        style={[styles.container, styles.loadingContainer]}
      >
        <ActivityIndicator size="large" color="#3A6B80" />
      </LinearGradient>
    );
  }

  if (trialEligible) {
    return (
      <TrialPaywall
        s={s}
        insets={insets}
        selectedPlan={selectedPlan}
        setSelectedPlan={setSelectedPlan}
        annualPrice={annualPrice}
        monthlyPrice={monthlyPrice}
        annualMonthlyEquiv={annualMonthlyEquiv}
        loading={loading}
        onPurchase={handlePurchase}
        onRestore={handleRestore}
        onClose={handleClose}
      />
    );
  }

  return (
    <RegularPaywall
      s={s}
      insets={insets}
      selectedPlan={selectedPlan}
      setSelectedPlan={setSelectedPlan}
      annualPrice={annualPrice}
      monthlyPrice={monthlyPrice}
      annualMonthlyEquiv={annualMonthlyEquiv}
      loading={loading}
      onPurchase={handlePurchase}
      onRestore={handleRestore}
      onClose={handleClose}
    />
  );
}

// ─── Shared types ───────────────────────────────────────────────────────────

interface PaywallProps {
  s: number;
  insets: { top: number; bottom: number };
  selectedPlan: 'annual' | 'monthly';
  setSelectedPlan: (plan: 'annual' | 'monthly') => void;
  annualPrice: string;
  monthlyPrice: string;
  annualMonthlyEquiv: string;
  loading: boolean;
  onPurchase: () => void;
  onRestore: () => void;
  onClose?: () => void;
}

// ─── Footer ─────────────────────────────────────────────────────────────────

function Footer({ s }: { s: number }) {
  return (
    <View style={styles.footerContainer}>
      <View style={styles.footer}>
        <Pressable onPress={() => Linking.openURL('https://www.whisperquotes.app/terms')} hitSlop={8}>
          <Text style={[styles.footerText, { fontSize: 11 * s }]}>Terms & Conditions</Text>
        </Pressable>
        <Text style={[styles.footerDivider, { fontSize: 11 * s }]}>|</Text>
        <Pressable onPress={() => Linking.openURL('https://www.whisperquotes.app/privacy')} hitSlop={8}>
          <Text style={[styles.footerText, { fontSize: 11 * s }]}>Privacy</Text>
        </Pressable>
      </View>
    </View>
  );
}

function RestoreLink({ s, onRestore, style }: { s: number; onRestore: () => void; style?: any }) {
  return (
    <Pressable style={style} onPress={onRestore} hitSlop={12}>
      <Text style={[styles.noThanksText, { fontSize: 15 * s }]}>Restore</Text>
    </Pressable>
  );
}

function BackButton({ s, onClose, style }: { s: number; onClose?: () => void; style?: any }) {
  // Gate mode passes no handler — render a spacer to preserve the top-bar layout.
  if (!onClose) {
    return <View style={[style, { width: 32 * s, height: 32 * s }]} />;
  }
  return (
    <Pressable style={style} onPress={onClose} hitSlop={12}>
      <View style={[styles.closeCircle, { width: 32 * s, height: 32 * s, borderRadius: 16 * s }]}>
        <Ionicons name="chevron-back" size={22 * s} color="#7B9AAA" />
      </View>
    </Pressable>
  );
}

// ─── Regular Paywall ────────────────────────────────────────────────────────

function RegularPaywall({
  s, insets, selectedPlan, setSelectedPlan,
  annualPrice, monthlyPrice, annualMonthlyEquiv, loading,
  onPurchase, onRestore, onClose,
}: PaywallProps) {
  return (
    <LinearGradient
      colors={['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0']}
      locations={[0, 0.3, 0.7, 1]}
      style={styles.container}
    >
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 16 * s,
            paddingHorizontal: 28 * s,
          },
        ]}
      >
        <View style={styles.topBar}>
          <BackButton s={s} onClose={onClose} />
          <RestoreLink s={s} onRestore={onRestore} />
        </View>

        <View style={styles.middle}>
          <Text style={[styles.title, { fontSize: 28 * s, marginBottom: 20 * s }]}>
            Get Whisper Pro
          </Text>

          <View
            style={[
              styles.mascotContainer,
              {
                width: 100 * s,
                height: 100 * s,
                borderRadius: 50 * s,
                marginBottom: 16 * s,
              },
            ]}
          >
            <Image source={require('@/assets/images/mascot.png')} style={{ width: 80 * s, height: 80 * s }} resizeMode="contain" />
          </View>

          <Text style={[styles.subtitle, { fontSize: 22 * s, marginBottom: 20 * s }]}>
            Unlock Your Peace
          </Text>

          <View style={[styles.features, { gap: 12 * s }]}>
            {FEATURES.map((feature) => (
              <View key={feature} style={[styles.featureRow, { gap: 10 * s }]}>
                <Ionicons name="checkmark-circle" size={20 * s} color="#3A6B80" />
                <Text style={[styles.featureText, { fontSize: 15 * s }]}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.bottom, { gap: 14 * s }]}>
          <View style={[styles.plans, { gap: 12 * s }]}>
            <Pressable
              style={[
                styles.planBox,
                { paddingVertical: 24 * s, borderRadius: 14 * s },
                selectedPlan === 'annual' && styles.planBoxSelected,
              ]}
              onPress={() => setSelectedPlan('annual')}
            >
              <Text
                style={[
                  styles.planLabel, { fontSize: 15 * s },
                  selectedPlan === 'annual' && styles.planLabelSelected,
                ]}
              >
                Yearly
              </Text>
              <Text
                style={[
                  styles.planPrice, { fontSize: 17 * s },
                  selectedPlan === 'annual' && styles.planPriceSelected,
                ]}
              >
                {annualPrice}/year
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.planBox,
                { paddingVertical: 24 * s, borderRadius: 14 * s },
                selectedPlan === 'monthly' && styles.planBoxSelected,
              ]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <Text
                style={[
                  styles.planLabel, { fontSize: 15 * s },
                  selectedPlan === 'monthly' && styles.planLabelSelected,
                ]}
              >
                Monthly
              </Text>
              <Text
                style={[
                  styles.planPrice, { fontSize: 17 * s },
                  selectedPlan === 'monthly' && styles.planPriceSelected,
                ]}
              >
                {monthlyPrice}/month
              </Text>
            </Pressable>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              { paddingVertical: 18 * s },
              pressed && styles.pressed,
              loading && styles.disabled,
            ]}
            onPress={() => {
              if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onPurchase();
            }}
            disabled={loading}
          >
            <Text style={[styles.continueButtonText, { fontSize: 18 * s }]}>
              {loading ? 'Processing...' : 'Continue'}
            </Text>
          </Pressable>

          <Text style={[styles.billingText, { fontSize: 12 * s }]}>
            {selectedPlan === 'annual'
              ? `${annualMonthlyEquiv}/month, billed yearly as ${annualPrice}/year`
              : `${monthlyPrice}/month, billed monthly`}
          </Text>

          <Footer s={s} />
        </View>
      </View>
    </LinearGradient>
  );
}

// ─── Trial Paywall ──────────────────────────────────────────────────────────

function TrialPaywall({
  s, insets, selectedPlan, setSelectedPlan,
  annualPrice, monthlyPrice, annualMonthlyEquiv, loading,
  onPurchase, onRestore, onClose,
}: PaywallProps) {
  const timelineSteps = getTrialTimelineSteps();
  const fadeAnims = useRef(timelineSteps.map(() => new Animated.Value(0))).current;
  const [reminderEnabled, setReminderEnabled] = useState(false);

  const handleReminderToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in Settings to receive trial reminders.',
        );
        return;
      }
      setReminderEnabled(true);
      scheduleTrialReminder();
    } else {
      setReminderEnabled(false);
    }
  };

  useEffect(() => {
    const animations = fadeAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 300 + i * 200,
        useNativeDriver: true,
      }),
    );
    Animated.stagger(200, animations).start();
  }, []);

  return (
    <LinearGradient
      colors={['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0']}
      locations={[0, 0.3, 0.7, 1]}
      style={styles.container}
    >
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 16 * s,
            paddingHorizontal: 28 * s,
          },
        ]}
      >
        {/* Top bar: Restore (left) + Close (right) */}
        <View style={styles.topBar}>
          <BackButton s={s} onClose={onClose} />
          <RestoreLink s={s} onRestore={onRestore} />
        </View>

        {/* Middle */}
        <View style={styles.middle}>
          <Text style={[styles.title, { fontSize: 26 * s, marginBottom: 6 * s }]}>
            Get Whisper Pro
          </Text>
          <Text style={[styles.trialSubheading, { fontSize: 15 * s, marginBottom: 20 * s }]}>
            Includes a 7-day free trial
          </Text>

          {/* Mascot */}
          <View
            style={[
              styles.mascotContainer,
              {
                width: 100 * s,
                height: 100 * s,
                borderRadius: 50 * s,
                marginBottom: 20 * s,
              },
            ]}
          >
            <Image source={require('@/assets/images/mascot.png')} style={{ width: 80 * s, height: 80 * s }} resizeMode="contain" />
          </View>

          {/* Timeline - simple dots */}
          <View style={[styles.trialSimpleTimeline, { gap: 4 * s }]}>
            {timelineSteps.map((step, i) => (
              <Animated.View
                key={step.title}
                style={{ opacity: fadeAnims[i], transform: [{ translateY: fadeAnims[i].interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}
              >
                <View style={styles.trialSimpleRow}>
                  <View style={styles.trialSimpleDotCol}>
                    <View style={[styles.trialSimpleDot, { width: 10 * s, height: 10 * s, borderRadius: 5 * s }]} />
                    {i < timelineSteps.length - 1 && (
                      <View style={[styles.trialSimpleBar, { height: 20 * s, width: 2 * s }]} />
                    )}
                  </View>
                  <View style={[styles.trialSimpleTextCol, { paddingBottom: i < timelineSteps.length - 1 ? 8 * s : 0 }]}>
                    <Text style={[styles.trialSimpleTitle, { fontSize: 15 * s }]}>
                      {i === 0 ? 'Today' : step.title.split(' - ')[0]}
                    </Text>
                    <Text style={[styles.trialSimpleDesc, { fontSize: 13 * s }]}>
                      {i === 0 ? 'Unlock all premium features' : i === 1 ? "We'll remind you before trial ends" : 'Subscription begins. Cancel anytime.'}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Bottom */}
        <View style={[styles.bottom, { gap: 12 * s }]}>
          {/* Plan cards - price is most prominent */}
          <View style={[styles.plans, { gap: 12 * s }]}>
            <Pressable
              style={[
                styles.trialPlanBox,
                { paddingVertical: 18 * s, paddingHorizontal: 12 * s, borderRadius: 14 * s },
                selectedPlan === 'annual' && styles.planBoxSelected,
              ]}
              onPress={() => setSelectedPlan('annual')}
            >
              <Text style={[styles.trialPlanPrice, { fontSize: 17 * s }, selectedPlan === 'annual' && styles.planPriceSelected]}>
                {annualPrice}/year
              </Text>
              <Text style={[styles.planLabel, { fontSize: 14 * s }, selectedPlan === 'annual' && styles.planLabelSelected]}>
                Yearly
              </Text>
              <Text style={[styles.trialPlanSubtitle, { fontSize: 12 * s }]}>
                7-day free trial
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.trialPlanBox,
                { paddingVertical: 18 * s, paddingHorizontal: 12 * s, borderRadius: 14 * s },
                selectedPlan === 'monthly' && styles.planBoxSelected,
              ]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <Text style={[styles.trialPlanPrice, { fontSize: 17 * s }, selectedPlan === 'monthly' && styles.planPriceSelected]}>
                {monthlyPrice}/month
              </Text>
              <Text style={[styles.planLabel, { fontSize: 14 * s }, selectedPlan === 'monthly' && styles.planLabelSelected]}>
                Monthly
              </Text>
              <Text style={[styles.trialPlanSubtitle, { fontSize: 12 * s }]}>
                7-day free trial
              </Text>
            </Pressable>
          </View>

          {/* Reminder toggle */}
          <View style={[styles.reminderRow, { paddingVertical: 14 * s, paddingHorizontal: 18 * s, borderRadius: 14 * s }]}>
            <Text style={[styles.reminderText, { fontSize: 14 * s }]}>Reminder before trial ends</Text>
            <Switch
              value={reminderEnabled}
              onValueChange={handleReminderToggle}
              trackColor={{ false: 'rgba(58, 107, 128, 0.35)', true: '#3A6B80' }}
              thumbColor="#FFF"
              ios_backgroundColor="rgba(58, 107, 128, 0.35)"
            />
          </View>

          {/* CTA */}
          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              { paddingVertical: 18 * s },
              pressed && styles.pressed,
              loading && styles.disabled,
            ]}
            onPress={() => {
              if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onPurchase();
            }}
            disabled={loading}
          >
            <Text style={[styles.continueButtonText, { fontSize: 18 * s }]}>
              {loading ? 'Processing...' : 'Start My Free Trial'}
            </Text>
          </Pressable>

          {/* Billing info */}
          <Text style={[styles.billingText, { fontSize: 12 * s }]}>
            {selectedPlan === 'annual'
              ? `${annualMonthlyEquiv}/month, billed yearly as ${annualPrice}/year`
              : `${monthlyPrice}/month, billed monthly`}
          </Text>

          <Footer s={s} />
        </View>
      </View>
    </LinearGradient>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  noThanks: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 4,
  },
  noThanksText: {
    fontWeight: '500',
    color: '#999',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 4,
  },
  closeCircle: {
    backgroundColor: 'rgba(58, 107, 128, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    color: '#3A6B80',
    textAlign: 'center',
  },
  trialSubheading: {
    fontWeight: '500',
    color: '#5A8BA8',
    textAlign: 'center',
  },
  mascotContainer: {
    backgroundColor: 'rgba(58, 107, 128, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontWeight: '700',
    color: '#3A6B80',
    textAlign: 'center',
  },
  features: {
    alignSelf: 'stretch',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontWeight: '500',
    color: '#3A6B80',
  },
  // Trial timeline card
  trialTimelineCard: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(58, 107, 128, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(58, 107, 128, 0.12)',
  },
  trialTimelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  trialTimelineIconCol: {
    alignItems: 'center',
    width: 32,
    marginRight: 14,
  },
  trialTimelineIconCircle: {
    backgroundColor: '#3A6B80',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trialTimelineBar: {
    backgroundColor: '#3A6B80',
    marginTop: 4,
    opacity: 0.6,
  },
  trialTimelineTextCol: {
    flex: 1,
    paddingTop: 2,
  },
  trialTimelineTitle: {
    fontWeight: '700',
    color: '#3A6B80',
  },
  trialTimelineDesc: {
    fontWeight: '500',
    color: '#5A8BA8',
    marginTop: 3,
  },
  // Simple timeline (dots)
  trialSimpleTimeline: {
    alignSelf: 'stretch',
    paddingLeft: 8,
  },
  trialSimpleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  trialSimpleDotCol: {
    alignItems: 'center',
    width: 20,
    marginRight: 10,
    paddingTop: 4,
  },
  trialSimpleDot: {
    backgroundColor: '#3A6B80',
  },
  trialSimpleBar: {
    backgroundColor: '#3A6B80',
    marginTop: 4,
    opacity: 0.4,
  },
  trialSimpleTextCol: {
    flex: 1,
  },
  trialSimpleTitle: {
    fontWeight: '700',
    color: '#3A6B80',
  },
  trialSimpleDesc: {
    fontWeight: '500',
    color: '#5A8BA8',
    marginTop: 2,
  },
  // Trial plan box
  trialPlanBox: {
    flex: 1,
    borderWidth: 2,
    borderColor: 'rgba(58, 107, 128, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    gap: 6,
  },
  trialBadge: {
    backgroundColor: '#3A6B80',
    marginBottom: 2,
  },
  trialBadgeText: {
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  trialPlanPrice: {
    fontWeight: '800',
    color: '#7B9AAA',
  },
  trialPlanSubtitle: {
    fontWeight: '500',
    color: '#7B9AAA',
  },
  // Plan toggle
  planToggle: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    backgroundColor: 'rgba(58, 107, 128, 0.1)',
  },
  planToggleOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planToggleOptionSelected: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  planToggleText: {
    fontWeight: '600',
    color: '#7B9AAA',
  },
  planToggleTextSelected: {
    color: '#3A6B80',
  },
  // Plans
  plans: {
    flexDirection: 'row',
    alignSelf: 'stretch',
  },
  planBox: {
    flex: 1,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: 'rgba(58, 107, 128, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    gap: 4,
  },
  planBoxSelected: {
    borderColor: '#3A6B80',
    backgroundColor: 'rgba(58, 107, 128, 0.1)',
  },
  planLabel: {
    fontWeight: '600',
    color: '#7B9AAA',
  },
  planLabelSelected: {
    color: '#3A6B80',
  },
  planPrice: {
    fontWeight: '700',
    color: '#7B9AAA',
  },
  planPriceSelected: {
    color: '#3A6B80',
  },
  // Reminder toggle
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(58, 107, 128, 0.15)',
  },
  reminderText: {
    fontWeight: '500',
    color: '#3A6B80',
    flex: 1,
  },
  billingText: {
    fontWeight: '500',
    color: '#5A8BA8',
    textAlign: 'center',
  },
  billingTextBold: {
    fontWeight: '700',
    color: '#3A6B80',
  },
  // Bottom
  bottom: {
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#3A6B80',
    borderRadius: 100,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pressed: {
    transform: [{ translateY: 2 }],
  },
  disabled: {
    opacity: 0.6,
  },
  footerContainer: {
    alignItems: 'center',
    gap: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontWeight: '500',
    color: '#7B9AAA',
  },
  footerDivider: {
    color: 'rgba(122, 154, 170, 0.4)',
  },
});
