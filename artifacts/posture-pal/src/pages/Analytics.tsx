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
import { Activity, Clock, TrendingUp, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { useSessions } from "@/features/sessions/useSessions";
import { computeStreak, lastNDays } from "@/features/sessions/streak";
import { formatDuration } from "@/lib/format";

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

  const streak = computeStreak(sessions);

  const lastSession = useMemo(
    () => [...sessions].sort((a, b) => b.startedAt - a.startedAt)[0],
    [sessions],
  );

  const lastSessionSeries = useMemo(
    () =>
      lastSession?.samples.map((s) => ({ t: s.t, score: s.score })) ?? [],
    [lastSession],
  );

  const days = useMemo(() => lastNDays(sessions, 7), [sessions]);

  const pie = useMemo(
    () => [
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
            <p className="text-sm text-muted-foreground">
              Across all sessions you've recorded.
            </p>
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

function Kpi({ label, value, Icon }: { label: string; value: string; Icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-2xl border border-card-border bg-card p-5">
      <div className="mb-2.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-full place-items-center rounded-xl border border-dashed border-card-border text-sm text-muted-foreground">
      {children}
    </div>
  );
}
