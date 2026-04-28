import { useCallback, useEffect, useRef, useState } from "react";

type Updater<T> = T | ((prev: T) => T);

export function useLocalStorage<T>(
  key: string,
  initial: T,
): [T, (value: Updater<T>) => void] {
  const initialRef = useRef(initial);

  const read = useCallback((): T => {
    if (typeof window === "undefined") return initialRef.current;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return initialRef.current;
      return JSON.parse(raw) as T;
    } catch {
      return initialRef.current;
    }
  }, [key]);

  const [value, setValue] = useState<T>(read);

  // Re-read on key change
  useEffect(() => {
    setValue(read());
  }, [read]);

  const set = useCallback(
    (next: Updater<T>) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          /* quota or privacy mode — ignore */
        }
        return resolved;
      });
    },
    [key],
  );

  // Sync across tabs
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        try {
          setValue(e.newValue === null ? initialRef.current : (JSON.parse(e.newValue) as T));
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  return [value, set];
}
