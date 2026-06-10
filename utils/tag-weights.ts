import { getJSON, setJSON, storage } from './mmkv';

const KEY_WEIGHTS = 'tag.weights.v1';
const KEY_LAST_DECAY = 'tag.weights.lastDecay.v1';
const KEY_SWIPES = 'swipes.v1';
const KEY_SEEN = 'seen.v1';

const LIKE_BUMP = 2;
const SKIP_PENALTY = -1;
const DECAY_FACTOR = 0.95;
const SWIPE_HISTORY_CAP = 1000;
const SEEN_CAP = 500;

export type SwipeDir = 'like' | 'skip';

export interface SwipeRecord {
  quoteId: string;
  dir: SwipeDir;
  ts: number;
}

export function getWeights(): Record<string, number> {
  return getJSON<Record<string, number>>(KEY_WEIGHTS) ?? {};
}

function setWeights(w: Record<string, number>): void {
  setJSON(KEY_WEIGHTS, w);
}

export function recordSwipe(quoteId: string, tags: string[] | undefined, dir: SwipeDir): void {
  const weights = getWeights();
  const delta = dir === 'like' ? LIKE_BUMP : SKIP_PENALTY;
  if (tags && tags.length > 0) {
    // Don't learn on a parent tag when a more specific child is present
    // (theme:faith alongside theme:faith:christianity): every specific-faith
    // quote carries the generic tag, so learning it would boost other
    // religions' quotes too. The generic weight should only grow from quotes
    // tagged with the parent alone.
    const specificTags = tags.filter(
      (t) => !tags.some((other) => other !== t && other.startsWith(t + ':')),
    );
    for (const tag of specificTags) {
      weights[tag] = (weights[tag] ?? 0) + delta;
    }
    setWeights(weights);
  }

  const history = getJSON<SwipeRecord[]>(KEY_SWIPES) ?? [];
  history.push({ quoteId, dir, ts: Date.now() });
  if (history.length > SWIPE_HISTORY_CAP) {
    history.splice(0, history.length - SWIPE_HISTORY_CAP);
  }
  setJSON(KEY_SWIPES, history);
}

export function getSeenIds(): string[] {
  return getJSON<string[]>(KEY_SEEN) ?? [];
}

export function markSeen(ids: string[]): void {
  const seen = getSeenIds();
  const next = [...seen, ...ids];
  if (next.length > SEEN_CAP) {
    next.splice(0, next.length - SEEN_CAP);
  }
  setJSON(KEY_SEEN, next);
}

function isoWeek(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${weekNum}`;
}

export function applyWeeklyDecayIfNeeded(): void {
  const thisWeek = isoWeek(new Date());
  const lastWeek = storage.getString(KEY_LAST_DECAY);
  if (lastWeek === thisWeek) return;

  const weights = getWeights();
  const decayed: Record<string, number> = {};
  for (const [tag, score] of Object.entries(weights)) {
    const next = score * DECAY_FACTOR;
    if (Math.abs(next) >= 0.01) decayed[tag] = next;
  }
  setWeights(decayed);
  storage.set(KEY_LAST_DECAY, thisWeek);
}

export function resetAllForDebug(): void {
  storage.delete(KEY_WEIGHTS);
  storage.delete(KEY_LAST_DECAY);
  storage.delete(KEY_SWIPES);
  storage.delete(KEY_SEEN);
}

const KEY_DECK_HINT_SEEN = 'hint.deckSwipeSeen.v1';

export function hasSeenDeckHint(): boolean {
  return storage.getBoolean(KEY_DECK_HINT_SEEN) ?? false;
}

export function markDeckHintSeen(): void {
  storage.set(KEY_DECK_HINT_SEEN, true);
}
