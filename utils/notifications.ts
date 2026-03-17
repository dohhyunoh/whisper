import quotesData from '@/data/quotes';
import { Quote } from '@/data/types';
import { shuffle } from '@/utils/shuffle';
import { saveNotificationPrefs } from '@/utils/storage';
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

function filterByInterests(quotes: Quote[], interests: string[] | undefined): Quote[] {
  if (!interests || interests.length === 0) {
    return quotes;
  }
  return quotes.filter((q) => {
    for (const interest of interests) {
      if (interest.includes(':')) {
        const [category, sub] = interest.split(':');
        if (q.category === category && q.subcategory === sub) {
          return true;
        }
      } else {
        if (q.category === interest) {
          return true;
        }
      }
    }
    return false;
  });
}

function pickRandomQuotes(interests: string[] | undefined, count: number): Quote[] {
  const pool = filterByInterests(allQuotes, interests);
  const shuffled = shuffle(pool);
  return shuffled.slice(0, count);
}

function computeTimes(
  count: number,
  startHour: number,
  endHour: number,
): Date[] {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

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
  reminderDate.setDate(reminderDate.getDate() + 2);
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

export async function scheduleQuoteNotifications(
  perDay: number,
  startHour: number,
  endHour: number,
  interests: string[] | undefined,
): Promise<void> {
  // Cancel any previously scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Save preferences
  await saveNotificationPrefs({ perDay, startHour, endHour });

  // Pick random quotes
  const quotes = pickRandomQuotes(interests, perDay);
  const times = computeTimes(perDay, startHour, endHour);

  // Schedule each notification
  for (let i = 0; i < quotes.length; i++) {
    const quote = quotes[i];
    const time = times[i];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Whisper',
        body: `"${quote.text}" — ${quote.author}`,
        data: { quoteId: quote.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: time,
      },
    });
  }
}
