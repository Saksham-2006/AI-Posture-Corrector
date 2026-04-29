import { useCallback, useEffect, useState } from "react";
import {
  type Session,
  readSessions,
  writeSessions,
  appendSession,
  SESSIONS_KEY,
} from "./sessionStore";

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>(() => readSessions());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SESSIONS_KEY) setSessions(readSessions());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((s: Session) => {
    appendSession(s);
    setSessions(readSessions());
  }, []);

  const clear = useCallback(() => {
    writeSessions([]);
    setSessions([]);
  }, []);

  return { sessions, add, clear, refresh: () => setSessions(readSessions()) };
}
