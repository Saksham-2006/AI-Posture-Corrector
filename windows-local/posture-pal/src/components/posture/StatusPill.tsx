import { motion } from "framer-motion";
import { Check, AlertTriangle, Activity } from "lucide-react";
import type { PostureClass } from "@/features/sessions/sessionStore";
import { cn } from "@/lib/utils";

type Props = {
  postureClass: PostureClass | null;
  confidence?: number;
};

const CONFIG: Record<
  PostureClass,
  { label: string; bg: string; text: string; ring: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  good: {
    label: "Good Posture",
    bg: "bg-emerald-100/80 dark:bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-300",
    ring: "ring-emerald-500/30",
    Icon: Check,
  },
  fair: {
    label: "Almost There",
    bg: "bg-amber-100/80 dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
    ring: "ring-amber-500/30",
    Icon: Activity,
  },
  bad: {
    label: "Adjust Posture",
    bg: "bg-rose-100/80 dark:bg-rose-500/10",
    text: "text-rose-700 dark:text-rose-300",
    ring: "ring-rose-500/30",
    Icon: AlertTriangle,
  },
};

export function StatusPill({ postureClass, confidence }: Props) {
  if (!postureClass) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
        <Activity className="h-4 w-4 animate-pulse" />
        <span>Looking for you…</span>
      </div>
    );
  }
  const cfg = CONFIG[postureClass];
  const Icon = cfg.Icon;
  return (
    <motion.div
      key={postureClass}
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ring-1",
        cfg.bg,
        cfg.text,
        cfg.ring,
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{cfg.label}</span>
      {typeof confidence === "number" && (
        <span className="ml-1 text-xs opacity-70">
          {Math.round(confidence * 100)}% sure
        </span>
      )}
    </motion.div>
  );
}
