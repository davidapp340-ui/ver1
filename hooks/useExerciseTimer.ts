import { useState, useRef, useCallback, useEffect } from 'react';

interface UseExerciseTimerReturn {
  secondsRemaining: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: (newDuration: number) => void;
}

export function useExerciseTimer(
  initialDuration: number,
  onComplete: () => void
): UseExerciseTimerReturn {
  const [secondsRemaining, setSecondsRemaining] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimer();
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          setIsRunning(false);
          setTimeout(() => onCompleteRef.current(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const reset = useCallback(
    (newDuration: number) => {
      clearTimer();
      setIsRunning(false);
      setSecondsRemaining(newDuration);
    },
    [clearTimer]
  );

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  return { secondsRemaining, isRunning, start, pause, reset };
}
