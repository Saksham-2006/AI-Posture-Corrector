import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Activity, Award, Clock, TrendingUp, Flame, CheckCircle2, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/PageHeader";
import { useSessions } from "@/features/sessions/useSessions";
import { computeStreak, todayStats } from "@/features/sessions/streak";
import { evaluateAchievements } from "@/features/sessions/achievements";
import { formatDuration, formatRelativeTime, formatTimer } from "@/lib/format";

export default function Dashboard() {
  const { sessions } = useSessions();
  const streak = computeStreak(sessions);
  const today = todayStats(sessions);
  const achievements = evaluateAchievements(sessions);
  const unlocked = achievements.filter((a) => a.unlockedAt);
  const next = achievements.find((a) => !a.unlockedAt);
  const recent = [...sessions].sort((a, b) => b.startedAt - a.startedAt).slice(0, 5);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5) return "Hello, night owl";
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="px-4 py-6 md:px-10 md:py-10">
      <PageHeader
        eyebrow="Today"
        title={greeting}
        description="A small check-in on how your back is doing today."
        actions={
          <Link href="/live">
            <Button size="lg" className="gap-2" data-testid="link-start-from-dashboard">
              Start session <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      {/* KPI strip */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        className="grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        <Kpi
          Icon={Flame}
          label="Streak"
          value={`${streak} day${streak === 1 ? "" : "s"}`}
          tint="amber"
        />
        <Kpi
          Icon={Clock}
          label="Today"
          value={formatDuration(today.totalSec)}
          tint="lavender"
        />
        <Kpi
          Icon={TrendingUp}
          label="Avg score"
          value={today.avgScore ? String(today.avgScore) : "—"}
          tint="mint"
        />
        <Kpi
          Icon={Activity}
          label="Sessions today"
          value={String(today.sessionCount)}
          tint="sky"
        />
      </motion.div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Today's posture distribution */}
          <Card className="border-card-border overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Today's posture</h2>
                  <p className="text-sm text-muted-foreground">
                    {today.totalSec === 0
                      ? "No sessions yet today — start one whenever you're ready."
                      : `${formatDuration(today.totalSec)} tracked across ${today.sessionCount} session${today.sessionCount === 1 ? "" : "s"}.`}
                  </p>
                </div>
                {today.totalSec > 0 && (
                  <Badge variant="secondary" className="font-medium">
                    {Math.round(today.goodRatio * 100)}% good
                  </Badge>
                )}
              </div>

              <div className="mt-5">
                {today.totalSec === 0 ? (
                  <div className="grid h-28 place-items-center rounded-xl border border-dashed border-card-border text-sm text-muted-foreground">
                    Your daily posture mix will appear here.
                  </div>
                ) : (
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                    <Segment fraction={today.goodSec / today.totalSec} className="bg-emerald-400" />
                    <Segment fraction={today.fairSec / today.totalSec} className="bg-amber-400" />
                    <Segment fraction={today.badSec / today.totalSec} className="bg-rose-400" />
                  </div>
                )}
                {today.totalSec > 0 && (
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                    <Legend dot="bg-emerald-400" label={`Good ${formatDuration(today.goodSec)}`} />
                    <Legend dot="bg-amber-400" label={`Fair ${formatDuration(today.fairSec)}`} />
                    <Legend dot="bg-rose-400" label={`Bad ${formatDuration(today.badSec)}`} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent sessions */}
          <Card className="border-card-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent sessions</h2>
                <Link href="/analytics">
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                    See all <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              {recent.length === 0 ? (
                <div className="mt-4 grid h-32 place-items-center rounded-xl border border-dashed border-card-border text-sm text-muted-foreground">
                  No sessions yet — your history will live here.
                </div>
              ) : (
                <ul className="mt-4 divide-y divide-border">
                  {recent.map((s) => (
                    <li key={s.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                          <Activity className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {formatTimer(s.durationSec)} session
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatRelativeTime(s.endedAt)} • avg {s.avgScore}
                          </div>
                        </div>
                      </div>
                      <ScoreBadge score={s.avgScore} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <Card className="border-card-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" /> Achievements
              </h2>
              <span className="text-xs text-muted-foreground">
                {unlocked.length}/{achievements.length}
              </span>
            </div>

            {next && !next.unlockedAt && (
              <div className="mt-4 rounded-xl bg-primary/8 p-4 ring-1 ring-primary/15">
                <div className="text-xs uppercase tracking-widest text-primary/80">
                  Up next
                </div>
                <div className="mt-1 text-sm font-semibold">{next.title}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{next.description}</div>
                <Progress value={next.progress * 100} className="mt-3 h-1.5" />
              </div>
            )}

            <ul className="mt-5 space-y-3">
              {achievements.map((a) => {
                const isUnlocked = !!a.unlockedAt;
                return (
                  <li key={a.id} className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 grid h-8 w-8 place-items-center rounded-lg ${
                        isUnlocked
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isUnlocked ? <CheckCircle2 className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${!isUnlocked && "text-muted-foreground"}`}>
                          {a.title}
                        </span>
                        {isUnlocked && (
                          <span className="text-[10px] text-muted-foreground">
                            {formatRelativeTime(a.unlockedAt!)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{a.description}</p>
                      {!isUnlocked && (
                        <Progress value={a.progress * 100} className="mt-1.5 h-1" />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ Icon, label, value, tint }: { Icon: React.ComponentType<{ className?: string }>; label: string; value: string; tint: "amber" | "lavender" | "mint" | "sky" }) {
  const tintMap = {
    amber: "from-amber-100 to-amber-50 text-amber-700 dark:from-amber-500/15 dark:to-amber-500/5 dark:text-amber-300",
    lavender: "from-purple-100 to-violet-50 text-violet-700 dark:from-violet-500/15 dark:to-violet-500/5 dark:text-violet-300",
    mint: "from-emerald-100 to-emerald-50 text-emerald-700 dark:from-emerald-500/15 dark:to-emerald-500/5 dark:text-emerald-300",
    sky: "from-sky-100 to-sky-50 text-sky-700 dark:from-sky-500/15 dark:to-sky-500/5 dark:text-sky-300",
  } as const;
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
      className="rounded-2xl border border-card-border bg-card p-5 shadow-sm"
    >
      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${tintMap[tint]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
      <div className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </motion.div>
  );
}

function Segment({ fraction, className }: { fraction: number; className: string }) {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  if (pct < 0.5) return null;
  return <div className={className} style={{ width: `${pct}%` }} />;
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
      : score >= 60
        ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
        : "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${tone}`}>
      {score}
    </span>
  );
}
