import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Home,
  Activity,
  BarChart3,
  Settings as SettingsIcon,
  Trophy,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  LogIn,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, getInitials } from "@/features/auth/AuthContext";
import { useSessions } from "@/features/sessions/useSessions";
import { computeStreak } from "@/features/sessions/streak";
import { computeXP } from "@/features/gamification/xp";
import { countGoalDays } from "@/features/gamification/goals";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { SETTINGS_KEY } from "@/features/sessions/sessionStore";
import { levelTitle } from "@/features/gamification/xp";

const NAV = [
  { to: "/", label: "Dashboard", Icon: Home },
  { to: "/live", label: "Live", Icon: Activity },
  { to: "/analytics", label: "Analytics", Icon: BarChart3 },
  { to: "/profile", label: "Profile", Icon: Trophy },
  { to: "/settings", label: "Settings", Icon: SettingsIcon },
];

type Settings = { dailyGoalMin: number };

export function TopNav() {
  const [loc, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { sessions } = useSessions();
  const [settings] = useLocalStorage<Settings>(SETTINGS_KEY, { dailyGoalMin: 30 });
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => setMounted(true), []);
  // Close mobile drawer on navigation
  useEffect(() => {
    setOpen(false);
  }, [loc]);

  const streak = computeStreak(sessions);
  const goalDays = useMemo(() => countGoalDays(sessions, settings.dailyGoalMin ?? 30), [sessions, settings.dailyGoalMin]);
  const xp = useMemo(() => computeXP(sessions, goalDays), [sessions, goalDays]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <header className="glass-nav sticky top-0 z-40 w-full">
        <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-3 px-4 md:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo />
            <div className="hidden flex-col leading-none sm:flex">
              <span className="text-base font-semibold tracking-tight">Posture Pal</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Sit better</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {NAV.map(({ to, label, Icon }) => {
              const active = loc === to;
              return (
                <Link
                  key={to}
                  href={to}
                  className={cn(
                    "relative inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                  data-testid={`link-${label.toLowerCase()}`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-primary/12 ring-1 ring-primary/15"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {/* Streak chip */}
            {streak > 0 && (
              <div className="hidden items-center gap-1.5 rounded-full bg-amber-100/70 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200/60 sm:inline-flex dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20">
                <Flame className="h-3.5 w-3.5" />
                {streak}d
              </div>
            )}

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
              data-testid="button-theme-toggle"
              aria-label="Toggle theme"
            >
              {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Profile / Sign in */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="hover-elevate inline-flex items-center gap-2 rounded-full bg-card/70 px-1 py-1 pr-3 ring-1 ring-card-border"
                    data-testid="button-profile-menu"
                  >
                    <Avatar name={user.name} />
                    <span className="hidden text-sm font-medium md:inline">{user.name.split(" ")[0]}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="flex items-start gap-3 py-3">
                    <Avatar name={user.name} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{user.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                      <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        Lvl {xp.level} · {levelTitle(xp.level)}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex w-full cursor-pointer items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex w-full cursor-pointer items-center gap-2">
                      <SettingsIcon className="h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                    data-testid="button-logout"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button className="hidden gap-2 rounded-full sm:inline-flex" data-testid="button-signin">
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Button>
              </Link>
            )}

            {/* Mobile menu trigger */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(true)}
              className="rounded-full md:hidden"
              data-testid="button-mobile-menu"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="glass-strong fixed right-0 top-0 z-50 flex h-full w-[80%] max-w-xs flex-col p-5 md:hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Logo />
                  <span className="text-base font-semibold">Posture Pal</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close menu">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {user && (
                <div className="mt-5 flex items-center gap-3 rounded-2xl bg-primary/8 p-3 ring-1 ring-primary/15">
                  <Avatar name={user.name} size="lg" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{user.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </div>
              )}

              <nav className="mt-5 flex flex-col gap-1">
                {NAV.map(({ to, label, Icon }) => {
                  const active = loc === to;
                  return (
                    <Link
                      key={to}
                      href={to}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                        active
                          ? "bg-primary/12 text-primary ring-1 ring-primary/15"
                          : "text-foreground/80 hover-elevate",
                      )}
                      data-testid={`mobile-link-${label.toLowerCase()}`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto pt-4">
                {user ? (
                  <Button variant="outline" onClick={handleLogout} className="w-full gap-2">
                    <LogOut className="h-4 w-4" /> Sign out
                  </Button>
                ) : (
                  <Link href="/login">
                    <Button className="w-full gap-2">
                      <LogIn className="h-4 w-4" /> Sign in
                    </Button>
                  </Link>
                )}
                <p className="mt-3 px-1 text-center text-[11px] text-muted-foreground">
                  AI runs locally in your browser.
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const dim = size === "lg" ? "h-10 w-10 text-sm" : "h-7 w-7 text-[11px]";
  return (
    <div
      className={cn(
        "grid place-items-center rounded-full bg-gradient-to-br from-primary to-primary/70 font-semibold text-primary-foreground shadow-sm",
        dim,
      )}
    >
      {getInitials(name)}
    </div>
  );
}

function Logo() {
  return (
    <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-md">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-4.5 w-4.5 text-primary-foreground"
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
