import { type Session, dayKey, startOfDay } from "@/features/sessions/sessionStore";

export type GoalProgress = {
  goalMin: number;
  goodMin: number;
  totalMin: number;
  progress: number; // 0..1
  hit: boolean;
};

export function todayGoalProgress(sessions: Session[], goalMin: number): GoalProgress {
  const today = startOfDay(Date.now());
  const todays = sessions.filter((s) => startOfDay(s.startedAt) === today);
  const goodSec = todays.reduce((a, s) => a + s.goodSec, 0);
  const totalSec = todays.reduce((a, s) => a + s.durationSec, 0);
  const goodMin = goodSec / 60;
  const progress = goalMin > 0 ? Math.min(1, goodMin / goalMin) : 0;
  return {
    goalMin,
    goodMin: Math.round(goodMin * 10) / 10,
    totalMin: Math.round((totalSec / 60) * 10) / 10,
    progress,
    hit: goalMin > 0 && goodMin >= goalMin,
  };
}

/**
 * Count how many days in history hit the daily good-posture goal.
 */
export function countGoalDays(sessions: Session[], goalMin: number): number {
  if (goalMin <= 0) return 0;
  const byDay = new Map<string, number>();
  for (const s of sessions) {
    const k = dayKey(s.startedAt);
    byDay.set(k, (byDay.get(k) ?? 0) + s.goodSec / 60);
  }
  let count = 0;
  for (const [, mins] of byDay) {
    if (mins >= goalMin) count += 1;
  }
  return count;
}
