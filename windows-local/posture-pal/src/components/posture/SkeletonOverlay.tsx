import { useEffect, useRef } from "react";
import { SKELETON_EDGES, KEY_POINTS, type Landmark } from "@/features/posture/landmarks";
import type { PostureClass } from "@/features/sessions/sessionStore";

type Props = {
  landmarks: Landmark[] | null;
  videoWidth: number;
  videoHeight: number;
  postureClass: PostureClass | null;
  mirrored?: boolean;
};

const COLORS: Record<PostureClass, { line: string; dot: string; glow: string }> = {
  good: { line: "#34D399", dot: "#10B981", glow: "rgba(52, 211, 153, 0.55)" },
  fair: { line: "#FBBF24", dot: "#F59E0B", glow: "rgba(251, 191, 36, 0.55)" },
  bad: { line: "#F87171", dot: "#EF4444", glow: "rgba(248, 113, 113, 0.55)" },
};

export function SkeletonOverlay({
  landmarks,
  videoWidth,
  videoHeight,
  postureClass,
  mirrored = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = videoWidth || canvas.clientWidth;
    const h = videoHeight || canvas.clientHeight;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;

    ctx.clearRect(0, 0, w, h);

    if (!landmarks || landmarks.length === 0) return;

    const colors = COLORS[postureClass ?? "fair"];

    const toX = (x: number) => (mirrored ? (1 - x) * w : x * w);
    const toY = (y: number) => y * h;

    // Draw edges
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = Math.max(3, w * 0.005);

    for (const [a, b] of SKELETON_EDGES) {
      const la = landmarks[a];
      const lb = landmarks[b];
      if (!la || !lb) continue;
      const va = la.visibility ?? 1;
      const vb = lb.visibility ?? 1;
      if (va < 0.4 || vb < 0.4) continue;
      ctx.beginPath();
      ctx.moveTo(toX(la.x), toY(la.y));
      ctx.lineTo(toX(lb.x), toY(lb.y));
      ctx.stroke();
    }

    // Draw points
    ctx.shadowBlur = 8;
    ctx.fillStyle = colors.dot;
    const r = Math.max(4, w * 0.007);
    for (const idx of KEY_POINTS) {
      const lm = landmarks[idx];
      if (!lm) continue;
      const v = lm.visibility ?? 1;
      if (v < 0.4) continue;
      ctx.beginPath();
      ctx.arc(toX(lm.x), toY(lm.y), r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
  }, [landmarks, videoWidth, videoHeight, postureClass, mirrored]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full pointer-events-none"
      style={{ objectFit: "cover" }}
    />
  );
}
