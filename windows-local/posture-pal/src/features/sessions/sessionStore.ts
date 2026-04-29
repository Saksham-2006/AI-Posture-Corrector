export type PostureClass = "good" | "fair" | "bad";

export type SessionSample = {
  t: number; // seconds since session start
  score: number;
  cls: PostureClass;
};

export type Session = {
  id: string;
  startedAt: number; // epoch ms
  endedAt: number; // epoch ms
  durationSec: number;
  goodSec: number;
  fairSec: number;
  badSec: number;
  avgScore: number;
  samples: SessionSample[];
};

export const SESSIONS_KEY = "posture-pal:sessions:v1";
export const ACHIEVEMENTS_KEY = "posture-pal:achievements:v1";
export const SETTINGS_KEY = "posture-pal:settings:v1";
export const ONBOARDING_KEY = "posture-pal:onboarded:v1";

export function newSessionId(): string {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function readSessions(): Session[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Session[];
  } catch {
    return [];
  }
}

export function writeSessions(sessions: Session[]) {
  try {
    window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    /* ignore */
  }
}

export function appendSession(session: Session) {
  const all = readSessions();
  all.push(session);
  // Cap at most 500 sessions to prevent unbounded growth
  const trimmed = all.length > 500 ? all.slice(all.length - 500) : all;
  writeSessions(trimmed);
}

export function clearSessions() {
  try {
    window.localStorage.removeItem(SESSIONS_KEY);
    window.localStorage.removeItem(ACHIEVEMENTS_KEY);
  } catch {
    /* ignore */
  }
}

export function startOfDay(epochMs: number): number {
  const d = new Date(epochMs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function dayKey(epochMs: number): string {
  const d = new Date(epochMs);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
