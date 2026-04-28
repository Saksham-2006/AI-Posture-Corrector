import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import { Activity, Clock, TrendingUp, Flame, Sparkles, Mountain, Repeat, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Heatmap } from "@/components/Heatmap";
import { useSessions } from "@/features/sessions/useSessions";
import { computeStreak, lastNDays } from "@/features/sessions/streak";
import { formatDuration, formatTimer } from "@/lib/format";
import {
  generateInsights,
  consistencyScore,
  longestGoodStreak,
  averageCorrectionTime,
  buildHeatmap,
} from "@/features/insights/insights";

const COLORS = {
  good: "hsl(160 65% 50%)",
  fair: "hsl(35 90% 60%)",
  bad: "hsl(355 75% 60%)",
};

export default function Analytics() {
  const { sessions } = useSessions();

  const totals = useMemo(() => {
    const totalSec = sessions.reduce((a, s) => a + s.durationSec, 0);
    const goodSec = sessions.reduce((a, s) => a + s.goodSec, 0);
    const fairSec = sessions.reduce((a, s) => a + s.fairSec, 0);
    const badSec = sessions.reduce((a, s) => a + s.badSec, 0);
    const avgScore =
      sessions.length === 0
        ? 0
        : Math.round(sessions.reduce((a, s) => a + s.avgScore, 0) / sessions.length);
    return { totalSec, goodSec, fairSec, badSec, avgScore };
  }, [sessions]);

  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const insights = useMemo(() => generateInsights(sessions), [sessions]);
  const consistency = useMemo(() => consistencyScore(sessions), [sessions]);
  const longestGood = useMemo(() => longestGoodStreak(sessions), [sessions]);
  const correction = useMemo(() => averageCorrectionTime(sessions), [sessions]);
  const heatmap = useMemo(() => buildHeatmap(sessions), [sessions]);

  const lastSession = useMemo(
    () => [...sessions].sort((a, b) => b.startedAt - a.startedAt)[0],
    [sessions],
  );
  const lastSessionSeries = useMemo(
    () => lastSession?.samples.map((s) => ({ t: s.t, score: s.score })) ?? [],
    [lastSession],
  );

  const days = useMemo(() => lastNDays(sessions, 7), [sessions]);

  const pie = useMemo(
    () =>
      [
        { name: "Good", value: totals.goodSec, color: COLORS.good },
        { name: "Fair", value: totals.fairSec, color: COLORS.fair },
        { name: "Bad", value: totals.badSec, color: COLORS.bad },
      ].filter((d) => d.value > 0),
    [totals],
  );

  const has = sessions.length > 0;

  return (
    <div className="px-4 py-6 md:px-10 md:py-10">
      <PageHeader
        eyebrow="Analytics"
        title="Your posture, over time"
        description="Patterns we've noticed across your sessions."
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi label="Total time" value={formatDuration(totals.totalSec)} Icon={Clock} />
        <Kpi label="Avg score" value={has ? String(totals.avgScore) : "—"} Icon={TrendingUp} />
        <Kpi label="Sessions" value={String(sessions.length)} Icon={Activity} />
        <Kpi label="Streak" value={`${streak}d`} Icon={Flame} />
      </div>

      {/* Behavioral metrics */}
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
        <Kpi
          label="Consistency"
          value={has ? `${consistency}/100` : "—"}
          Icon={Target}
          tint="mint"
        />
        <Kpi
          label="Longest good streak"
          value={longestGood > 0 ? formatTimer(longestGood) : "—"}
          Icon={Mountain}
          tint="lavender"
        />
        <Kpi
          label="Avg correction"
          value={correction !== null ? `${correction}s` : "—"}
          Icon={Repeat}
          tint="sky"
          hint="How long it takes to recover from bad → good posture."
        />
      </div>

      {/* AI insights */}
      <Card className="mt-6 border-card-border bg-gradient-to-br from-primary/5 via-card to-accent/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-semibold">AI insights</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Patterns we noticed in your data — refreshed automatically.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {insights.map((i, idx) => (
              <motion.div
                key={i.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                className={`rounded-2xl p-4 ring-1 ${
                  i.tone === "good"
                    ? "bg-emerald-50/70 ring-emerald-200/60 dark:bg-emerald-500/5 dark:ring-emerald-500/20"
                    : i.tone === "warn"
                      ? "bg-amber-50/70 ring-amber-200/60 dark:bg-amber-500/5 dark:ring-amber-500/20"
                      : "bg-card ring-card-border"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl leading-none">{i.emoji}</span>
                  <div>
                    <div className="text-sm font-semibold">{i.title}</div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{i.body}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Heatmap */}
      <Card className="mt-6 border-card-border">
        <CardContent className="p-6">
          <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Posture heatmap</h2>
              <p className="text-sm text-muted-foreground">
                Average score per hour over the last 7 days. Brighter green = better posture.
              </p>
            </div>
          </div>
          <div className="mt-5">
            {has ? (
              <Heatmap data={heatmap} />
            ) : (
              <Empty>Run a session to start filling the grid.</Empty>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Last session line chart */}
        <Card className="border-card-border lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-semibold">Score during your last session</h2>
                <p className="text-sm text-muted-foreground">
                  {lastSession
                    ? `${new Date(lastSession.startedAt).toLocaleString()} — avg ${lastSession.avgScore}`
                    : "No sessions yet."}
                </p>
              </div>
            </div>
            <div className="mt-5 h-64">
              {lastSessionSeries.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lastSessionSeries} margin={{ top: 10, right: 16, bottom: 4, left: -16 }}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="t"
                      tickFormatter={(v) => `${Math.round(v / 60)}m`}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                    />
                    <RTooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      labelFormatter={(v) => `at ${Math.round(Number(v))}s`}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Empty>Run a session to see your score over time.</Empty>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pie distribution */}
        <Card className="border-card-border">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold">Posture distribution</h2>
            <p className="text-sm text-muted-foreground">Across all sessions you've recorded.</p>
            <div className="mt-4 h-64">
              {pie.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={88}
                      stroke="hsl(var(--card))"
                      strokeWidth={3}
                      paddingAngle={2}
                    >
                      {pie.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <RTooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [formatDuration(value), ""]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Empty>Track at least one session to see the breakdown.</Empty>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Daily bar chart */}
        <Card className="border-card-border">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold">Last 7 days</h2>
            <p className="text-sm text-muted-foreground">Minutes practiced each day.</p>
            <div className="mt-4 h-64">
              {days.some((d) => d.minutes > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={days} margin={{ top: 10, right: 8, bottom: 4, left: -16 }}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <RTooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => [`${v} min`, "Practice"]}
                      cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                    />
                    <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty>No daily activity yet — your week will fill in here.</Empty>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  Icon,
  tint = "lavender",
  hint,
}: {
  label: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
  tint?: "lavender" | "mint" | "sky";
  hint?: string;
}) {
  const tintMap = {
    lavender: "bg-primary/10 text-primary",
    mint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  } as const;
  return (
    <div className="rounded-2xl border border-card-border bg-card p-5">
      <div className={`mb-2.5 inline-flex h-9 w-9 items-center justify-center rounded-xl ${tintMap[tint]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      {hint && <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground/85">{hint}</p>}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-full min-h-32 place-items-center rounded-xl border border-dashed border-card-border text-sm text-muted-foreground">
      {children}
    </div>
  );
}
