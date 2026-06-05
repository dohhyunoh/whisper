import { useEffect, useState } from 'react';

function msUntilNextMidnight(now: Date = new Date()): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

function formatHM(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

export function useCountdownToMidnight(): string {
  const [label, setLabel] = useState(() => formatHM(msUntilNextMidnight()));

  useEffect(() => {
    const tick = () => setLabel(formatHM(msUntilNextMidnight()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return label;
}
