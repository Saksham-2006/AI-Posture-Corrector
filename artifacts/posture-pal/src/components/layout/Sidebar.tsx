import { Link, useLocation } from "wouter";
import { Home, Activity, BarChart3, Settings, Flame, Trophy } from "lucide-react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useSessions } from "@/features/sessions/useSessions";
import { computeStreak } from "@/features/sessions/streak";
import { computeXP } from "@/features/gamification/xp";
import { countGoalDays } from "@/features/gamification/goals";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { SETTINGS_KEY } from "@/features/sessions/sessionStore";
import { LevelBadge } from "@/components/LevelBadge";

const NAV = [
  { to: "/", label: "Dashboard", Icon: Home },
  { to: "/live", label: "Live", Icon: Activity },
  { to: "/analytics", label: "Analytics", Icon: BarChart3 },
  { to: "/profile", label: "Profile", Icon: Trophy },
  { to: "/settings", label: "Settings", Icon: Settings },
];

type Settings = { dailyGoalMin: number };

export function Sidebar() {
  const [loc] = useLocation();
  const { sessions } = useSessions();
  const [settings] = useLocalStorage<Settings>(SETTINGS_KEY, { dailyGoalMin: 30 });
  const streak = computeStreak(sessions);
  const goalDays = useMemo(
    () => countGoalDays(sessions, settings.dailyGoalMin ?? 30),
    [sessions, settings.dailyGoalMin],
  );
  const xp = useMemo(() => computeXP(sessions, goalDays), [sessions, goalDays]);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-72 flex-col border-r border-sidebar-border bg-sidebar p-5 md:flex">
      <div className="flex items-center gap-3 px-2 py-4">
        <Logo />
        <div className="flex flex-col leading-tight">
          <span className="text-base font-semibold tracking-tight">Posture Pal</span>
          <span className="text-xs text-muted-foreground">Sit better, feel better</span>
        </div>
      </div>

      <div className="mx-2 my-3">
        <LevelBadge xp={xp} compact />
      </div>

      <div className="mx-2 mb-3 flex items-center gap-2 rounded-xl bg-amber-100/50 px-3 py-2.5 ring-1 ring-amber-200/40 dark:bg-amber-500/10 dark:ring-amber-500/20">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-200/70 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
          <Flame className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">{streak} day{streak === 1 ? "" : "s"}</span>
          <span className="text-xs text-muted-foreground">Current streak</span>
        </div>
      </div>

      <nav className="mt-1 flex flex-col gap-1">
        {NAV.map(({ to, label, Icon }) => {
          const active = loc === to;
          return (
            <Link
              key={to}
              href={to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover-elevate",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:text-sidebar-foreground",
              )}
              data-testid={`link-${label.toLowerCase()}`}
            >
              <Icon className={cn("h-4 w-4", active && "text-primary")} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/80 hover-elevate"
          data-testid="button-theme-toggle"
        >
          {mounted && theme === "dark" ? (
            <>
              <Sun className="h-4 w-4" />
              <span>Light mode</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4" />
              <span>Dark mode</span>
            </>
          )}
        </button>
        <p className="mt-3 px-3 text-xs text-muted-foreground/80">
          AI runs locally in your browser.
        </p>
      </div>
    </aside>
  );
}

function Logo() {
  return (
    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-md">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5 text-primary-foreground"
        strokeWidth={2.4}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="6" r="2.2" />
        <path d="M7 12h10M12 12v9M8.5 12l-2 9M15.5 12l2 9" />
      </svg>
    </div>
  );
}
