import { type ReactNode } from "react";
import { TopNav } from "./TopNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full text-foreground">
      <TopNav />
      <main className="mx-auto w-full max-w-[1400px]">
        {children}
      </main>
    </div>
  );
}
