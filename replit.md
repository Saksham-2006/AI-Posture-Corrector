# Posture Pal

AI-powered posture corrector web app. Watches your webcam in real time, scores your posture 0–100, and surfaces behavioral patterns over time. All inference runs locally in the browser.

## Stack
- React 18 + Vite + TypeScript
- TailwindCSS + Radix UI primitives + framer-motion
- wouter for routing, recharts for charts
- next-themes for light/dark mode
- @mediapipe/tasks-vision for in-browser pose detection
- localStorage for all persistence

## Pages
- `/` Dashboard — greeting, KPI strip (streak / today / avg / level), today's goal ring + level card, today's posture mix, recent sessions, achievements
- `/live` Live — webcam + skeleton overlay, score dial, sub-score bars (neck / shoulders / head-fwd / spine), AI Coach panel, Before/After snapshot panel, break-reminder countdown, intelligent alert with delay
- `/analytics` Analytics — KPIs, behavioral metrics (consistency, longest good streak, avg correction time), AI insights panel, 7×24 posture heatmap, line/pie/bar charts
- `/profile` Profile — Level badge with XP curve, today's goal ring, lifetime stats, full achievement gallery, recent sessions
- `/settings` Settings — theme, daily goal, alert sound/delay, break reminders interval, score thresholds, replay onboarding, clear data

## Architecture
- `src/features/posture/` — landmarks, postureMetrics (geometric), scoring, usePoseDetector (MediaPipe singleton)
- `src/features/sessions/` — sessionStore (localStorage), useSessions, streak, achievements
- `src/features/gamification/` — xp.ts (triangular leveling, levelTitle), goals.ts (todayGoalProgress, countGoalDays)
- `src/features/insights/` — insights.ts (generateInsights, consistencyScore, longestGoodStreak, averageCorrectionTime, buildHeatmap)
- `src/components/` — layout (AppShell, Sidebar, MobileNav), posture (SkeletonOverlay, ScoreDial, StatusPill, SessionControls), AICoachPanel, SnapshotPanel, Heatmap, LevelBadge, GoalRing, SkeletonCard, onboarding
- `src/pages/` — Dashboard, Live, Analytics, Profile, Settings, NotFound

## Behavioral intelligence
- AI Coach picks live tips based on which sub-score (neck / shoulders / forward-head / spine) is weakest, plus celebratory messages for sustained good posture
- Insights compare time-of-day buckets, week-over-week change, best day of week, consistency, longest run, and weekly frequency
- XP: 1/sec good, 0.4/sec fair, +50 per session ≥30s, +100 per goal-day; triangular level curve with named titles

## Privacy
All inference runs locally in the browser via MediaPipe WASM. Video and pose data never leave the device. Sessions are stored only in localStorage.
