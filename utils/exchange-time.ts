// "fades in 5h" labels for exchange notes. Notes are ephemeral by design
// (posts live 24h, replies die with their post — migration 0011); this makes
// that lifetime visible instead of letting notes vanish unexplained.

export function fadesInLabel(expiresAt: string | undefined | null): string | null {
  if (!expiresAt) return null;
  const t = new Date(expiresAt).getTime();
  if (!isFinite(t)) return null; // 'infinity' → permanent seed content, say nothing
  const hours = (t - Date.now()) / 3_600_000;
  if (hours <= 0) return null;
  if (hours > 48) return null; // far-future = effectively permanent
  if (hours < 1) return 'fades within the hour';
  return `fades in ${Math.ceil(hours)}h`;
}
