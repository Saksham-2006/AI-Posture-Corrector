import { useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Trash2, Volume2, VolumeX, Bell, Sliders, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/PageHeader";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { SETTINGS_KEY, ONBOARDING_KEY } from "@/features/sessions/sessionStore";
import { DEFAULT_THRESHOLDS } from "@/features/posture/scoring";
import { useSessions } from "@/features/sessions/useSessions";

type Settings = {
  alertSound: boolean;
  alertDelaySec: number;
  goodCutoff: number;
  badCutoff: number;
  dailyGoalMin: number;
  breakRemindersMin: number; // 0 = off
};

const DEFAULT_SETTINGS: Settings = {
  alertSound: true,
  alertDelaySec: 5,
  goodCutoff: DEFAULT_THRESHOLDS.goodCutoff,
  badCutoff: DEFAULT_THRESHOLDS.badCutoff,
  dailyGoalMin: 30,
  breakRemindersMin: 25,
};

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useLocalStorage<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS);
  const { clear, sessions } = useSessions();
  const { toast } = useToast();
  const [, setOnboarded] = useLocalStorage<boolean>(ONBOARDING_KEY, true);
  const [resetCount, setResetCount] = useState(0);

  const update = (patch: Partial<Settings>) =>
    setSettings((s) => ({ ...s, ...patch }));

  return (
    <div className="px-4 py-6 md:px-10 md:py-10">
      <PageHeader
        eyebrow="Settings"
        title="Preferences"
        description="Make Posture Pal feel like yours."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Appearance */}
        <Card className="border-card-border">
          <CardContent className="p-6">
            <SectionHeading icon={theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}>
              Appearance
            </SectionHeading>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Theme</Label>
                <p className="text-xs text-muted-foreground">Light keeps things airy. Dark is gentle on the eyes.</p>
              </div>
              <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
                {(["light", "dark"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                      theme === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                    data-testid={`button-theme-${t}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily goal */}
        <Card className="border-card-border">
          <CardContent className="p-6">
            <SectionHeading icon={<Target className="h-4 w-4" />}>Daily goal</SectionHeading>
            <p className="mt-1 text-xs text-muted-foreground">
              Minutes of <span className="font-medium text-foreground">good posture</span> you'd like to hit each day.
            </p>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Goal</Label>
                <span className="text-xs tabular-nums text-primary">
                  {settings.dailyGoalMin} min
                </span>
              </div>
              <Slider
                className="mt-3"
                min={5}
                max={120}
                step={5}
                value={[settings.dailyGoalMin]}
                onValueChange={([v]) => update({ dailyGoalMin: v ?? 30 })}
                data-testid="slider-daily-goal"
              />
              <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>5m</span>
                <span>60m</span>
                <span>2h</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="border-card-border">
          <CardContent className="p-6">
            <SectionHeading icon={<Bell className="h-4 w-4" />}>Alerts &amp; breaks</SectionHeading>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <Label htmlFor="alert-sound" className="text-sm font-medium">Sound</Label>
                <p className="text-xs text-muted-foreground">Play a soft chime when you've been slouching.</p>
              </div>
              <div className="flex items-center gap-2">
                {settings.alertSound ? <Volume2 className="h-4 w-4 text-muted-foreground" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
                <Switch
                  id="alert-sound"
                  checked={settings.alertSound}
                  onCheckedChange={(v) => update({ alertSound: v })}
                  data-testid="switch-alert-sound"
                />
              </div>
            </div>

            <Separator className="my-5" />

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Posture alert delay</Label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {settings.alertDelaySec}s
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                How long bad posture must continue before an alert fires.
              </p>
              <Slider
                className="mt-3"
                min={3}
                max={15}
                step={1}
                value={[settings.alertDelaySec]}
                onValueChange={([v]) => update({ alertDelaySec: v ?? 5 })}
                data-testid="slider-alert-delay"
              />
            </div>

            <Separator className="my-5" />

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Break reminders</Label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {settings.breakRemindersMin === 0 ? "Off" : `Every ${settings.breakRemindersMin}m`}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Suggest a stretch or movement during long sessions.
              </p>
              <Slider
                className="mt-3"
                min={0}
                max={60}
                step={5}
                value={[settings.breakRemindersMin]}
                onValueChange={([v]) => update({ breakRemindersMin: v ?? 25 })}
                data-testid="slider-break-reminders"
              />
            </div>
          </CardContent>
        </Card>

        {/* Thresholds */}
        <Card className="border-card-border">
          <CardContent className="p-6">
            <SectionHeading icon={<Sliders className="h-4 w-4" />}>Score thresholds</SectionHeading>
            <p className="mt-1 text-xs text-muted-foreground">
              Tune what counts as good or bad posture for you.
            </p>

            <div className="mt-5 space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Good ≥</Label>
                  <span className="text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
                    {settings.goodCutoff}
                  </span>
                </div>
                <Slider
                  className="mt-3"
                  min={Math.max(60, settings.badCutoff + 1)}
                  max={95}
                  step={1}
                  value={[settings.goodCutoff]}
                  onValueChange={([v]) => update({ goodCutoff: v ?? 75 })}
                  data-testid="slider-good"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Bad &lt;</Label>
                  <span className="text-xs tabular-nums text-rose-600 dark:text-rose-400">
                    {settings.badCutoff}
                  </span>
                </div>
                <Slider
                  className="mt-3"
                  min={30}
                  max={Math.min(70, settings.goodCutoff - 1)}
                  step={1}
                  value={[settings.badCutoff]}
                  onValueChange={([v]) => update({ badCutoff: v ?? 60 })}
                  data-testid="slider-bad"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => update(DEFAULT_SETTINGS)}
                className="text-xs text-muted-foreground"
              >
                Reset to defaults
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data */}
        <Card className="border-card-border lg:col-span-2">
          <CardContent className="p-6">
            <SectionHeading icon={<Trash2 className="h-4 w-4" />}>Your data</SectionHeading>
            <p className="mt-1 text-xs text-muted-foreground">
              Everything is stored locally on this device. {sessions.length} session{sessions.length === 1 ? "" : "s"} saved.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => {
                  setOnboarded(false);
                  setResetCount((c) => c + 1);
                  toast({ title: "Onboarding reset", description: "You'll see the welcome again next time you load the app." });
                }}
                data-testid="button-reset-onboarding"
              >
                Replay onboarding
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2" data-testid="button-clear-data">
                    <Trash2 className="h-4 w-4" /> Clear all session data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all session data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete every saved session and reset your achievements and streak. This can't be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        clear();
                        toast({ title: "Cleared", description: "All your sessions have been deleted." });
                      }}
                    >
                      Yes, delete everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            {resetCount > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                Reload the app to see the welcome flow again.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <h2 className="text-base font-semibold">{children}</h2>
    </div>
  );
}
