import { type Session, dayKey } from "@/features/sessions/sessionStore";

export type Insight = {
  id: string;
  emoji: string;
  title: string;
  body: string;
  tone: "good" | "neutral" | "warn";
};

const HOUR_BUCKETS: Array<{ name: string; from: number; to: number }> = [
  { name: "morning", from: 5, to: 12 },
  { name: "afternoon", from: 12, to: 17 },
  { name: "evening", from: 17, to: 22 },
  { name: "night", from: 22, to: 29 }, // wraps
];

function bucketForHour(hour: number) {
  for (const b of HOUR_BUCKETS) {
    if (b.to <= 24) {
      if (hour >= b.from && hour < b.to) return b.name;
    } else {
      // night wraps past midnight
      if (hour >= b.from || hour < b.to - 24) return b.name;
    }
  }
  return "morning";
}

function avg(nums: number[]) {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function generateInsights(sessions: Session[]): Insight[] {
  if (sessions.length === 0) {
    return [
      {
        id: "empty",
        emoji: "👋",
        title: "Run a session to unlock insights",
        body: "After your first session, this panel surfaces patterns in your posture across times of day, weekdays, and weeks.",
        tone: "neutral",
      },
    ];
  }

  const insights: Insight[] = [];

  // 1. Time-of-day comparison (morning vs evening)
  const tod: Record<string, number[]> = {};
  for (const s of sessions) {
    for (const sample of s.samples) {
      const ts = s.startedAt + sample.t * 1000;
      const hour = new Date(ts).getHours();
      const b = bucketForHour(hour);
      (tod[b] ??= []).push(sample.score);
    }
  }
  const todAvg = Object.entries(tod)
    .filter(([, v]) => v.length >= 5)
    .map(([k, v]) => ({ k, avg: avg(v) }));

  if (todAvg.length >= 2) {
    const best = [...todAvg].sort((a, b) => b.avg - a.avg)[0];
    const worst = [...todAvg].sort((a, b) => a.avg - b.avg)[0];
    if (best.k !== worst.k && best.avg - worst.avg >= 6) {
      insights.push({
        id: "tod",
        emoji: best.avg > worst.avg ? "🌅" : "🌙",
        title: `You sit best in the ${best.k}`,
        body: `Your posture averages ${Math.round(best.avg)} in the ${best.k} but dips to ${Math.round(worst.avg)} by ${worst.k}. Consider a short stretch break before your ${worst.k} sessions.`,
        tone: "neutral",
      });
    }
  }

  // 2. Week-over-week trend
  const sortedByTime = [...sessions].sort((a, b) => a.startedAt - b.startedAt);
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  const lastWeek = sortedByTime.filter((s) => s.startedAt >= now - week);
  const prevWeek = sortedByTime.filter(
    (s) => s.startedAt >= now - 2 * week && s.startedAt < now - week,
  );
  if (lastWeek.length >= 2 && prevWeek.length >= 2) {
    const a1 = avg(lastWeek.map((s) => s.avgScore));
    const a0 = avg(prevWeek.map((s) => s.avgScore));
    const diff = a1 - a0;
    const pct = a0 > 0 ? (diff / a0) * 100 : 0;
    if (Math.abs(pct) >= 3) {
      insights.push({
        id: "wow",
        emoji: diff > 0 ? "📈" : "📉",
        title:
          diff > 0
            ? `Posture up ${Math.round(pct)}% this week`
            : `Posture down ${Math.abs(Math.round(pct))}% this week`,
        body:
          diff > 0
            ? `Your average score climbed from ${Math.round(a0)} to ${Math.round(a1)}. Keep doing whatever you changed — it's working.`
            : `Your average score slipped from ${Math.round(a0)} to ${Math.round(a1)}. A short walk or break between sessions can help.`,
        tone: diff > 0 ? "good" : "warn",
      });
    }
  }

  // 3. Best day of week
  const byDow = new Map<number, number[]>();
  for (const s of sessions) {
    const d = new Date(s.startedAt).getDay();
    const arr = byDow.get(d) ?? [];
    arr.push(s.avgScore);
    byDow.set(d, arr);
  }
  if (byDow.size >= 3) {
    const ranked = [...byDow.entries()]
      .filter(([, v]) => v.length >= 1)
      .map(([d, v]) => ({ d, avg: avg(v) }))
      .sort((a, b) => b.avg - a.avg);
    if (ranked.length >= 2 && ranked[0].avg - ranked[ranked.length - 1].avg >= 6) {
      const dayName = new Date(2024, 0, ranked[0].d === 0 ? 7 : ranked[0].d).toLocaleDateString(undefined, { weekday: "long" });
      insights.push({
        id: "dow",
        emoji: "📅",
        title: `${dayName}s are your strongest day`,
        body: `On ${dayName}s your average posture score is ${Math.round(ranked[0].avg)}. Try to mirror that day's routine on weaker days.`,
        tone: "good",
      });
    }
  }

  // 4. Consistency
  const cons = consistencyScore(sessions);
  if (sessions.length >= 4) {
    if (cons >= 80) {
      insights.push({
        id: "consist-high",
        emoji: "🪷",
        title: "Steady and consistent",
        body: `Your sessions land in a tight ${cons}/100 consistency band. That means your habits are really starting to stick.`,
        tone: "good",
      });
    } else if (cons < 55) {
      insights.push({
        id: "consist-low",
        emoji: "🌊",
        title: "Sessions vary a lot",
        body: `Your consistency score is ${cons}/100. Try shorter, more regular sessions to smooth out the spikes and dips.`,
        tone: "warn",
      });
    }
  }

  // 5. Longest streak
  const lgs = longestGoodStreak(sessions);
  if (lgs >= 600) {
    const min = Math.floor(lgs / 60);
    insights.push({
      id: "streak",
      emoji: "🏔️",
      title: `Your longest good run was ${min} minutes`,
      body: `You held good posture for ${min} straight minutes — that's well above average. Try to beat it next session.`,
      tone: "good",
    });
  }

  // 6. Frequency
  const lastSevenDays = new Set<string>();
  for (const s of sessions) {
    const ageDays = (now - s.startedAt) / (24 * 60 * 60 * 1000);
    if (ageDays <= 7) lastSevenDays.add(dayKey(s.startedAt));
  }
  if (lastSevenDays.size >= 5) {
    insights.push({
      id: "freq",
      emoji: "🔥",
      title: `Active ${lastSevenDays.size} of the last 7 days`,
      body: `You're showing up almost every day. Frequent short check-ins are how lasting posture habits form.`,
      tone: "good",
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "more",
      emoji: "🧠",
      title: "Keep going to unlock more insights",
      body: "After a few more sessions, we'll start spotting patterns in your daily and weekly posture.",
      tone: "neutral",
    });
  }

  return insights;
}

export function consistencyScore(sessions: Session[]): number {
  if (sessions.length < 2) return sessions.length === 1 ? 50 : 0;
  const scores = sessions.map((s) => s.avgScore);
  const mean = avg(scores);
  const variance = avg(scores.map((s) => (s - mean) ** 2));
  const stdev = Math.sqrt(variance);
  // Map: stdev 0 -> 100, stdev 25+ -> 0
  return Math.max(0, Math.min(100, Math.round(100 - (stdev / 25) * 100)));
}

export function longestGoodStreak(sessions: Session[]): number {
  let best = 0;
  for (const s of sessions) {
    let runStart: number | null = null;
    for (const sample of s.samples) {
      if (sample.cls === "good") {
        if (runStart === null) runStart = sample.t;
        const len = sample.t - runStart;
        if (len > best) best = len;
      } else {
        runStart = null;
      }
    }
  }
  return best;
}

/**
 * Average time (seconds) it takes to recover from "bad" → "good" within sessions.
 */
export function averageCorrectionTime(sessions: Session[]): number | null {
  const corrections: number[] = [];
  for (const s of sessions) {
    let badStart: number | null = null;
    for (const sample of s.samples) {
      if (sample.cls === "bad") {
        if (badStart === null) badStart = sample.t;
      } else if (sample.cls === "good" && badStart !== null) {
        corrections.push(sample.t - badStart);
        badStart = null;
      }
    }
  }
  if (corrections.length === 0) return null;
  return Math.round(corrections.reduce((a, b) => a + b, 0) / corrections.length);
}

/**
 * Build a 7-day × 24-hour heatmap of average posture score per cell.
 * Returns rows for the last 7 days (oldest first), each row 24 cells.
 */
export type HeatCell = { score: number | null; samples: number };
export type HeatmapData = {
  rows: Array<{ label: string; isToday: boolean; cells: HeatCell[] }>;
};

export function buildHeatmap(sessions: Session[]): HeatmapData {
  const dayMs = 24 * 60 * 60 * 1000;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // grid[dayOffset][hour] = list of scores
  const grid: number[][][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => []),
  );

  for (const s of sessions) {
    for (const sample of s.samples) {
      const ts = s.startedAt + sample.t * 1000;
      const sampleDate = new Date(ts);
      sampleDate.setHours(0, 0, 0, 0);
      const offset = Math.round((now.getTime() - sampleDate.getTime()) / dayMs);
      if (offset < 0 || offset >= 7) continue;
      const hour = new Date(ts).getHours();
      grid[6 - offset][hour].push(sample.score);
    }
  }

  const rows = grid.map((dayCells, idx) => {
    const dayDate = new Date(now.getTime() - (6 - idx) * dayMs);
    const isToday = idx === 6;
    return {
      label: dayDate.toLocaleDateString(undefined, { weekday: "short" }),
      isToday,
      cells: dayCells.map((scores) => ({
        score: scores.length === 0 ? null : Math.round(avg(scores)),
        samples: scores.length,
      })),
    };
  });

  return { rows };
}
