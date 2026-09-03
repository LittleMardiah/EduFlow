import { useEffect, useRef, useState, useCallback } from 'react';

const WARNING_THRESHOLD_SECONDS = 5 * 60;

export function useQuizTimer(initialSeconds: number, onTimerEnd?: () => void) {
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const onTimerEndRef = useRef(onTimerEnd);
  onTimerEndRef.current = onTimerEnd;

  const isWarning = timeRemaining > 0 && timeRemaining <= WARNING_THRESHOLD_SECONDS;

  const pause = useCallback(() => setIsRunning(false), []);
  const resume = useCallback(() => setIsRunning(true), []);

  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, timeRemaining]);

  useEffect(() => {
    if (timeRemaining === 0 && onTimerEndRef.current) {
      onTimerEndRef.current();
    }
  }, [timeRemaining]);

  return { timeRemaining, isWarning, isRunning, pause, resume };
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
