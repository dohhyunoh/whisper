import { getTodayDateString } from '@/utils/streak';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Per-day exchange progress, kept out of the AppContext reducer (it doesn't
// drive global UI — only the exchange flow's own gates). Mirrors the check-in
// self-guard pattern in app/daily-check-in.tsx.
//
//   respondedToday → passed the gate (may unlock compose)
//   postedToday    → already put an answer in the pool (don't double-post)

const KEY = '@whisper_exchange_state';

interface ExchangeDayState {
  date: string;
  responded: boolean;
  posted: boolean;
}

async function read(): Promise<ExchangeDayState> {
  const today = getTodayDateString();
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ExchangeDayState;
      if (parsed.date === today) return parsed;
    }
  } catch {
    // fall through to a fresh day
  }
  return { date: today, responded: false, posted: false };
}

async function write(next: ExchangeDayState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // best-effort; the gate degrades to "ask again", never to "trapped"
  }
}

export async function getExchangeDayState(): Promise<{ responded: boolean; posted: boolean }> {
  const s = await read();
  return { responded: s.responded, posted: s.posted };
}

export async function markRespondedToday(): Promise<void> {
  const s = await read();
  await write({ ...s, responded: true });
}

export async function markPostedToday(): Promise<void> {
  const s = await read();
  await write({ ...s, posted: true });
}

// When the user last opened "Notes for you" — used to count unread replies for
// the deck badge. Replies newer than this are "unread".
const RECEIVED_SEEN_KEY = '@whisper_exchange_received_seen';

export async function getReceivedSeenAt(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(RECEIVED_SEEN_KEY);
  } catch {
    return null;
  }
}

export async function markReceivedSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(RECEIVED_SEEN_KEY, new Date().toISOString());
  } catch {
    // best-effort
  }
}
