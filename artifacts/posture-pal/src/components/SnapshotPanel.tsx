import { useState, useCallback, type RefObject } from "react";
import { Camera as CameraIcon, Repeat, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export type Snapshot = {
  id: string;
  dataUrl: string;
  score: number;
  takenAt: number;
};

type Props = {
  videoRef: RefObject<HTMLVideoElement | null>;
  score: number;
  disabled?: boolean;
};

export function SnapshotPanel({ videoRef, score, disabled }: Props) {
  const [reference, setReference] = useState<Snapshot | null>(null);
  const [current, setCurrent] = useState<Snapshot | null>(null);

  const capture = useCallback((): Snapshot | null => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1); // mirror to match what user sees
    ctx.drawImage(video, 0, 0);
    ctx.restore();
    return {
      id: `snap_${Date.now()}`,
      dataUrl: canvas.toDataURL("image/jpeg", 0.7),
      score: Math.round(score),
      takenAt: Date.now(),
    };
  }, [videoRef, score]);

  const handleCapture = useCallback(() => {
    const snap = capture();
    if (!snap) return;
    if (!reference) setReference(snap);
    else setCurrent(snap);
  }, [capture, reference]);

  const handleReplaceCurrent = useCallback(() => {
    const snap = capture();
    if (!snap) return;
    setCurrent(snap);
  }, [capture]);

  const reset = useCallback(() => {
    setReference(null);
    setCurrent(null);
  }, []);

  const diff = reference && current ? current.score - reference.score : null;

  return (
    <div className="rounded-2xl border border-card-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
          <CameraIcon className="h-4 w-4 text-primary" />
          Before / After
        </h3>
        {(reference || current) && (
          <Button variant="ghost" size="sm" onClick={reset} className="h-7 gap-1 text-xs text-muted-foreground" data-testid="button-snapshot-reset">
            <Trash2 className="h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <SnapshotSlot label="Reference" snap={reference} />
        <SnapshotSlot label="Current" snap={current} />
      </div>

      <AnimatePresence>
        {diff !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div
              className={`rounded-xl px-3 py-2 text-sm font-medium ${
                diff > 0
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                  : diff < 0
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {diff > 0 && `+${diff} points improvement`}
              {diff < 0 && `${diff} points lower`}
              {diff === 0 && "No change"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-3 flex gap-2">
        {!reference ? (
          <Button onClick={handleCapture} disabled={disabled} className="flex-1 gap-2" data-testid="button-snapshot-reference">
            <CameraIcon className="h-4 w-4" /> Set reference
          </Button>
        ) : !current ? (
          <Button onClick={handleCapture} disabled={disabled} className="flex-1 gap-2" data-testid="button-snapshot-current">
            <CameraIcon className="h-4 w-4" /> Capture now
          </Button>
        ) : (
          <Button variant="secondary" onClick={handleReplaceCurrent} disabled={disabled} className="flex-1 gap-2" data-testid="button-snapshot-recapture">
            <Repeat className="h-4 w-4" /> Re-capture current
          </Button>
        )}
      </div>
    </div>
  );
}

function SnapshotSlot({ label, snap }: { label: string; snap: Snapshot | null }) {
  return (
    <div className="overflow-hidden rounded-xl border border-card-border bg-muted/40">
      <div className="relative aspect-[4/3] w-full">
        {snap ? (
          <>
            <img src={snap.dataUrl} alt={label} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute bottom-1.5 right-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {snap.score}
            </div>
          </>
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
            empty
          </div>
        )}
      </div>
      <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
