import { Link, useLocation } from "wouter";
import { Home, Activity, BarChart3, Settings, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/live", label: "Live", Icon: Activity },
  { to: "/analytics", label: "Stats", Icon: BarChart3 },
  { to: "/profile", label: "Profile", Icon: Trophy },
  { to: "/settings", label: "Settings", Icon: Settings },
];

export function MobileNav() {
  const [loc] = useLocation();
  return (
    <nav className="fixed bottom-3 left-3 right-3 z-40 grid grid-cols-5 rounded-2xl border border-card-border bg-card/90 p-1.5 shadow-lg backdrop-blur md:hidden">
      {NAV.map(({ to, label, Icon }) => {
        const active = loc === to;
        return (
          <Link
            key={to}
            href={to}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors",
              active
                ? "bg-primary/12 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            data-testid={`mobile-link-${label.toLowerCase()}`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
