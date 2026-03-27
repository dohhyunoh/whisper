import Purchases from 'react-native-purchases';
import { REVENUECAT_API_KEY, REVENUECAT_ENTITLEMENT_ID } from '@/constants/premium';
import { getAppsFlyerUID } from './appsflyer';

let isConfigured = false;

export function configureRevenueCat(): void {
  if (isConfigured) return;
  Purchases.configure({ apiKey: REVENUECAT_API_KEY });
  isConfigured = true;
}

export async function checkEntitlement(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID] !== undefined;
  } catch {
    return false;
  }
}

export async function checkTrialEligibility(): Promise<boolean> {
  try {
    const eligibility = await Purchases.checkTrialOrIntroductoryPriceEligibility([
      'com.dohhyun.whisper.annually',
      'com.dohhyun.whisper.monthly',
    ]);
    return Object.values(eligibility).some(
      (result) => result.status === Purchases.INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE,
    );
  } catch {
    return false;
  }
}

export async function linkAppsFlyerToRevenueCat(): Promise<void> {
  try {
    const appsflyerUID = await getAppsFlyerUID();
    Purchases.setAppsflyerID(appsflyerUID);
  } catch {
    // Silent fail — attribution is non-critical
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID] !== undefined;
  } catch {
    return false;
  }
}
