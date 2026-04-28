import { Link, useLocation } from "wouter";
import { Home, Activity, BarChart3, Settings, Flame } from "lucide-react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useSessions } from "@/features/sessions/useSessions";
import { computeStreak } from "@/features/sessions/streak";

const NAV = [
  { to: "/", label: "Dashboard", Icon: Home },
  { to: "/live", label: "Live", Icon: Activity },
  { to: "/analytics", label: "Analytics", Icon: BarChart3 },
  { to: "/settings", label: "Settings", Icon: Settings },
];

export function Sidebar() {
  const [loc] = useLocation();
  const { sessions } = useSessions();
  const streak = computeStreak(sessions);
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

      <div className="mx-2 my-3 flex items-center gap-2 rounded-xl bg-primary/8 px-3 py-2.5 ring-1 ring-primary/15">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
          <Flame className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">{streak} day{streak === 1 ? "" : "s"}</span>
          <span className="text-xs text-muted-foreground">Current streak</span>
        </div>
      </div>

      <nav className="mt-2 flex flex-col gap-1">
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
