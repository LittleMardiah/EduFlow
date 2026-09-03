import { useEffect, useRef, useCallback } from 'react';

const AUTOSAVE_INTERVAL_MS = 10000;

export function useAutoSave<T>(data: T, save: (data: T) => Promise<void> | void) {
  const dataRef = useRef(data);
  dataRef.current = data;
  const saveRef = useRef(save);
  saveRef.current = save;
  const savedRef = useRef(true);

  const markDirty = useCallback(() => {
    savedRef.current = false;
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (savedRef.current) return;
      try {
        await saveRef.current(dataRef.current);
        savedRef.current = true;
      } catch {
        // keep dirty so it retries on next interval
      }
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const saveNow = useCallback(async () => {
    try {
      await saveRef.current(dataRef.current);
      savedRef.current = true;
    } catch {
      // ignore
    }
  }, []);

  return { markDirty, saveNow };
}
