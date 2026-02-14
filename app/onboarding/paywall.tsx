import React, { useEffect, useState } from 'react';
import { posthog, Events } from '@/utils/posthog';
import { Alert, Image, Linking, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { useAppContext } from '@/context/app-context';
import { REVENUECAT_ENTITLEMENT_ID } from '@/constants/premium';
import { restorePurchases } from '@/utils/revenuecat';

const FEATURES = [
  'Beautiful premium themes',
  'Add your own custom quotes',
  'Unlock all font styles',
  'Ad-free experience',
];

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

  useEffect(() => {
    posthog.capture(Events.ONBOARDING_SCREEN_VIEWED, { screen_name: 'paywall' });
    posthog.capture(Events.PAYWALL_VIEWED);
  }, []);

  useEffect(() => {
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
    fetchOfferings();
  }, []);

  const handleComplete = (purchased: boolean) => {
    if (purchased) {
      dispatch({ type: 'SET_PREMIUM_STATUS', payload: 'premium_purchased' });
    }
    posthog.capture(Events.ONBOARDING_COMPLETED, { method: purchased ? 'purchased' : 'free' });
    dispatch({ type: 'COMPLETE_ONBOARDING' });
    router.replace('/home');
  };

  const handlePurchase = async () => {
    const pkg = selectedPlan === 'annual' ? packages.annual : packages.monthly;
    if (!pkg) {
      Alert.alert('Unavailable', 'This plan is not available right now.');
      return;
    }
    setLoading(true);
    posthog.capture(Events.PAYWALL_PURCHASE_TAPPED, { plan: selectedPlan });
    try {
      const result = await Purchases.purchasePackage(pkg);
      if (result.customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID]) {
        posthog.capture(Events.PAYWALL_PURCHASE_COMPLETED, { plan: selectedPlan });
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

  const annualPrice = packages.annual?.product.priceString ?? '$49.99';
  const monthlyPrice = packages.monthly?.product.priceString ?? '$4.99';

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
        {/* No Thanks - top left */}
        <Pressable
          style={styles.noThanks}
          onPress={() => {
            posthog.capture(Events.PAYWALL_SKIPPED);
            handleComplete(false);
          }}
          hitSlop={12}
        >
          <Text style={[styles.noThanksText, { fontSize: 15 * s }]}>No Thanks</Text>
        </Pressable>

        {/* Scrollable middle content */}
        <View style={styles.middle}>
          {/* Title */}
          <Text style={[styles.title, { fontSize: 28 * s, marginBottom: 20 * s }]}>
            Get Whisper Pro
          </Text>

          {/* Mascot placeholder */}
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

          {/* Subtitle */}
          <Text style={[styles.subtitle, { fontSize: 22 * s, marginBottom: 20 * s }]}>
            Unlock Your Mind
          </Text>

          {/* Features */}
          <View style={[styles.features, { gap: 12 * s, marginBottom: 24 * s }]}>
            {FEATURES.map((feature) => (
              <View key={feature} style={[styles.featureRow, { gap: 10 * s }]}>
                <Ionicons name="checkmark-circle" size={20 * s} color="#3A6B80" />
                <Text style={[styles.featureText, { fontSize: 15 * s }]}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Plan options */}
          <View style={[styles.plans, { gap: 12 * s }]}>
            <Pressable
              style={[
                styles.planBox,
                { paddingVertical: 18 * s, borderRadius: 14 * s },
                selectedPlan === 'annual' && styles.planBoxSelected,
              ]}
              onPress={() => setSelectedPlan('annual')}
            >
              <Text
                style={[
                  styles.planLabel,
                  { fontSize: 15 * s },
                  selectedPlan === 'annual' && styles.planLabelSelected,
                ]}
              >
                Yearly
              </Text>
              <Text
                style={[
                  styles.planPrice,
                  { fontSize: 17 * s },
                  selectedPlan === 'annual' && styles.planPriceSelected,
                ]}
              >
                {annualPrice}/year
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.planBox,
                { paddingVertical: 18 * s, borderRadius: 14 * s },
                selectedPlan === 'monthly' && styles.planBoxSelected,
              ]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <Text
                style={[
                  styles.planLabel,
                  { fontSize: 15 * s },
                  selectedPlan === 'monthly' && styles.planLabelSelected,
                ]}
              >
                Monthly
              </Text>
              <Text
                style={[
                  styles.planPrice,
                  { fontSize: 17 * s },
                  selectedPlan === 'monthly' && styles.planPriceSelected,
                ]}
              >
                {monthlyPrice}/month
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Bottom pinned: Continue + footer */}
        <View style={[styles.bottom, { gap: 14 * s }]}>
          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              { paddingVertical: 18 * s },
              pressed && styles.pressed,
              loading && styles.disabled,
            ]}
            onPress={handlePurchase}
            disabled={loading}
          >
            <Text style={[styles.continueButtonText, { fontSize: 18 * s }]}>
              {loading ? 'Processing...' : 'Continue'}
            </Text>
          </Pressable>

          <View style={styles.footer}>
            <Pressable onPress={handleRestore} hitSlop={8}>
              <Text style={[styles.footerText, { fontSize: 11 * s }]}>Restore</Text>
            </Pressable>
            <Text style={[styles.footerDivider, { fontSize: 11 * s }]}>|</Text>
            <Pressable onPress={() => Linking.openURL('https://whisper-landing-nu.vercel.app/terms')} hitSlop={8}>
              <Text style={[styles.footerText, { fontSize: 11 * s }]}>Terms & Conditions</Text>
            </Pressable>
            <Text style={[styles.footerDivider, { fontSize: 11 * s }]}>|</Text>
            <Pressable onPress={() => Linking.openURL('https://whisper-landing-nu.vercel.app/privacy')} hitSlop={8}>
              <Text style={[styles.footerText, { fontSize: 11 * s }]}>Privacy</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    color: '#5A8BA8',
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
