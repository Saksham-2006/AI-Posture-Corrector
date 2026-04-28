import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Award, Flame, Calendar, Trophy, Target, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/PageHeader";
import { LevelBadge } from "@/components/LevelBadge";
import { GoalRing } from "@/components/GoalRing";
import { SkeletonRow } from "@/components/SkeletonCard";
import { useSessions } from "@/features/sessions/useSessions";
import { computeXP, levelTitle } from "@/features/gamification/xp";
import { todayGoalProgress, countGoalDays } from "@/features/gamification/goals";
import { evaluateAchievements } from "@/features/sessions/achievements";
import { computeStreak } from "@/features/sessions/streak";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { SETTINGS_KEY } from "@/features/sessions/sessionStore";
import { DEFAULT_THRESHOLDS } from "@/features/posture/scoring";
import { formatDuration, formatRelativeTime } from "@/lib/format";

type Settings = {
  alertSound: boolean;
  alertDelaySec: number;
  goodCutoff: number;
  badCutoff: number;
  dailyGoalMin: number;
};

const DEFAULT_SETTINGS: Settings = {
  alertSound: true,
  alertDelaySec: 5,
  goodCutoff: DEFAULT_THRESHOLDS.goodCutoff,
  badCutoff: DEFAULT_THRESHOLDS.badCutoff,
  dailyGoalMin: 30,
};

export default function Profile() {
  const { sessions } = useSessions();
  const [settings] = useLocalStorage<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS);

  const goalDays = useMemo(
    () => countGoalDays(sessions, settings.dailyGoalMin),
    [sessions, settings.dailyGoalMin],
  );
  const xp = useMemo(() => computeXP(sessions, goalDays), [sessions, goalDays]);
  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const goal = useMemo(
    () => todayGoalProgress(sessions, settings.dailyGoalMin),
    [sessions, settings.dailyGoalMin],
  );
  const achievements = useMemo(() => evaluateAchievements(sessions), [sessions]);
  const unlocked = achievements.filter((a) => a.unlockedAt);
  const totalSec = sessions.reduce((a, s) => a + s.durationSec, 0);
  const avgScore =
    sessions.length === 0
      ? 0
      : Math.round(sessions.reduce((a, s) => a + s.avgScore, 0) / sessions.length);

  return (
    <div className="px-4 py-6 md:px-10 md:py-10">
      <PageHeader
        eyebrow="Profile"
        title="Your progress"
        description="Levels, goals and badges you've earned along the way."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: hero + goal + lifetime stats */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LevelBadge xp={xp} />
          </motion.div>

          <Card className="border-card-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" /> Today's goal
                </h2>
                <Link href="/settings">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
                    Adjust <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              <div className="mt-4">
                <GoalRing goalMin={settings.dailyGoalMin} goodMin={goal.goodMin} />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <Stat label="Goal days" value={String(goalDays)} />
                <Stat label="Streak" value={`${streak}d`} />
                <Stat label="Total time" value={formatDuration(totalSec)} />
              </div>
            </CardContent>
          </Card>

          {/* Achievement gallery */}
          <Card className="border-card-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" /> Achievement gallery
                </h2>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {unlocked.length}/{achievements.length} unlocked
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {achievements.map((a) => {
                  const isUnlocked = !!a.unlockedAt;
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`relative overflow-hidden rounded-2xl border p-4 ${
                        isUnlocked
                          ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-card dark:border-emerald-500/20 dark:from-emerald-500/5 dark:to-card"
                          : "border-card-border bg-card"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                            isUnlocked
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isUnlocked ? <CheckCircle2 className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className={`text-sm font-semibold ${!isUnlocked && "text-muted-foreground"}`}>
                              {a.title}
                            </span>
                            {isUnlocked && (
                              <span className="shrink-0 text-[10px] text-muted-foreground">
                                {formatRelativeTime(a.unlockedAt!)}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{a.description}</p>
                          {!isUnlocked && (
                            <Progress value={a.progress * 100} className="mt-2 h-1" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: lifetime stats + recent */}
        <div className="space-y-6">
          <Card className="border-card-border">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" /> Lifetime
              </h2>
              <ul className="mt-4 divide-y divide-border">
                <Row icon={<Flame className="h-4 w-4 text-amber-500" />} label="Current streak" value={`${streak} days`} />
                <Row icon={<Calendar className="h-4 w-4 text-violet-500" />} label="Goal days hit" value={String(goalDays)} />
                <Row icon={<Trophy className="h-4 w-4 text-primary" />} label="Sessions" value={String(sessions.length)} />
                <Row icon={<Target className="h-4 w-4 text-emerald-500" />} label="Avg score" value={avgScore ? String(avgScore) : "—"} />
              </ul>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">Recent sessions</h2>
              <div className="mt-3">
                {sessions.length === 0 ? (
                  <div className="space-y-1">
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      Your first session will appear here.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {[...sessions]
                      .sort((a, b) => b.startedAt - a.startedAt)
                      .slice(0, 6)
                      .map((s) => (
                        <li key={s.id} className="flex items-center justify-between py-2.5">
                          <div>
                            <div className="text-sm font-medium">
                              {Math.round(s.durationSec / 60)} min
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatRelativeTime(s.endedAt)}
                            </div>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${
                              s.avgScore >= 80
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                                : s.avgScore >= 60
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                                  : "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300"
                            }`}
                          >
                            {s.avgScore}
                          </span>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border bg-gradient-to-br from-primary/8 to-accent/30">
            <CardContent className="p-5">
              <div className="text-xs uppercase tracking-widest text-primary/80">Title</div>
              <div className="mt-1 text-lg font-semibold">{levelTitle(xp.level)}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Earn 1 XP per second of good posture (0.4 fair), plus a 50 XP bonus per session and 100 XP per goal day.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <li className="flex items-center justify-between py-2.5">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 px-2 py-2">
      <div className="text-base font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
