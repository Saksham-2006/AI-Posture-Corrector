import type { Session } from "@/features/sessions/sessionStore";

export type XPState = {
  totalXP: number;
  level: number;
  inLevelXP: number;
  nextLevelXP: number;
  progress: number; // 0..1 within current level
};

const SESSION_BONUS = 50;
const GOOD_PER_SEC = 1;
const FAIR_PER_SEC = 0.4;

/**
 * Triangular leveling curve:
 *   total XP needed to *finish* level L = 100 * L * (L+1) / 2
 *   so level 1 ends at 100, level 2 ends at 300, level 3 ends at 600...
 */
function totalForLevel(level: number) {
  return Math.round((100 * level * (level + 1)) / 2);
}

export function levelFromXP(xp: number): number {
  // Solve L^2 + L - 2 xp/100 = 0 => L = (-1 + sqrt(1 + 8 xp/100)) / 2
  if (xp <= 0) return 1;
  const L = Math.floor((-1 + Math.sqrt(1 + (8 * xp) / 100)) / 2) + 1;
  return Math.max(1, L);
}

export function computeXP(sessions: Session[], dailyGoalHits = 0): XPState {
  let total = 0;
  for (const s of sessions) {
    total += s.goodSec * GOOD_PER_SEC;
    total += s.fairSec * FAIR_PER_SEC;
    if (s.durationSec >= 30) total += SESSION_BONUS;
  }
  total += dailyGoalHits * 100;
  total = Math.round(total);

  const level = levelFromXP(total);
  const prevTotal = level === 1 ? 0 : totalForLevel(level - 1);
  const thisTotal = totalForLevel(level);
  const inLevel = total - prevTotal;
  const span = thisTotal - prevTotal;
  return {
    totalXP: total,
    level,
    inLevelXP: inLevel,
    nextLevelXP: span,
    progress: Math.max(0, Math.min(1, inLevel / span)),
  };
}

export function levelTitle(level: number): string {
  if (level >= 25) return "Posture Sage";
  if (level >= 18) return "Aligned Master";
  if (level >= 12) return "Spine Veteran";
  if (level >= 8) return "Steady Sitter";
  if (level >= 5) return "Posture Apprentice";
  if (level >= 3) return "Mindful Sitter";
  return "Beginner";
}
