import { useEffect, useRef, useCallback } from 'react';

export type TimerMode = 'active' | 'idle' | 'away' | 'research';

interface FocusTimerOptions {
  enabled: boolean;
  mode: TimerMode;
  onTick: (seconds: number, mode: TimerMode) => void;
}

/**
 * Centralized timer for focus tracking
 * Single source of truth for time increments
 */
export const useFocusTimer = ({ enabled, mode, onTick }: FocusTimerOptions) => {
  const intervalRef = useRef<NodeJS.Timeout>();
  const modeRef = useRef<TimerMode>(mode);

  // Keep mode ref in sync
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const tick = useCallback(() => {
    onTick(1, modeRef.current);
  }, [onTick]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      return;
    }

    console.log('⏱️ Focus timer starting in mode:', mode);
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) {
        console.log('⏱️ Focus timer stopped');
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, [enabled, tick, mode]);

  return {
    isRunning: !!intervalRef.current
  };
};

