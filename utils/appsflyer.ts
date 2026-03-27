import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import appsFlyer from 'react-native-appsflyer';

const APPSFLYER_DEV_KEY = 'mU4cXuWzuFj8xArqZUWmcJ';
const APP_STORE_ID = '6758811323'; // TODO: Replace with numeric App Store ID

export async function initializeAppsFlyer(): Promise<void> {
  // Request ATT before AppsFlyer init so it can capture IDFA if user consents
  await requestTrackingPermissionsAsync();

  return new Promise((resolve, reject) => {
    appsFlyer.initSdk(
      {
        devKey: APPSFLYER_DEV_KEY,
        isDebug: __DEV__,
        appId: APP_STORE_ID,
        onInstallConversionDataListener: true,
        timeToWaitForATTUserAuthorization: 10,
      },
      () => resolve(),
      (error) => reject(error),
    );
  });
}

export function logSubscribeEvent(revenue: number, currency: string): void {
  appsFlyer.logEvent('af_subscribe', {
    af_revenue: revenue,
    af_currency: currency,
  });
}

export function getAppsFlyerUID(): Promise<string> {
  return new Promise((resolve, reject) => {
    appsFlyer.getAppsFlyerUID((err, uid) => {
      if (err) reject(err);
      else resolve(uid);
    });
  });
}
