import { useState, useEffect, useCallback, useRef } from 'react';

interface IdleDetectionOptions {
  threshold?: number; // milliseconds
  onIdle?: () => void;
  onActive?: () => void;
}

export const useIdleDetection = (options: IdleDetectionOptions = {}) => {
  const { threshold = 60000, onIdle, onActive } = options; // Default 60 seconds
  
  const [isIdle, setIsIdle] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [idleDuration, setIdleDuration] = useState(0);
  
  const idleTimerRef = useRef<NodeJS.Timeout>();
  const checkIntervalRef = useRef<NodeJS.Timeout>();
  const throttleTimerRef = useRef<{ [key: string]: number }>({});

  const resetIdleTimer = useCallback(() => {
    const now = Date.now();
    setLastActivityTime(now);
    
    if (isIdle) {
      const duration = now - lastActivityTime;
      setIdleDuration(duration);
      setIsIdle(false);
      onActive?.();
    }
    
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
  }, [isIdle, lastActivityTime, onActive]);

  const throttle = (eventType: string, delay: number, callback: () => void) => {
    const now = Date.now();
    const lastCall = throttleTimerRef.current[eventType] || 0;
    
    if (now - lastCall >= delay) {
      throttleTimerRef.current[eventType] = now;
      callback();
    }
  };

  useEffect(() => {
    const activityEvents = [
      { type: 'mousemove', throttle: 500 },
      { type: 'mousedown', throttle: 0 },
      { type: 'keydown', throttle: 0 },
      { type: 'scroll', throttle: 300 },
      { type: 'touchstart', throttle: 0 },
      { type: 'wheel', throttle: 300 }
    ];

    const handleActivity = (eventType: string, throttleMs: number) => {
      if (throttleMs > 0) {
        throttle(eventType, throttleMs, resetIdleTimer);
      } else {
        resetIdleTimer();
      }
    };

    // Add event listeners
    activityEvents.forEach(({ type, throttle: throttleMs }) => {
      window.addEventListener(type, () => handleActivity(type, throttleMs), { passive: true });
    });

    // Check for idle state periodically
    checkIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityTime;
      
      if (timeSinceActivity >= threshold && !isIdle) {
        setIsIdle(true);
        setIdleDuration(timeSinceActivity);
        onIdle?.();
      }
    }, 5000); // Check every 5 seconds

    return () => {
      activityEvents.forEach(({ type }) => {
        window.removeEventListener(type, () => {});
      });
      
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [threshold, lastActivityTime, isIdle, onIdle, resetIdleTimer]);

  return {
    isIdle,
    idleDuration,
    resetIdleTimer,
    lastActivityTime
  };
};
