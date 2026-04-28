import { type Session, dayKey, startOfDay } from "./sessionStore";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Daily streak: number of consecutive days (including today) on which the
 * user logged at least one session of >= minSec seconds.
 */
export function computeStreak(sessions: Session[], minSec = 60): number {
  if (sessions.length === 0) return 0;
  const days = new Set<string>();
  for (const s of sessions) {
    if (s.durationSec >= minSec) days.add(dayKey(s.startedAt));
  }
  if (days.size === 0) return 0;

  const today = startOfDay(Date.now());
  let streak = 0;
  let cursor = today;

  // If today has no qualifying session, allow yesterday to start the streak
  if (!days.has(dayKey(cursor))) {
    cursor -= ONE_DAY_MS;
    if (!days.has(dayKey(cursor))) return 0;
  }

  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor -= ONE_DAY_MS;
  }
  return streak;
}

export function todayStats(sessions: Session[]) {
  const today = startOfDay(Date.now());
  const todays = sessions.filter((s) => startOfDay(s.startedAt) === today);
  const totalSec = todays.reduce((a, s) => a + s.durationSec, 0);
  const goodSec = todays.reduce((a, s) => a + s.goodSec, 0);
  const fairSec = todays.reduce((a, s) => a + s.fairSec, 0);
  const badSec = todays.reduce((a, s) => a + s.badSec, 0);
  const avgScore =
    todays.length === 0
      ? 0
      : Math.round(todays.reduce((a, s) => a + s.avgScore, 0) / todays.length);
  return {
    sessionCount: todays.length,
    totalSec,
    goodSec,
    fairSec,
    badSec,
    avgScore,
    goodRatio: totalSec > 0 ? goodSec / totalSec : 0,
  };
}

export function lastNDays(sessions: Session[], n: number) {
  const today = startOfDay(Date.now());
  const buckets: Array<{ day: string; label: string; minutes: number; avgScore: number; sessions: number }> = [];
  for (let i = n - 1; i >= 0; i--) {
    const day = today - i * ONE_DAY_MS;
    const key = dayKey(day);
    const dayDate = new Date(day);
    const dailySessions = sessions.filter((s) => dayKey(s.startedAt) === key);
    const minutes = dailySessions.reduce((a, s) => a + s.durationSec / 60, 0);
    const avgScore =
      dailySessions.length === 0
        ? 0
        : Math.round(
            dailySessions.reduce((a, s) => a + s.avgScore, 0) /
              dailySessions.length,
          );
    buckets.push({
      day: key,
      label: dayDate.toLocaleDateString(undefined, { weekday: "short" }),
      minutes: Math.round(minutes * 10) / 10,
      avgScore,
      sessions: dailySessions.length,
    });
  }
  return buckets;
}
