import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { levelTitle, type XPState } from "@/features/gamification/xp";

type Props = {
  xp: XPState;
  compact?: boolean;
};

export function LevelBadge({ xp, compact }: Props) {
  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-2.5 py-1.5 ring-1 ring-primary/15">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">
              {xp.level}
            </span>
            <span className="text-xs font-medium tabular-nums text-primary">
              {xp.totalXP.toLocaleString()} XP
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {levelTitle(xp.level)} • {xp.inLevelXP}/{xp.nextLevelXP} XP to level {xp.level + 1}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="rounded-2xl border border-card-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md">
          <Trophy className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Level {xp.level}
          </div>
          <div className="text-base font-semibold tracking-tight">{levelTitle(xp.level)}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold tabular-nums">{xp.totalXP.toLocaleString()}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total XP</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Lvl {xp.level}</span>
          <span className="tabular-nums">
            {xp.inLevelXP} / {xp.nextLevelXP}
          </span>
          <span>Lvl {xp.level + 1}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xp.progress * 100}%` }}
            transition={{ type: "spring", stiffness: 70, damping: 18 }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
          />
        </div>
      </div>
    </div>
  );
}
