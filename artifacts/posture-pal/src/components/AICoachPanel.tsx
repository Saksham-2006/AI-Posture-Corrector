import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { PostureMetrics } from "@/features/posture/postureMetrics";
import type { ScoreBreakdown } from "@/features/posture/scoring";

type Tip = {
  id: string;
  title: string;
  body: string;
};

type Props = {
  metrics: PostureMetrics | null;
  breakdown: ScoreBreakdown | null;
  goodSecs: number;
  sessionState: "idle" | "running" | "paused";
};

function buildTips({ metrics, breakdown, goodSecs, sessionState }: Props): Tip[] {
  if (sessionState === "idle") {
    return [
      {
        id: "start",
        title: "Ready when you are",
        body: "Start a session — your AI coach will spot what to fix in real time and suggest tiny adjustments.",
      },
    ];
  }
  if (!metrics || !breakdown) {
    return [
      {
        id: "frame",
        title: "Help me see you",
        body: "Sit so your shoulders, ears and chest are all in frame. Soft daylight in front of you works best.",
      },
    ];
  }

  const tips: Tip[] = [];

  if (breakdown.forwardHead < 60) {
    tips.push({
      id: "forward-head",
      title: "Pull your chin slightly back",
      body: "Your head is drifting forward. Imagine sliding the back of your skull backwards an inch — ears stack over shoulders.",
    });
  }
  if (breakdown.neck < 60) {
    tips.push({
      id: "neck",
      title: "Level your head",
      body: "Your neck is tilted. Imagine a soft string lifting the crown of your head straight up.",
    });
  }
  if (breakdown.shoulder < 65) {
    tips.push({
      id: "shoulders",
      title: "Drop and even your shoulders",
      body: "One shoulder is sitting higher. Roll both shoulders back and let them melt down away from your ears.",
    });
  }
  if (metrics.hipsVisible && breakdown.spine < 60) {
    tips.push({
      id: "spine",
      title: "Lengthen your spine",
      body: "You're leaning. Reset your seat under your hips and stack your ribs gently over them.",
    });
  }

  if (tips.length === 0) {
    if (goodSecs >= 600) {
      tips.push({
        id: "win-10",
        title: "10 minutes of good posture — well done",
        body: "Sustained alignment is the goal. Take a slow breath, soften your jaw, and keep going.",
      });
    } else if (goodSecs >= 60) {
      tips.push({
        id: "win-1",
        title: "Looking great",
        body: "You're in the sweet spot. Try to notice how your back feels right now so you can return to it later.",
      });
    } else {
      tips.push({
        id: "neutral",
        title: "Find your tall, easy seat",
        body: "Sit bones grounded, ribs over hips, ears over shoulders. Soft, not stiff.",
      });
    }
  }

  return tips.slice(0, 3);
}

export function AICoachPanel(props: Props) {
  const tips = useMemo(() => buildTips(props), [props]);
  const [idx, setIdx] = useState(0);

  // Reset to first tip when the set of tips changes
  useEffect(() => {
    setIdx(0);
  }, [tips.map((t) => t.id).join("|")]);

  // Cycle every 6s if multiple
  useEffect(() => {
    if (tips.length < 2) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % tips.length);
    }, 6000);
    return () => clearInterval(id);
  }, [tips.length]);

  const current = tips[idx] ?? tips[0];

  return (
    <div className="rounded-2xl border border-card-border bg-gradient-to-br from-primary/8 via-card to-accent/30 p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <h3 className="text-sm font-semibold tracking-tight">AI Coach</h3>
        {tips.length > 1 && (
          <div className="ml-auto flex items-center gap-1">
            {tips.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? "w-4 bg-primary" : "w-1.5 bg-muted"
                }`}
              />
            ))}
          </div>
        )}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="mt-3"
        >
          <div className="text-sm font-semibold">{current.title}</div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{current.body}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
