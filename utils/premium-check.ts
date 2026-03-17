import { PremiumState } from '@/data/types';
import { DEFAULT_PREMIUM_SETTINGS } from '@/constants/premium';
import {
  loadPremiumSettings,
  loadPremiumStatus,
  savePremiumStatus,
} from './storage';
import { checkEntitlement } from './revenuecat';

export async function initializePremiumStatus(): Promise<PremiumState> {
  const [existingStatus, existingSettings] = await Promise.all([
    loadPremiumStatus(),
    loadPremiumSettings(),
  ]);

  // If user already has a status, check RevenueCat for standard_free users (handles reinstalls/restores)
  if (existingStatus) {
    if (existingStatus === 'standard_free') {
      try {
        const hasEntitlement = await checkEntitlement();
        if (hasEntitlement) {
          await savePremiumStatus('premium_purchased');
          return {
            status: 'premium_purchased',
            settings: existingSettings || DEFAULT_PREMIUM_SETTINGS,
          };
        }
      } catch {
        // Silently fail — keep existing status
      }
    }
    return {
      status: existingStatus,
      settings: existingSettings || DEFAULT_PREMIUM_SETTINGS,
    };
  }

  // New user - standard free
  await savePremiumStatus('standard_free');

  return {
    status: 'standard_free',
    settings: existingSettings || DEFAULT_PREMIUM_SETTINGS,
  };
}

export function hasPremiumAccess(status: string): boolean {
  return status === 'premium_purchased';
}
