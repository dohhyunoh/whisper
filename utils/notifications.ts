import quotesData from '@/data/quotes';
import { Quote } from '@/data/types';
import { interestTagOverlap, tagsForInterests } from '@/utils/interest-tags';
import { shuffle } from '@/utils/shuffle';
import { loadNotificationPrefs, loadQuotesNotifEnabled, saveNotificationPrefs, saveQuotesNotifEnabled } from '@/utils/storage';
import { getWeights } from '@/utils/tag-weights';
import * as Notifications from 'expo-notifications';

const allQuotes: Quote[] = quotesData as Quote[];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// How many days of notifications to keep scheduled ahead. Refreshed on every
// app open, so this is the safety margin for users who skip days.
const DAYS_AHEAD = 3;
const PERSONAL_POOL_SIZE = 100;
const COLD_START_INTEREST_BONUS = 2;

// Rank by the same swipe-learned tag weights the daily deck and widget use;
// interest tags from onboarding break the cold-start tie before any swipes
// exist. Picks randomly within the top pool so repeat schedules vary.
function pickPersonalQuotes(interests: string[] | undefined, count: number): Quote[] {
  const weights = getWeights();
  const interestTags = tagsForInterests(interests);
  const rankedPool = allQuotes
    .map((q) => {
      let score = (Math.random() - 0.5) * 0.01;
      for (const tag of q.tags ?? []) score += weights[tag] ?? 0;
      if (interestTagOverlap(q, interestTags) > 0) score += COLD_START_INTEREST_BONUS;
      return { q, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, PERSONAL_POOL_SIZE)
    .map((s) => s.q);
  return shuffle(rankedPool).slice(0, count);
}

function computeTimes(
  count: number,
  startHour: number,
  endHour: number,
  daysFromNow: number,
): Date[] {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + daysFromNow);

  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;
  const totalMinutes = endMinutes - startMinutes;

  const times: Date[] = [];

  if (count === 1) {
    const mid = startMinutes + totalMinutes / 2;
    const date = new Date(tomorrow);
    date.setHours(Math.floor(mid / 60), Math.round(mid % 60), 0, 0);
    times.push(date);
    return times;
  }

  const interval = totalMinutes / (count - 1);
  const maxJitter = 15; // ±15 minutes

  for (let i = 0; i < count; i++) {
    const baseMinute = startMinutes + i * interval;
    const jitter = (Math.random() * 2 - 1) * maxJitter;
    const finalMinute = Math.max(
      startMinutes,
      Math.min(endMinutes, baseMinute + jitter),
    );

    const date = new Date(tomorrow);
    date.setHours(Math.floor(finalMinute / 60), Math.round(finalMinute % 60), 0, 0);
    times.push(date);
  }

  return times;
}

const TRIAL_REMINDER_ID = 'trial-reminder';

export async function scheduleTrialReminder(): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  // Cancel any existing trial reminder before scheduling a new one
  await Notifications.cancelScheduledNotificationAsync(TRIAL_REMINDER_ID).catch(() => {});

  const reminderDate = new Date();
  reminderDate.setDate(reminderDate.getDate() + 6);
  reminderDate.setHours(10, 0, 0, 0);

  await Notifications.scheduleNotificationAsync({
    identifier: TRIAL_REMINDER_ID,
    content: {
      title: 'Your free trial ends tomorrow',
      body: "Just a heads up — your Whisper Pro trial wraps up tomorrow. No action needed if you'd like to continue.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
    },
  });
}

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Cancels everything except the trial reminder, then schedules personalized
// quote notifications for the next DAYS_AHEAD days.
async function rescheduleQuoteNotifications(
  perDay: number,
  startHour: number,
  endHour: number,
  interests: string[] | undefined,
): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier !== TRIAL_REMINDER_ID)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );

  const quotes = pickPersonalQuotes(interests, perDay * DAYS_AHEAD);

  for (let day = 0; day < DAYS_AHEAD; day++) {
    const times = computeTimes(perDay, startHour, endHour, day + 1);
    for (let i = 0; i < perDay; i++) {
      const quote = quotes[day * perDay + i];
      if (!quote) break;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Whisper',
          body: `"${quote.text}" — ${quote.author}`,
          data: { quoteId: quote.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: times[i],
        },
      });
    }
  }
}

export async function scheduleQuoteNotifications(
  perDay: number,
  startHour: number,
  endHour: number,
  interests: string[] | undefined,
): Promise<void> {
  await saveNotificationPrefs({ perDay, startHour, endHour });
  await rescheduleQuoteNotifications(perDay, startHour, endHour, interests);
}

// Re-picks and re-schedules upcoming notifications using the latest
// swipe-learned weights. Called on app open; a no-op until the user has
// enabled notifications (no saved prefs or no permission).
export async function refreshQuoteNotifications(
  interests: string[] | undefined,
): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  // Respect the per-user quotes toggle (independent of message notifications).
  if (!(await loadQuotesNotifEnabled())) return;

  const prefs = await loadNotificationPrefs();
  if (!prefs) return;

  await rescheduleQuoteNotifications(prefs.perDay, prefs.startHour, prefs.endHour, interests);
}

const DEFAULT_QUOTE_PREFS = { perDay: 3, startHour: 9, endHour: 21 };

// Cancels all scheduled quote notifications (keeps the trial reminder).
export async function cancelQuoteNotifications(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier !== TRIAL_REMINDER_ID)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

// Settings toggle for daily quote notifications.
export async function setQuotesNotificationsEnabled(
  enabled: boolean,
  interests: string[] | undefined,
): Promise<void> {
  await saveQuotesNotifEnabled(enabled);
  if (enabled) {
    const prefs = (await loadNotificationPrefs()) ?? DEFAULT_QUOTE_PREFS;
    await scheduleQuoteNotifications(prefs.perDay, prefs.startHour, prefs.endHour, interests);
  } else {
    await cancelQuoteNotifications();
  }
}
