import { LMK, type Landmark } from "./landmarks";

export type PostureMetrics = {
  neckTiltDeg: number; // angle from vertical of mid-shoulder -> mid-ear
  shoulderTiltDeg: number; // angle of shoulder line vs horizontal
  forwardHeadRatio: number; // |ear.x - shoulder.x| / shoulderWidth
  spineAngleDeg: number; // angle from vertical of mid-hip -> mid-shoulder
  visibility: number; // 0..1 average visibility of key joints
  hipsVisible: boolean;
};

const VIS_THRESHOLD = 0.5;

function midpoint(a: Landmark, b: Landmark) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function angleFromVerticalDeg(dx: number, dy: number) {
  // dy positive points down in image coords; we want angle from vertical (up)
  // vertical (up) = (0, -1). Use absolute deviation.
  const len = Math.hypot(dx, dy) || 1e-9;
  // Component along vertical-up axis = -dy / len
  const cos = -dy / len;
  const clamped = Math.max(-1, Math.min(1, cos));
  return (Math.acos(clamped) * 180) / Math.PI;
}

function angleFromHorizontalDeg(dx: number, dy: number) {
  const len = Math.hypot(dx, dy) || 1e-9;
  // horizontal axis = (1, 0); use absolute angle so left/right symmetric
  const cos = Math.abs(dx) / len;
  const clamped = Math.max(-1, Math.min(1, cos));
  return (Math.acos(clamped) * 180) / Math.PI;
}

export function computeMetrics(landmarks: Landmark[] | null | undefined): PostureMetrics | null {
  if (!landmarks || landmarks.length < 25) return null;

  const lShoulder = landmarks[LMK.LEFT_SHOULDER];
  const rShoulder = landmarks[LMK.RIGHT_SHOULDER];
  const lEar = landmarks[LMK.LEFT_EAR];
  const rEar = landmarks[LMK.RIGHT_EAR];
  const lHip = landmarks[LMK.LEFT_HIP];
  const rHip = landmarks[LMK.RIGHT_HIP];

  if (!lShoulder || !rShoulder || !lEar || !rEar) return null;

  const shoulderVis = ((lShoulder.visibility ?? 0) + (rShoulder.visibility ?? 0)) / 2;
  const earVis = ((lEar.visibility ?? 0) + (rEar.visibility ?? 0)) / 2;

  if (shoulderVis < VIS_THRESHOLD || earVis < VIS_THRESHOLD) return null;

  const midShoulder = midpoint(lShoulder, rShoulder);
  const midEar = midpoint(lEar, rEar);

  const shoulderWidth = Math.hypot(rShoulder.x - lShoulder.x, rShoulder.y - lShoulder.y) || 1e-6;

  // Neck tilt: vector from mid-shoulder to mid-ear, deviation from vertical
  const neckDx = midEar.x - midShoulder.x;
  const neckDy = midEar.y - midShoulder.y;
  const neckTiltDeg = angleFromVerticalDeg(neckDx, neckDy);

  // Shoulder tilt: how far is the shoulder line from horizontal
  const shoulderTiltDeg = angleFromHorizontalDeg(
    rShoulder.x - lShoulder.x,
    rShoulder.y - lShoulder.y,
  );

  // Forward head: horizontal offset of head over shoulders, normalized
  const forwardHeadRatio = Math.abs(midEar.x - midShoulder.x) / shoulderWidth;

  // Spine angle: hips visible? if so, mid-hip -> mid-shoulder vs vertical
  const hipVisL = lHip?.visibility ?? 0;
  const hipVisR = rHip?.visibility ?? 0;
  const hipsVisible = hipVisL >= VIS_THRESHOLD && hipVisR >= VIS_THRESHOLD && !!lHip && !!rHip;
  let spineAngleDeg = 0;
  if (hipsVisible && lHip && rHip) {
    const midHip = midpoint(lHip, rHip);
    spineAngleDeg = angleFromVerticalDeg(
      midShoulder.x - midHip.x,
      midShoulder.y - midHip.y,
    );
  }

  const visibility = Math.min(
    1,
    (shoulderVis + earVis + (hipsVisible ? (hipVisL + hipVisR) / 2 : 0.5)) / 3,
  );

  return {
    neckTiltDeg,
    shoulderTiltDeg,
    forwardHeadRatio,
    spineAngleDeg,
    visibility,
    hipsVisible,
  };
}
