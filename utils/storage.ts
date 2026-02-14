import AsyncStorage from '@react-native-async-storage/async-storage';
import { OwnQuote, PremiumSettings, PremiumStatus, UserData } from '@/data/types';

export interface NotificationPrefs {
  perDay: number;
  startHour: number;
  endHour: number;
}

const KEYS = {
  USER: '@whisper_user',
  ONBOARDING: '@whisper_onboarding',
  LIKED: '@whisper_liked',
  OWN_QUOTES: '@whisper_own_quotes',
  NOTIF_PREFS: '@whisper_notif_prefs',
  SWIPE_HINT: '@whisper_swipe_hint_seen',
  PREMIUM_STATUS: '@whisper_premium_status',
  PREMIUM_SETTINGS: '@whisper_premium_settings',
  FIRST_OPEN_VERSION: '@whisper_first_open_version',
  STREAK_DATES: '@whisper_streak_dates',
};

export async function loadUser(): Promise<UserData | null> {
  const raw = await AsyncStorage.getItem(KEYS.USER);
  return raw ? JSON.parse(raw) : null;
}

export async function saveUser(user: UserData): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export async function loadOnboardingComplete(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEYS.ONBOARDING);
  return raw === 'true';
}

export async function saveOnboardingComplete(complete: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDING, String(complete));
}

export async function loadLikedIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEYS.LIKED);
  return raw ? JSON.parse(raw) : [];
}

export async function saveLikedIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.LIKED, JSON.stringify(ids));
}

export async function loadOwnQuotes(): Promise<OwnQuote[]> {
  const raw = await AsyncStorage.getItem(KEYS.OWN_QUOTES);
  return raw ? JSON.parse(raw) : [];
}

export async function saveOwnQuotes(quotes: OwnQuote[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.OWN_QUOTES, JSON.stringify(quotes));
}

export async function loadNotificationPrefs(): Promise<NotificationPrefs | null> {
  const raw = await AsyncStorage.getItem(KEYS.NOTIF_PREFS);
  return raw ? JSON.parse(raw) : null;
}

export async function saveNotificationPrefs(prefs: NotificationPrefs): Promise<void> {
  await AsyncStorage.setItem(KEYS.NOTIF_PREFS, JSON.stringify(prefs));
}

export async function hasSeenSwipeHint(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEYS.SWIPE_HINT);
  return raw === 'true';
}

export async function markSwipeHintSeen(): Promise<void> {
  await AsyncStorage.setItem(KEYS.SWIPE_HINT, 'true');
}

// Premium storage functions
export async function loadPremiumStatus(): Promise<PremiumStatus | null> {
  const raw = await AsyncStorage.getItem(KEYS.PREMIUM_STATUS);
  return raw as PremiumStatus | null;
}

export async function savePremiumStatus(status: PremiumStatus): Promise<void> {
  await AsyncStorage.setItem(KEYS.PREMIUM_STATUS, status);
}

export async function loadPremiumSettings(): Promise<PremiumSettings | null> {
  const raw = await AsyncStorage.getItem(KEYS.PREMIUM_SETTINGS);
  return raw ? JSON.parse(raw) : null;
}

export async function savePremiumSettings(settings: PremiumSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.PREMIUM_SETTINGS, JSON.stringify(settings));
}

export async function loadFirstOpenVersion(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.FIRST_OPEN_VERSION);
}

export async function saveFirstOpenVersion(version: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.FIRST_OPEN_VERSION, version);
}

export async function loadStreakDates(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEYS.STREAK_DATES);
  return raw ? JSON.parse(raw) : [];
}

export async function saveStreakDates(dates: string[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.STREAK_DATES, JSON.stringify(dates));
}
