import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppShell } from "@/components/layout/AppShell";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ONBOARDING_KEY } from "@/features/sessions/sessionStore";

import Dashboard from "@/pages/Dashboard";
import Live from "@/pages/Live";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import { useLocation } from "wouter";

const queryClient = new QueryClient();

function PageTransition({ children, locationKey }: { children: React.ReactNode; locationKey: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={locationKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function Routes() {
  const [loc] = useLocation();
  return (
    <PageTransition locationKey={loc}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/live" component={Live} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </PageTransition>
  );
}

function ShellWithOnboarding() {
  const [onboarded, setOnboarded] = useLocalStorage<boolean>(ONBOARDING_KEY, false);
  return (
    <>
      <AppShell>
        <Routes />
      </AppShell>
      <OnboardingModal open={!onboarded} onComplete={() => setOnboarded(true)} />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={150}>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <ShellWithOnboarding />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
