import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, AlertCircle, Loader2, Lightbulb, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/PageHeader";
import { ScoreDial } from "@/components/posture/ScoreDial";
import { StatusPill } from "@/components/posture/StatusPill";
import { SessionControls } from "@/components/posture/SessionControls";
import { SkeletonOverlay } from "@/components/posture/SkeletonOverlay";
import { usePoseDetector } from "@/features/posture/usePoseDetector";
import { computeMetrics } from "@/features/posture/postureMetrics";
import { classifyScore, scorePosture, DEFAULT_THRESHOLDS } from "@/features/posture/scoring";
import { useSessions } from "@/features/sessions/useSessions";
import { newSessionId, type Session, type PostureClass } from "@/features/sessions/sessionStore";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { SETTINGS_KEY } from "@/features/sessions/sessionStore";
import { formatTimer } from "@/lib/format";
import type { Landmark } from "@/features/posture/landmarks";

type Settings = {
  alertSound: boolean;
  alertDelaySec: number;
  goodCutoff: number;
  badCutoff: number;
};

const DEFAULT_SETTINGS: Settings = {
  alertSound: true,
  alertDelaySec: 5,
  goodCutoff: DEFAULT_THRESHOLDS.goodCutoff,
  badCutoff: DEFAULT_THRESHOLDS.badCutoff,
};

type CamState = "idle" | "requesting" | "ready" | "denied" | "error";

