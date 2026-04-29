import { Play, Pause, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  state: "idle" | "running" | "paused";
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  disabled?: boolean;
};

export function SessionControls({ state, onStart, onPause, onResume, onEnd, disabled }: Props) {
  if (state === "idle") {
    return (
      <Button
        size="lg"
        onClick={onStart}
        disabled={disabled}
        className="gap-2 px-6"
        data-testid="button-start-session"
      >
        <Play className="h-4 w-4" />
        Start Session
      </Button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {state === "running" ? (
        <Button variant="secondary" size="lg" onClick={onPause} className="gap-2" data-testid="button-pause">
          <Pause className="h-4 w-4" />
          Pause
        </Button>
      ) : (
        <Button size="lg" onClick={onResume} className="gap-2" data-testid="button-resume">
          <Play className="h-4 w-4" />
          Resume
        </Button>
      )}
      <Button variant="destructive" size="lg" onClick={onEnd} className="gap-2" data-testid="button-end">
        <Square className="h-4 w-4" />
        End
      </Button>
    </div>
  );
}
