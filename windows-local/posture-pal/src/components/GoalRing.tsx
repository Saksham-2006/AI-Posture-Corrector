import { motion } from "framer-motion";
import { Target, CheckCircle2 } from "lucide-react";

type Props = {
  goalMin: number;
  goodMin: number;
  size?: number;
};

export function GoalRing({ goalMin, goodMin, size = 132 }: Props) {
  const stroke = Math.round(size * 0.1);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = goalMin > 0 ? Math.min(1, goodMin / goalMin) : 0;
  const offset = circumference * (1 - progress);
  const hit = goalMin > 0 && goodMin >= goalMin;

  return (
    <div className="flex items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
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
            stroke={hit ? "hsl(160 60% 50%)" : "hsl(var(--primary))"}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={false}
            animate={{ strokeDashoffset: offset }}
            transition={{ type: "spring", stiffness: 70, damping: 18 }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          {hit ? (
            <CheckCircle2 className="h-7 w-7 text-emerald-500" />
          ) : (
            <Target className="h-5 w-5 text-primary" />
          )}
        </div>
      </div>
      <div className="flex-1">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Today's goal</div>
        <div className="mt-0.5 text-2xl font-semibold tabular-nums">
          {Math.round(goodMin)}<span className="text-muted-foreground">/{goalMin}</span> <span className="text-base font-medium text-muted-foreground">min</span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {hit ? "Goal reached — nice work." : `${Math.max(0, goalMin - Math.round(goodMin))} minutes of good posture to go.`}
        </div>
      </div>
    </div>
  );
}
