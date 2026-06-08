import { storage } from './mmkv';

const KEY_TRIAL_ENDS_AT = 'trial.endsAt';

// 30-day goodwill trial gifted to existing freemium users at the v2 migration.
export const TRIAL_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export function getTrialEndsAt(): number | null {
  return storage.getNumber(KEY_TRIAL_ENDS_AT) ?? null;
}

export function setTrialEndsAt(endsAt: number): void {
  storage.set(KEY_TRIAL_ENDS_AT, endsAt);
}

export function isTrialActive(endsAt: number | null | undefined): boolean {
  return endsAt != null && Date.now() < endsAt;
}
