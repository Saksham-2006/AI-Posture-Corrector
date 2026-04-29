# Posture Pal

AI-powered posture corrector web app with a glassmorphism design system, premium navigation, and local-first authentication. Watches your webcam in real time, scores your posture 0–100, and surfaces behavioral patterns over time. All inference runs locally in the browser.

## Stack
- React 18 + Vite + TypeScript
- TailwindCSS + Radix UI primitives + framer-motion
- wouter for routing, recharts for charts
- next-themes for light/dark mode
- @mediapipe/tasks-vision for in-browser pose detection
- Inter (preloaded) as the global font
- localStorage for all persistence (sessions, settings, achievements, users, session token)

## Pages
- `/` Dashboard — greeting, KPI strip, today's goal ring + level card, today's posture mix, recent sessions, achievements
- `/live` Live — webcam + skeleton overlay, score dial, sub-score bars, AI Coach panel, Before/After snapshot panel, break reminders
- `/analytics` Analytics — KPIs, behavioral metrics (consistency, longest good streak, avg correction time), AI insights, 7×24 heatmap, charts
- `/profile` Profile — Level badge, today's goal ring, lifetime stats, achievement gallery, recent sessions
- `/settings` Settings — theme, daily goal, alert sound/delay, break reminders interval, score thresholds
- `/login` Login — glass form with email/password, show/hide toggle, "continue without account"
- `/signup` Signup — glass form with name/email/password/confirm, live password strength + match hints

## Design system
- Ambient pastel radial-gradient blobs on the body (lavender + mint + sky), tuned for both light and dark mode
- `.glass`, `.glass-strong`, `.glass-nav` utilities (backdrop-blur + saturate + soft inner highlight)
- `.gradient-primary` (lavender→violet) used by primary buttons; `.text-gradient` for hero headlines
- `Card` defaults to `rounded-2xl glass` so all panels share the glass treatment
- Sticky top navbar with logo, animated active-pill (framer-motion `layoutId`), streak chip, theme toggle, and profile dropdown / Sign in CTA
- Mobile slide-in drawer (right side) with the same nav and identity card

## Authentication (local-only)
- `features/auth/authStore.ts` — SHA-256 password hashing via `crypto.subtle`, users in `pp_users`, current session in `pp_session`
- `features/auth/AuthContext.tsx` — `<AuthProvider>` exposes `useAuth()` returning `{ user, ready, signup, login, logout }`
- Auth is **optional**: all app routes work for guests; the navbar shows "Sign in" instead of an avatar
- Profile dropdown shows avatar (initials), name, email, level title, links to Profile/Settings, and Sign out

## Architecture
- `src/features/posture/` — landmarks, postureMetrics, scoring, usePoseDetector
- `src/features/sessions/` — sessionStore, useSessions, streak, achievements
- `src/features/gamification/` — xp, goals
- `src/features/insights/` — insights, consistency, longest streak, correction time, heatmap
- `src/features/auth/` — authStore, AuthContext
- `src/components/layout/` — AppShell, TopNav (replaces old Sidebar/MobileNav)
- `src/components/` — posture, AICoachPanel, SnapshotPanel, Heatmap, LevelBadge, GoalRing, SkeletonCard, onboarding
- `src/pages/` — Dashboard, Live, Analytics, Profile, Settings, Login, Signup, NotFound
- `src/pages/auth/AuthLayout.tsx` — shared two-column glass auth layout with brand panel

## localStorage keys
- `pp_sessions`, `pp_settings`, `pp_onboarded`, `pp_achievements` — app state
- `pp_users`, `pp_session` — auth

## Privacy
All inference runs locally in the browser via MediaPipe WASM. Video and pose data never leave the device. Sessions and accounts are stored only in localStorage on this device.
