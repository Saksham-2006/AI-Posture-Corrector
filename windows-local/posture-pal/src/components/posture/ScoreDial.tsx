import { motion } from "framer-motion";
import { useMemo } from "react";
import type { PostureClass } from "@/features/sessions/sessionStore";

type Props = {
  score: number;
  postureClass: PostureClass | null;
  size?: number;
  label?: string;
};

const RING_COLORS: Record<PostureClass, string> = {
  good: "hsl(160 65% 50%)",
  fair: "hsl(35 90% 60%)",
  bad: "hsl(355 75% 60%)",
};

export function ScoreDial({ score, postureClass, size = 180, label }: Props) {
  const stroke = Math.round(size * 0.09);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score || 0));
  const offset = useMemo(
    () => circumference * (1 - clamped / 100),
    [circumference, clamped],
  );

  const color = postureClass ? RING_COLORS[postureClass] : "hsl(var(--muted-foreground))";

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
          style={{ filter: `drop-shadow(0 0 12px ${color}55)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          key={Math.round(clamped)}
          initial={{ y: 6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="text-5xl font-bold tabular-nums tracking-tight"
        >
          {Math.round(clamped)}
        </motion.div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
          {label ?? "Posture"}
        </div>
      </div>
    </div>
  );
}
