export function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const sorted = [...new Set(dates)].sort().reverse();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const topDate = new Date(sorted[0] + 'T00:00:00');
  const diffFromToday = Math.round((today.getTime() - topDate.getTime()) / (1000 * 60 * 60 * 24));

  // Most recent date must be today or yesterday
  if (diffFromToday > 1) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00');
    const curr = new Date(sorted[i] + 'T00:00:00');
    const diff = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Current consecutive run of the same mood ending today (or yesterday).
 * Returns null if history is empty or the most recent entry is older than yesterday.
 */
export function computeMoodStreak(
  history: { date: string; mood: string }[],
): { mood: string; count: number } | null {
  if (history.length === 0) return null;

  const sorted = [...history].sort((a, b) => (a.date < b.date ? 1 : -1));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const topDate = new Date(sorted[0].date + 'T00:00:00');
  const diffFromToday = Math.round((today.getTime() - topDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffFromToday > 1) return null;

  const mood = sorted[0].mood;
  let count = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].mood !== mood) break;
    const prev = new Date(sorted[i - 1].date + 'T00:00:00');
    const curr = new Date(sorted[i].date + 'T00:00:00');
    const diff = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
    if (diff !== 1) break;
    count++;
  }
  return { mood, count };
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
