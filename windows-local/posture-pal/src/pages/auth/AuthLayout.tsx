import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Trophy, Activity } from "lucide-react";

export function AuthLayout({
  brand,
  children,
}: {
  brand?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden">
      <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-5 py-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-10 lg:py-20">
        <div className="hidden lg:flex lg:items-center">{brand}</div>
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function BrandPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary ring-1 ring-primary/15">
        <Sparkles className="h-3.5 w-3.5" />
        Local-first posture coaching
      </div>
      <h2 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
        Sit better, <span className="text-gradient">feel better</span>.
      </h2>
      <p className="max-w-md text-base leading-relaxed text-muted-foreground">
        Posture Pal watches your webcam in real time, gently scores your sitting, and helps you build lasting posture habits — with all video staying on your device.
      </p>

      <ul className="space-y-3">
        <Bullet icon={<Activity className="h-4 w-4" />} title="Live posture detection" body="MediaPipe pose model runs entirely in your browser." />
        <Bullet icon={<Trophy className="h-4 w-4" />} title="Streaks, levels, and goals" body="Earn XP and unlock badges as you build the habit." />
        <Bullet icon={<ShieldCheck className="h-4 w-4" />} title="Privacy by design" body="No video is ever uploaded — your data stays on this device." />
      </ul>
    </motion.div>
  );
}

function Bullet({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
        {icon}
      </span>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{body}</div>
      </div>
    </li>
  );
}
