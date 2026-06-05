import { storage } from './mmkv';

const KEY_V2_MIGRATION_SEEN = 'migration.v2.seen';

export function hasSeenV2Migration(): boolean {
  return storage.getBoolean(KEY_V2_MIGRATION_SEEN) ?? false;
}

export function markV2MigrationSeen(): void {
  storage.set(KEY_V2_MIGRATION_SEEN, true);
}
