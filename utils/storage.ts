import AsyncStorage from '@react-native-async-storage/async-storage';
import { MoodHistoryEntry, OwnQuote, PremiumSettings, PremiumStatus, UserData } from '@/data/types';

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
  STREAK_DATES: '@whisper_streak_dates',
  MOOD_HISTORY: '@whisper_mood_history',
  REVIEW_REQUESTED: '@whisper_review_requested',
  NOTIF_QUOTES: '@whisper_notif_quotes_enabled',
  NOTIF_MESSAGES: '@whisper_notif_messages_enabled',
};

// Notification toggles. Default ON (opt-out) — a null value means "never set",
// which we treat as enabled so existing users keep their current behavior.
export async function loadQuotesNotifEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEYS.NOTIF_QUOTES);
  return raw === null ? true : raw === 'true';
}

export async function saveQuotesNotifEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.NOTIF_QUOTES, String(enabled));
}

export async function loadMessagesNotifEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEYS.NOTIF_MESSAGES);
  return raw === null ? true : raw === 'true';
}

export async function saveMessagesNotifEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.NOTIF_MESSAGES, String(enabled));
}

export async function hasRequestedReview(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEYS.REVIEW_REQUESTED);
  return raw === 'true';
}

export async function markReviewRequested(): Promise<void> {
  await AsyncStorage.setItem(KEYS.REVIEW_REQUESTED, 'true');
}

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

export async function loadStreakDates(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEYS.STREAK_DATES);
  return raw ? JSON.parse(raw) : [];
}

export async function saveStreakDates(dates: string[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.STREAK_DATES, JSON.stringify(dates));
}

export async function loadMoodHistory(): Promise<MoodHistoryEntry[]> {
  const raw = await AsyncStorage.getItem(KEYS.MOOD_HISTORY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveMoodHistory(history: MoodHistoryEntry[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.MOOD_HISTORY, JSON.stringify(history));
}
