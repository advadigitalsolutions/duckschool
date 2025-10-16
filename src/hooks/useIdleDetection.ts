import { useState, useEffect, useCallback, useRef } from 'react';

interface IdleDetectionOptions {
  warningThreshold?: number; // milliseconds for warning (default 30s)
  idleThreshold?: number; // milliseconds for full idle (default 60s)
  onWarning?: () => void; // called at warning threshold
  onIdle?: () => void; // called at idle threshold
  onActive?: () => void;
}

export const useIdleDetection = (options: IdleDetectionOptions = {}) => {
  const { 
    warningThreshold = 30000, // 30 seconds
    idleThreshold = 60000, // 60 seconds 
    onWarning,
    onIdle, 
    onActive 
  } = options;
  
  const [isIdle, setIsIdle] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [idleDuration, setIdleDuration] = useState(0);
  
  const idleTimerRef = useRef<NodeJS.Timeout>();
  const checkIntervalRef = useRef<NodeJS.Timeout>();
  const throttleTimerRef = useRef<{ [key: string]: number }>({});
  const hasCalledActiveRef = useRef(false); // Track if we've called onActive for this idle session

  const resetIdleTimer = useCallback(() => {
    const now = Date.now();
    const wasIdle = isIdle;
    const wasWarning = isWarning;
    
    setLastActivityTime(now);
    setIsIdle(false);
    setIsWarning(false);
    
    // Call onActive when returning from idle/warning state
    if ((wasIdle || wasWarning) && !hasCalledActiveRef.current) {
      console.log('🎯 Activity detected - resetting idle state');
      hasCalledActiveRef.current = true;
      onActive?.();
    }
    
    // Reset the flag when user is active again (not idle/warning)
    if (!wasIdle && !wasWarning) {
      hasCalledActiveRef.current = false;
    }
    
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
  }, [isIdle, isWarning, onActive]);

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

    // Create bound handlers that we can remove later
    const boundHandlers = new Map<string, () => void>();
    activityEvents.forEach(({ type, throttle: throttleMs }) => {
      const handler = () => handleActivity(type, throttleMs);
      boundHandlers.set(type, handler);
      window.addEventListener(type, handler, { passive: true });
    });

    // Check for idle state periodically
    checkIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityTime;
      
      // Warning threshold (30s by default)
      if (timeSinceActivity >= warningThreshold && !isWarning && !isIdle) {
        setIsWarning(true);
        hasCalledActiveRef.current = false; // Reset flag so onActive can be called when user returns
        onWarning?.();
      }
      
      // Full idle threshold (60s by default)
      if (timeSinceActivity >= idleThreshold && !isIdle) {
        setIsIdle(true);
        setIsWarning(false);
        setIdleDuration(timeSinceActivity);
        hasCalledActiveRef.current = false; // Reset flag when going idle
        onIdle?.();
      }
    }, 1000); // Check every second for more responsive warning

    return () => {
      // Properly remove all event listeners
      boundHandlers.forEach((handler, type) => {
        window.removeEventListener(type, handler);
      });
      
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [warningThreshold, idleThreshold, lastActivityTime, isIdle, isWarning, onWarning, onIdle, resetIdleTimer]);

  return {
    isIdle,
    isWarning,
    idleDuration,
    resetIdleTimer,
    lastActivityTime
  };
};
