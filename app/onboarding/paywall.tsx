import { REVENUECAT_ENTITLEMENT_ID } from '@/constants/premium';
import { useAppContext } from '@/context/app-context';
import { requestPermissions, scheduleTrialReminder } from '@/utils/notifications';
import { Events, posthog } from '@/utils/posthog';
import { logSubscribeEvent } from '@/utils/appsflyer';
import { checkTrialEligibility, restorePurchases } from '@/utils/revenuecat';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, Linking, Pressable, StyleSheet, Switch, Text, View, useWindowDimensions } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FEATURES = [
  'Beautiful premium themes',
  'Add your own custom quotes',
  'Unlock all font styles',
  'Own custom themes',
];

function getTrialTimelineSteps() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const reminderDate = new Date(now);
  reminderDate.setDate(reminderDate.getDate() + 2);
  const billingDate = new Date(now);
  billingDate.setDate(billingDate.getDate() + 3);
  const fmt = (d: Date) => `${months[d.getMonth()]} ${d.getDate()}`;
  return [
    {
      icon: 'lock-open-outline' as const,
      title: 'Today - Free trial starts',
      description: 'Enjoy full access, totally free for your first 3 days',
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
        if (offerings.current) {
          const annual = offerings.current.availablePackages.find(
            (p) => p.packageType === 'ANNUAL' || p.product.identifier === 'com.dohhyun.whisper.annually',
          );
          const monthly = offerings.current.availablePackages.find(
            (p) => p.packageType === 'MONTHLY' || p.product.identifier === 'com.dohhyun.whisper.monthly',
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
  const isPostOnboarding = state.onboardingComplete;

  const handleComplete = (purchased: boolean) => {
    if (purchased) {
      dispatch({ type: 'SET_PREMIUM_STATUS', payload: 'premium_purchased' });
    }
    if (isPostOnboarding) {
      router.back();
      return;
    }
    posthog.capture(Events.ONBOARDING_COMPLETED, { method: purchased ? 'purchased' : 'free' });
    router.push('/onboarding/widget-promo');
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

  const handleSkip = () => {
    posthog.capture(Events.PAYWALL_SKIPPED);
    handleComplete(false);
  };

  const annualPrice = packages.annual?.product.priceString ?? '$49.99';
  const monthlyPrice = packages.monthly?.product.priceString ?? '$9.99';

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
        loading={loading}
        onPurchase={handlePurchase}
        onRestore={handleRestore}
        onSkip={handleSkip}
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
      loading={loading}
      onPurchase={handlePurchase}
      onRestore={handleRestore}
      onSkip={handleSkip}
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
  loading: boolean;
  onPurchase: () => void;
  onRestore: () => void;
  onSkip: () => void;
}

// ─── Footer ─────────────────────────────────────────────────────────────────

function Footer({ s, onRestore }: { s: number; onRestore: () => void }) {
  return (
    <View style={styles.footerContainer}>
      <View style={styles.footer}>
        <Pressable onPress={onRestore} hitSlop={8}>
          <Text style={[styles.footerText, { fontSize: 11 * s }]}>Restore</Text>
        </Pressable>
        <Text style={[styles.footerDivider, { fontSize: 11 * s }]}>|</Text>
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

// ─── Regular Paywall ────────────────────────────────────────────────────────

function RegularPaywall({
  s, insets, selectedPlan, setSelectedPlan,
  annualPrice, monthlyPrice, loading,
  onPurchase, onRestore, onSkip,
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
        <Pressable style={styles.noThanks} onPress={() => {
          if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
          onSkip();
        }} hitSlop={12}>
          <Text style={[styles.noThanksText, { fontSize: 15 * s }]}>No Thanks</Text>
        </Pressable>

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
              ? `$4.16/month, billed yearly as ${annualPrice}/year`
              : `${monthlyPrice}/month, billed monthly`}
          </Text>

          <Footer s={s} onRestore={onRestore} />
        </View>
      </View>
    </LinearGradient>
  );
}

// ─── Trial Paywall ──────────────────────────────────────────────────────────

function TrialPaywall({
  s, insets, selectedPlan, setSelectedPlan,
  annualPrice, monthlyPrice, loading,
  onPurchase, onRestore, onSkip,
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
        {/* Top bar: No Thanks */}
        <Pressable style={styles.noThanks} onPress={() => {
          if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
          onSkip();
        }} hitSlop={12}>
          <Text style={[styles.noThanksText, { fontSize: 15 * s }]}>No Thanks</Text>
        </Pressable>

        {/* Middle */}
        <View style={styles.middle}>
          <Text style={[styles.title, { fontSize: 26 * s, marginBottom: 6 * s }]}>
            Get Whisper Pro
          </Text>
          <Text style={[styles.trialSubheading, { fontSize: 15 * s, marginBottom: 20 * s }]}>
            Includes a 3-day free trial
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
                3-day free trial
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
                3-day free trial
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
              ? `$4.16/month, billed yearly as ${annualPrice}/year`
              : `${monthlyPrice}/month, billed monthly`}
          </Text>

          <Footer s={s} onRestore={onRestore} />
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