export default function Live() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [camState, setCamState] = useState<CamState>("idle");
  const [camError, setCamError] = useState<string | null>(null);
  const [videoSize, setVideoSize] = useState({ w: 0, h: 0 });

  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);
  const [score, setScore] = useState<number>(0);
  const [confidence, setConfidence] = useState<number>(0);
  const [postureClass, setPostureClass] = useState<PostureClass | null>(null);

  const [sessionState, setSessionState] = useState<"idle" | "running" | "paused">("idle");
  const sessionIdRef = useRef<string | null>(null);
  const sessionStartRef = useRef<number>(0);
  const accumulatedRef = useRef<{ good: number; fair: number; bad: number; lastTickAt: number; scoreSum: number; scoreCount: number }>({
    good: 0,
    fair: 0,
    bad: 0,
    lastTickAt: 0,
    scoreSum: 0,
    scoreCount: 0,
  });
  const samplesRef = useRef<Session["samples"]>([]);
  const lastSampleAtRef = useRef<number>(0);
  const badStartedAtRef = useRef<number | null>(null);
  const lastAlertAtRef = useRef<number>(0);
  const [elapsed, setElapsed] = useState<number>(0);

  const [settings] = useLocalStorage<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS);
  const { add } = useSessions();
  const { toast } = useToast();

  const detectorEnabled = camState === "ready";
  const { status: detectorStatus, error: detectorError } = usePoseDetector({
    enabled: detectorEnabled,
    videoRef,
    onResult: useCallback((frame: { landmarks: Landmark[] | null; timestamp: number }) => {
      const m = computeMetrics(frame.landmarks);
      if (!m) {
        setLandmarks(frame.landmarks);
        return;
      }
      const breakdown = scorePosture(m);
      setLandmarks(frame.landmarks);
      setScore(breakdown.total);
      setConfidence(m.visibility);
      setPostureClass((prev) =>
        classifyScore(
          breakdown.total,
          { goodCutoff: settings.goodCutoff, badCutoff: settings.badCutoff },
          prev ?? undefined,
        ),
      );
    }, [settings.goodCutoff, settings.badCutoff]),
  });

  // Webcam lifecycle
  const startCamera = useCallback(async () => {
    setCamError(null);
    setCamState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      video.srcObject = stream;
      await video.play();
      const onMeta = () => {
        setVideoSize({ w: video.videoWidth, h: video.videoHeight });
      };
      video.onloadedmetadata = onMeta;
      onMeta();
      setCamState("ready");
    } catch (err) {
      const e = err as Error;
      const denied = /denied|NotAllowed/i.test(e.name + e.message);
      setCamState(denied ? "denied" : "error");
      setCamError(e.message || "Could not start the camera.");
    }
  }, []);

  useEffect(() => {
    return () => {
      const video = videoRef.current;
      const stream = video?.srcObject as MediaStream | null;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Session timer + accumulation
  useEffect(() => {
    if (sessionState !== "running") return;
    const id = setInterval(() => {
      const now = Date.now();
      const tickPrev = accumulatedRef.current.lastTickAt || now;
      const dt = (now - tickPrev) / 1000;
      accumulatedRef.current.lastTickAt = now;
      if (postureClass === "good") accumulatedRef.current.good += dt;
      else if (postureClass === "fair") accumulatedRef.current.fair += dt;
      else if (postureClass === "bad") accumulatedRef.current.bad += dt;
      if (postureClass) {
        accumulatedRef.current.scoreSum += score;
        accumulatedRef.current.scoreCount += 1;
      }

      // Sample every ~2s
      if (now - lastSampleAtRef.current > 2000 && postureClass) {
        const t = (now - sessionStartRef.current) / 1000;
        samplesRef.current.push({ t: Math.round(t), score, cls: postureClass });
        if (samplesRef.current.length > 1800) {
          // cap to 1 hour at 2s cadence
          samplesRef.current = samplesRef.current.slice(-1800);
        }
        lastSampleAtRef.current = now;
      }

      // Alert logic
      if (postureClass === "bad") {
        if (badStartedAtRef.current === null) badStartedAtRef.current = now;
        const badFor = (now - badStartedAtRef.current) / 1000;
        const sinceLast = (now - lastAlertAtRef.current) / 1000;
        if (badFor >= settings.alertDelaySec && sinceLast > settings.alertDelaySec) {
          lastAlertAtRef.current = now;
          if (settings.alertSound) playAlert(audioCtxRef);
          toast({
            title: "Time to adjust",
            description: "Soft reminder — straighten up and breathe.",
          });
        }
      } else {
        badStartedAtRef.current = null;
      }

      setElapsed((now - sessionStartRef.current) / 1000);
    }, 250);
    return () => clearInterval(id);
  }, [sessionState, postureClass, score, settings.alertDelaySec, settings.alertSound, toast]);

  const onStart = useCallback(async () => {
    if (camState !== "ready") {
      await startCamera();
    }
    sessionIdRef.current = newSessionId();
    sessionStartRef.current = Date.now();
    accumulatedRef.current = { good: 0, fair: 0, bad: 0, lastTickAt: Date.now(), scoreSum: 0, scoreCount: 0 };
    samplesRef.current = [];
    lastSampleAtRef.current = 0;
    badStartedAtRef.current = null;
    lastAlertAtRef.current = 0;
    setElapsed(0);
    setSessionState("running");
  }, [camState, startCamera]);

  const onPause = useCallback(() => setSessionState("paused"), []);
  const onResume = useCallback(() => {
    accumulatedRef.current.lastTickAt = Date.now();
    setSessionState("running");
  }, []);

  const onEnd = useCallback(() => {
    if (!sessionIdRef.current) {
      setSessionState("idle");
      return;
    }
    const acc = accumulatedRef.current;
    const total = acc.good + acc.fair + acc.bad;
    const session: Session = {
      id: sessionIdRef.current,
      startedAt: sessionStartRef.current,
      endedAt: Date.now(),
      durationSec: Math.round(total),
      goodSec: Math.round(acc.good),
      fairSec: Math.round(acc.fair),
      badSec: Math.round(acc.bad),
      avgScore: acc.scoreCount > 0 ? Math.round(acc.scoreSum / acc.scoreCount) : 0,
      samples: [...samplesRef.current],
    };
    if (session.durationSec >= 5) {
      add(session);
      toast({
        title: "Session saved",
        description: `${formatTimer(session.durationSec)} • Avg score ${session.avgScore}`,
      });
    }
    setSessionState("idle");
    sessionIdRef.current = null;
  }, [add, toast]);

  const aspect = useMemo(() => {
    if (!videoSize.w || !videoSize.h) return 16 / 9;
    return videoSize.w / videoSize.h;
  }, [videoSize]);

  return (
    <div className="px-4 py-6 md:px-10 md:py-10">
      <PageHeader
        eyebrow="Live"
        title="Posture detection"
        description="Sit naturally. The camera watches your shoulders, neck and head — your video never leaves this device."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Webcam panel */}
        <Card className="overflow-hidden border-card-border">
          <div
            ref={containerRef}
            className="relative w-full bg-gradient-to-br from-muted/40 to-muted overflow-hidden"
            style={{ aspectRatio: aspect }}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="absolute inset-0 h-full w-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            <SkeletonOverlay
              landmarks={landmarks}
              videoWidth={videoSize.w}
              videoHeight={videoSize.h}
              postureClass={postureClass}
              mirrored
            />

            {/* Overlay states */}
            <AnimatePresence>
              {camState === "idle" && (
                <Overlay key="idle">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/20 text-primary">
                    <Camera className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">Turn on your camera</h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    We need access to your webcam to read your posture. Video stays on this device.
                  </p>
                  <Button onClick={startCamera} className="mt-5 gap-2" data-testid="button-enable-camera">
                    <Camera className="h-4 w-4" /> Enable camera
                  </Button>
                </Overlay>
              )}
              {camState === "requesting" && (
                <Overlay key="req">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  <h3 className="mt-4 text-lg font-semibold">Asking for camera…</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Please allow access in your browser.</p>
                </Overlay>
              )}
              {camState === "denied" && (
                <Overlay key="denied">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-destructive/15 text-destructive">
                    <AlertCircle className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">Camera blocked</h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Allow camera access in your browser address bar, then try again.
                  </p>
                  <Button onClick={startCamera} variant="outline" className="mt-5 gap-2">
                    <RefreshCw className="h-4 w-4" /> Try again
                  </Button>
                </Overlay>
              )}
              {camState === "error" && (
                <Overlay key="err">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-destructive/15 text-destructive">
                    <AlertCircle className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">Could not start camera</h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    {camError ?? "Something went wrong starting your camera."}
                  </p>
                  <Button onClick={startCamera} className="mt-5 gap-2">
                    <RefreshCw className="h-4 w-4" /> Try again
                  </Button>
                </Overlay>
              )}
              {camState === "ready" && detectorStatus === "loading" && (
                <Overlay key="model">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  <h3 className="mt-4 text-lg font-semibold">Loading AI model…</h3>
                  <p className="mt-1 text-sm text-muted-foreground">First time may take a moment.</p>
                </Overlay>
              )}
              {camState === "ready" && detectorStatus === "error" && (
                <Overlay key="modelErr">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-destructive/15 text-destructive">
                    <AlertCircle className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">AI model failed to load</h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    {detectorError ?? "Try refreshing the page."}
                  </p>
                </Overlay>
              )}
            </AnimatePresence>

            {/* Top-left timer */}
            {sessionState !== "idle" && (
              <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-sm font-medium text-white backdrop-blur">
                <span className={`inline-block h-2 w-2 rounded-full ${sessionState === "running" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                <span className="tabular-nums">{formatTimer(elapsed)}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Side panel */}
        <div className="flex flex-col gap-4">
          <Card className="border-card-border">
            <CardContent className="flex flex-col items-center gap-4 p-6">
              <ScoreDial score={score} postureClass={postureClass} />
              <StatusPill postureClass={postureClass} confidence={confidence} />
              <SessionControls
                state={sessionState}
                onStart={onStart}
                onPause={onPause}
                onResume={onResume}
                onEnd={onEnd}
                disabled={camState === "requesting"}
              />
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardContent className="grid grid-cols-3 gap-3 p-5 text-center">
              <Stat label="Good" value={`${Math.round(accumulatedRef.current.good)}s`} accent="emerald" />
              <Stat label="Fair" value={`${Math.round(accumulatedRef.current.fair)}s`} accent="amber" />
              <Stat label="Bad" value={`${Math.round(accumulatedRef.current.bad)}s`} accent="rose" />
            </CardContent>
          </Card>

          <Card className="border-card-border bg-gradient-to-br from-primary/5 to-accent/30">
            <CardContent className="flex gap-3 p-5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                <Lightbulb className="h-4 w-4" />
              </div>
              <div className="text-sm leading-relaxed">
                <p className="font-medium">Tip</p>
                <p className="mt-0.5 text-muted-foreground">
                  Center yourself in frame so your shoulders, ears, and chest are visible. Soft daylight in front of you works best.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/85 px-6 text-center backdrop-blur-sm"
    >
      {children}
    </motion.div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: "emerald" | "amber" | "rose" }) {
  const colors = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    rose: "text-rose-600 dark:text-rose-400",
  } as const;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`text-lg font-semibold tabular-nums ${colors[accent]}`}>{value}</span>
        </TooltipTrigger>
        <TooltipContent>Time spent in {label.toLowerCase()} posture this session</TooltipContent>
      </Tooltip>
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}

function playAlert(ctxRef: React.MutableRefObject<AudioContext | null>) {
  try {
    if (!ctxRef.current) {
      const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      ctxRef.current = new Ctx();
    }
    const ctx = ctxRef.current!;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const make = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.18, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    };
    make(523.25, 0, 0.18); // C5
    make(659.25, 0.18, 0.22); // E5
  } catch {
    /* ignore */
  }
}
