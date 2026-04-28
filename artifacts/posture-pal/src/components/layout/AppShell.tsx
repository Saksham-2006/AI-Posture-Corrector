import { type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-[1400px]">
        <Sidebar />
        <main className="flex min-h-screen flex-1 flex-col pb-24 md:pb-0 md:pl-72">
          <div className="flex-1">{children}</div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
