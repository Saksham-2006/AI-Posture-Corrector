# Posture Pal

AI-powered posture corrector web app. Watches your webcam in real time, scores your posture 0–100, and helps you sit better — all in the browser, no backend.

## Stack
- React 18 + Vite + TypeScript
- TailwindCSS + Radix UI primitives + framer-motion
- wouter for routing, recharts for analytics
- next-themes for light/dark mode
- @mediapipe/tasks-vision for in-browser pose detection
- localStorage for all persistence (sessions, settings, achievements)

## Pages
- `/` Dashboard — streak, today stats, recent sessions, achievements
- `/live` Live — webcam + skeleton overlay + score dial + start/pause/end controls
- `/analytics` Analytics — last-session line chart, all-time pie, last-7-days bar
- `/settings` Settings — theme, alert sound + delay, score thresholds, clear data

## Architecture
- `src/features/posture/` — landmarks, postureMetrics (geometric), scoring, usePoseDetector (MediaPipe singleton)
- `src/features/sessions/` — sessionStore (localStorage), useSessions, streak, achievements
- `src/components/` — layout (AppShell, Sidebar, MobileNav), posture (SkeletonOverlay, ScoreDial, StatusPill, SessionControls), onboarding
- `src/pages/` — Dashboard, Live, Analytics, Settings, NotFound

## Privacy
All inference runs locally in the browser via MediaPipe WASM. Video and pose data never leave the device. Sessions are stored only in localStorage.
