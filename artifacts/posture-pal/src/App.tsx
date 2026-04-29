import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppShell } from "@/components/layout/AppShell";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ONBOARDING_KEY } from "@/features/sessions/sessionStore";
import { AuthProvider } from "@/features/auth/AuthContext";

import Dashboard from "@/pages/Dashboard";
import Live from "@/pages/Live";
import Analytics from "@/pages/Analytics";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import NotFound from "@/pages/not-found";

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
        <Route path="/profile" component={Profile} />
        <Route path="/settings" component={Settings} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route component={NotFound} />
      </Switch>
    </PageTransition>
  );
}

function ShellWithOnboarding() {
  const [onboarded, setOnboarded] = useLocalStorage<boolean>(ONBOARDING_KEY, false);
  const [loc] = useLocation();
  const isAuthRoute = loc === "/login" || loc === "/signup";
  return (
    <>
      <AppShell>
        <Routes />
      </AppShell>
      {!isAuthRoute && (
        <OnboardingModal open={!onboarded} onComplete={() => setOnboarded(true)} />
      )}
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={150}>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <ShellWithOnboarding />
            </WouterRouter>
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
