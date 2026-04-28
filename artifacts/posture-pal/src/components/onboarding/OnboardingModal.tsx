import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Step = {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    Icon: Sparkles,
    title: "Welcome to Posture Pal",
    body:
      "A gentle desk companion that watches your posture through your webcam and helps you sit better — without the lecture.",
  },
  {
    Icon: ShieldCheck,
    title: "Private by design",
    body:
      "All AI runs in your browser. Your video never leaves this device, and your sessions are stored locally.",
  },
  {
    Icon: Camera,
    title: "We need your camera",
    body:
      "When you start a session, your browser will ask for camera permission. You can revoke it anytime in your browser settings.",
  },
];

type Props = {
  open: boolean;
  onComplete: () => void;
};

export function OnboardingModal({ open, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.Icon;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>Welcome</DialogTitle>
          <DialogDescription>Onboarding</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center px-2 py-4 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center"
            >
              <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">
                {current.title}
              </h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                {current.body}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-primary" : "w-1.5 bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="mt-7 flex w-full gap-2">
            {step > 0 && (
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                Back
              </Button>
            )}
            <Button
              className="flex-1 gap-2"
              onClick={() => {
                if (isLast) onComplete();
                else setStep((s) => s + 1);
              }}
              data-testid="button-onboarding-next"
            >
              {isLast ? "Let's begin" : "Next"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
