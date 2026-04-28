import { useCallback, useEffect, useRef, useState } from "react";
import {
  PoseLandmarker,
  FilesetResolver,
  type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";
import type { Landmark } from "./landmarks";

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

let cachedLandmarker: PoseLandmarker | null = null;
let cachedPromise: Promise<PoseLandmarker> | null = null;

async function getLandmarker(): Promise<PoseLandmarker> {
  if (cachedLandmarker) return cachedLandmarker;
  if (cachedPromise) return cachedPromise;
  cachedPromise = (async () => {
    const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
    const lm = await PoseLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    cachedLandmarker = lm;
    return lm;
  })();
  try {
    return await cachedPromise;
  } catch (err) {
    cachedPromise = null;
    throw err;
  }
}

export type DetectionFrame = {
  landmarks: Landmark[] | null;
  timestamp: number;
};

export type DetectorStatus = "idle" | "loading" | "ready" | "error";

export type UsePoseDetectorOptions = {
  enabled: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onResult?: (frame: DetectionFrame) => void;
};

export function usePoseDetector({ enabled, videoRef, onResult }: UsePoseDetectorOptions) {
  const [status, setStatus] = useState<DetectorStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const onResultRef = useRef(onResult);
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const tick = useCallback(() => {
    const lm = landmarkerRef.current;
    const video = videoRef.current;
    if (!lm || !video) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      try {
        const result: PoseLandmarkerResult = lm.detectForVideo(video, performance.now());
        const landmarks = result.landmarks?.[0] ?? null;
        onResultRef.current?.({
          landmarks: landmarks as Landmark[] | null,
          timestamp: performance.now(),
        });
      } catch {
        // single-frame errors should not kill the loop
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [videoRef]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setStatus("loading");
    setError(null);
    getLandmarker()
      .then((lm) => {
        if (cancelled) return;
        landmarkerRef.current = lm;
        setStatus("ready");
        rafRef.current = requestAnimationFrame(tick);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to load pose model");
      });
    return () => {
      cancelled = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [enabled, tick]);

  return { status, error };
}
