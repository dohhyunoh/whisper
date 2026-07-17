// Warms the RevenueCat offerings + trial-eligibility lookups before the user
// reaches the paywall, so the paywall renders without a blocking spinner.
// curating.tsx fires this while its fake-progress ring runs; paywall.tsx awaits
// the same promise and resolves instantly when the prefetch already landed.

import Purchases, { PurchasesOfferings } from 'react-native-purchases';
import { checkTrialEligibility } from '@/utils/revenuecat';

export interface PaywallData {
  offerings: PurchasesOfferings | null;
  trialEligible: boolean;
}

// Cache expires so gate-mode paywall visits later in the app's lifetime
// (post-trial, post-cancel) re-check eligibility instead of reusing the
// answer from onboarding.
const CACHE_TTL_MS = 10 * 60 * 1000;

let cached: { promise: Promise<PaywallData>; fetchedAt: number } | null = null;

export function prefetchPaywallData(): Promise<PaywallData> {
  if (!cached || Date.now() - cached.fetchedAt > CACHE_TTL_MS) {
    cached = {
      fetchedAt: Date.now(),
      promise: (async () => {
        const [offerings, trialEligible] = await Promise.all([
          Purchases.getOfferings().catch(() => null),
          checkTrialEligibility(),
        ]);
        return { offerings, trialEligible };
      })(),
    };
  }
  return cached.promise;
}
