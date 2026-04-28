// MediaPipe Pose landmark indices we care about
export const LMK = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
} as const;

// Connections for skeleton drawing — upper body only, since posture detection
// works seated and hips/legs are often out of frame.
export const SKELETON_EDGES: ReadonlyArray<readonly [number, number]> = [
  [LMK.LEFT_SHOULDER, LMK.RIGHT_SHOULDER],
  [LMK.LEFT_SHOULDER, LMK.LEFT_ELBOW],
  [LMK.LEFT_ELBOW, LMK.LEFT_WRIST],
  [LMK.RIGHT_SHOULDER, LMK.RIGHT_ELBOW],
  [LMK.RIGHT_ELBOW, LMK.RIGHT_WRIST],
  [LMK.LEFT_SHOULDER, LMK.LEFT_HIP],
  [LMK.RIGHT_SHOULDER, LMK.RIGHT_HIP],
  [LMK.LEFT_HIP, LMK.RIGHT_HIP],
  [LMK.LEFT_EAR, LMK.LEFT_SHOULDER],
  [LMK.RIGHT_EAR, LMK.RIGHT_SHOULDER],
  [LMK.LEFT_EAR, LMK.NOSE],
  [LMK.RIGHT_EAR, LMK.NOSE],
];

export const KEY_POINTS: ReadonlyArray<number> = [
  LMK.NOSE,
  LMK.LEFT_EYE,
  LMK.RIGHT_EYE,
  LMK.LEFT_EAR,
  LMK.RIGHT_EAR,
  LMK.LEFT_SHOULDER,
  LMK.RIGHT_SHOULDER,
  LMK.LEFT_ELBOW,
  LMK.RIGHT_ELBOW,
  LMK.LEFT_WRIST,
  LMK.RIGHT_WRIST,
  LMK.LEFT_HIP,
  LMK.RIGHT_HIP,
];

export type Landmark = {
  x: number;
  y: number;
  z: number;
  visibility?: number;
};
