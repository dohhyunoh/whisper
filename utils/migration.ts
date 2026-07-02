import { storage } from './mmkv';

const KEY_V2_MIGRATION_SEEN = 'migration.v2.seen';
const KEY_EXCHANGE_ANNOUNCEMENT_SEEN = 'announcement.exchange.seen';

export function hasSeenV2Migration(): boolean {
  return storage.getBoolean(KEY_V2_MIGRATION_SEEN) ?? false;
}

export function markV2MigrationSeen(): void {
  storage.set(KEY_V2_MIGRATION_SEEN, true);
}

// One-time "write to a stranger" announcement for existing subscribers (new
// users see the feature in onboarding instead, so they mark it seen there).
export function hasSeenExchangeAnnouncement(): boolean {
  return storage.getBoolean(KEY_EXCHANGE_ANNOUNCEMENT_SEEN) ?? false;
}

export function markExchangeAnnouncementSeen(): void {
  storage.set(KEY_EXCHANGE_ANNOUNCEMENT_SEEN, true);
}
