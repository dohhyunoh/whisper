import { PremiumState, PremiumStatus } from '@/data/types';
import { DEFAULT_PREMIUM_SETTINGS, IS_EARLY_BIRD_RELEASE } from '@/constants/premium';
import {
  loadFirstOpenVersion,
  loadPremiumSettings,
  loadPremiumStatus,
  saveFirstOpenVersion,
  savePremiumStatus,
} from './storage';

const CURRENT_VERSION = '1.0';

export async function initializePremiumStatus(): Promise<PremiumState> {
  // Load existing status and settings
  const [existingStatus, existingSettings, firstOpenVersion] = await Promise.all([
    loadPremiumStatus(),
    loadPremiumSettings(),
    loadFirstOpenVersion(),
  ]);

  // If user already has a status, return it with their settings
  if (existingStatus) {
    return {
      status: existingStatus,
      settings: existingSettings || DEFAULT_PREMIUM_SETTINGS,
    };
  }

  // New user - determine their status
  let newStatus: PremiumStatus;

  if (IS_EARLY_BIRD_RELEASE) {
    // Grant grandfathered premium to early bird users
    newStatus = 'grandfathered_premium';
  } else {
    // Post-early bird release - standard free
    newStatus = 'standard_free';
  }

  // Save the new status and first open version
  await Promise.all([
    savePremiumStatus(newStatus),
    saveFirstOpenVersion(firstOpenVersion || CURRENT_VERSION),
  ]);

  return {
    status: newStatus,
    settings: existingSettings || DEFAULT_PREMIUM_SETTINGS,
  };
}

export function hasPremiumAccess(status: PremiumStatus): boolean {
  return status === 'grandfathered_premium' || status === 'premium_purchased';
}
