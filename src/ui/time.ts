import { useEffect, useState } from "react";

/** Re-renders every intervalMs (pass null to stop), for things that move with playback. */
export function useNow(intervalMs: number | null): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (intervalMs === null) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
