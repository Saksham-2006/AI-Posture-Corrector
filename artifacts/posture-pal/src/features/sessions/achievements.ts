import type { Session } from "./sessionStore";
import { computeStreak } from "./streak";

export type Achievement = {
  id: string;
  title: string;
  description: string;
  unlockedAt?: number;
  progress: number; // 0..1
};

export type AchievementDef = {
  id: string;
  title: string;
  description: string;
  evaluate: (sessions: Session[]) => { unlocked: boolean; progress: number; unlockedAt?: number };
};

const TEN_MIN = 10 * 60;
const ONE_HOUR = 60 * 60;

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: "first-session",
    title: "First Session",
    description: "Complete your first posture session.",
    evaluate: (sessions) => {
      const first = sessions[0];
      return {
        unlocked: sessions.length > 0,
        progress: Math.min(1, sessions.length),
        unlockedAt: first?.endedAt,
      };
    },
  },
  {
    id: "ten-min-good",
    title: "Steady Ten",
    description: "Maintain good posture for 10 minutes within a single session.",
    evaluate: (sessions) => {
      let best = 0;
      let unlockedAt: number | undefined;
      for (const s of sessions) {
        // Approximate longest good streak from samples
        const longest = longestGoodStreakSeconds(s);
        if (longest > best) {
          best = longest;
          if (longest >= TEN_MIN) unlockedAt = s.endedAt;
        }
      }
      return {
        unlocked: best >= TEN_MIN,
        progress: Math.min(1, best / TEN_MIN),
        unlockedAt,
      };
    },
  },
  {
    id: "hour-club",
    title: "Hour Club",
    description: "Accumulate 1 hour of total session time.",
    evaluate: (sessions) => {
      const total = sessions.reduce((a, s) => a + s.durationSec, 0);
      const unlockedSession = (() => {
        let acc = 0;
        for (const s of sessions) {
          acc += s.durationSec;
          if (acc >= ONE_HOUR) return s;
        }
        return undefined;
      })();
      return {
        unlocked: total >= ONE_HOUR,
        progress: Math.min(1, total / ONE_HOUR),
        unlockedAt: unlockedSession?.endedAt,
      };
    },
  },
  {
    id: "streak-3",
    title: "Three in a Row",
    description: "Use Posture Pal three days in a row.",
    evaluate: (sessions) => {
      const streak = computeStreak(sessions);
      return { unlocked: streak >= 3, progress: Math.min(1, streak / 3) };
    },
  },
  {
    id: "streak-7",
    title: "Week Warrior",
    description: "Use Posture Pal seven days in a row.",
    evaluate: (sessions) => {
      const streak = computeStreak(sessions);
      return { unlocked: streak >= 7, progress: Math.min(1, streak / 7) };
    },
  },
  {
    id: "score-90",
    title: "Aligned",
    description: "Finish a session with an average score of 90 or higher.",
    evaluate: (sessions) => {
      let best = 0;
      let unlockedAt: number | undefined;
      for (const s of sessions) {
        if (s.avgScore > best) {
          best = s.avgScore;
          if (best >= 90) unlockedAt = s.endedAt;
        }
      }
      return {
        unlocked: best >= 90,
        progress: Math.min(1, best / 90),
        unlockedAt,
      };
    },
  },
];

function longestGoodStreakSeconds(s: Session): number {
  if (!s.samples || s.samples.length === 0) return 0;
  let best = 0;
  let runStart: number | null = null;
  for (let i = 0; i < s.samples.length; i++) {
    const sample = s.samples[i];
    if (sample.cls === "good") {
      if (runStart === null) runStart = sample.t;
      const length = sample.t - runStart;
      if (length > best) best = length;
    } else {
      runStart = null;
    }
  }
  return best;
}

export function evaluateAchievements(sessions: Session[]): Achievement[] {
  // Sort sessions chronologically once
  const sorted = [...sessions].sort((a, b) => a.startedAt - b.startedAt);
  return ACHIEVEMENT_DEFS.map((def) => {
    const r = def.evaluate(sorted);
    return {
      id: def.id,
      title: def.title,
      description: def.description,
      progress: r.progress,
      unlockedAt: r.unlocked ? r.unlockedAt ?? Date.now() : undefined,
    };
  });
}
