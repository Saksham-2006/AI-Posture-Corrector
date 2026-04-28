import type { PostureMetrics } from "./postureMetrics";

export type PostureClass = "good" | "fair" | "bad";

export type PostureThresholds = {
  goodCutoff: number; // >= => good
  badCutoff: number; // < => bad
};

export const DEFAULT_THRESHOLDS: PostureThresholds = {
  goodCutoff: 75,
  badCutoff: 60,
};

export type ScoreBreakdown = {
  total: number;
  neck: number;
  shoulder: number;
  forwardHead: number;
  spine: number;
};

/**
 * Penalty function: smooth, returns 1 at value=0 (perfect) decaying to 0 at maxBad.
 */
function softScore(value: number, idealMax: number, maxBad: number): number {
  if (value <= idealMax) return 1;
  if (value >= maxBad) return 0;
  const t = (value - idealMax) / (maxBad - idealMax);
  // ease-out quadratic from 1 -> 0
  return 1 - t * t;
}

/**
 * Combine sub-scores into a 0..100 posture score.
 * Weights sum to 1. Designed for upper-body-only seated framing.
 */
export function scorePosture(m: PostureMetrics): ScoreBreakdown {
  // Sub-scores (0..1)
  // Neck tilt: ideal ≤ 8°, very bad at 35°
  const neck = softScore(m.neckTiltDeg, 8, 35);
  // Shoulder tilt: ideal ≤ 4°, very bad at 18°
  const shoulder = softScore(m.shoulderTiltDeg, 4, 18);
  // Forward head: ideal ≤ 0.10 of shoulder width, very bad at 0.55
  const forwardHead = softScore(m.forwardHeadRatio, 0.1, 0.55);
  // Spine: only weighted if hips visible. Ideal ≤ 6°, very bad at 25°
  const spine = m.hipsVisible ? softScore(m.spineAngleDeg, 6, 25) : 1;

  const wNeck = 0.3;
  const wForward = 0.3;
  const wShoulder = 0.2;
  const wSpine = m.hipsVisible ? 0.2 : 0;
  const wTotal = wNeck + wForward + wShoulder + wSpine;

  const combined =
    (neck * wNeck +
      forwardHead * wForward +
      shoulder * wShoulder +
      spine * wSpine) /
    (wTotal || 1);

  const total = Math.round(combined * 100);

  return {
    total,
    neck: Math.round(neck * 100),
    shoulder: Math.round(shoulder * 100),
    forwardHead: Math.round(forwardHead * 100),
    spine: Math.round(spine * 100),
  };
}

export function classifyScore(
  score: number,
  thresholds: PostureThresholds = DEFAULT_THRESHOLDS,
  current?: PostureClass,
): PostureClass {
  // Hysteresis: when transitioning, require a small buffer to avoid flicker
  const buf = 3;
  if (current === "good") {
    if (score < thresholds.badCutoff - buf) return "bad";
    if (score < thresholds.goodCutoff - buf) return "fair";
    return "good";
  }
  if (current === "bad") {
    if (score >= thresholds.goodCutoff + buf) return "good";
    if (score >= thresholds.badCutoff + buf) return "fair";
    return "bad";
  }
  // fair or undefined
  if (score >= thresholds.goodCutoff) return "good";
  if (score < thresholds.badCutoff) return "bad";
  return "fair";
}
