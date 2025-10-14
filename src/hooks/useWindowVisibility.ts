import { useState, useEffect, useCallback, useRef } from 'react';

interface WindowVisibilityOptions {
  onHidden?: () => void;
  onVisible?: () => void;
}

export const useWindowVisibility = (options: WindowVisibilityOptions = {}) => {
  const { onHidden, onVisible } = options;
  
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [awayStartTime, setAwayStartTime] = useState<number | null>(null);
  const [totalAwaySeconds, setTotalAwaySeconds] = useState(0);
  const [windowHasFocus, setWindowHasFocus] = useState(true);
  const lastBlurTime = useRef<number>(0);
  const lastFocusTime = useRef<number>(Date.now());

  const handleVisibilityChange = useCallback(() => {
    const hidden = document.hidden;
    console.log('👁️ Window visibility changed:', { hidden, wasVisible: isVisible });
    setIsVisible(!hidden);
    
    if (hidden) {
      // Window became hidden
      console.log('🚪 User navigated away from tab/window');
      setAwayStartTime(Date.now());
      lastBlurTime.current = Date.now();
      onHidden?.();
    } else {
      // Window became visible
      console.log('👋 User returned to tab/window');
      const timeSinceBlur = Date.now() - lastBlurTime.current;
      if (awayStartTime && timeSinceBlur > 1000) { // Minimum 1 second away
        const awayDuration = Math.floor((Date.now() - awayStartTime) / 1000);
        setTotalAwaySeconds(prev => prev + awayDuration);
        setAwayStartTime(null);
        lastFocusTime.current = Date.now();
        onVisible?.();
      } else if (awayStartTime) {
        // Was away too briefly, cancel the blur
        console.log('👁️ Visibility change too brief, ignoring');
        setAwayStartTime(null);
      }
    }
  }, [awayStartTime, isVisible, onHidden, onVisible]);

  // Handle window blur/focus - simplified without aggressive debouncing
  const handleWindowBlur = useCallback(() => {
    console.log('💨 Window blur - user clicked away');
    setWindowHasFocus(false);
    
    // Start tracking away time if not already tracking
    if (!awayStartTime && document.visibilityState === 'visible') {
      const now = Date.now();
      setAwayStartTime(now);
      lastBlurTime.current = now;
      onHidden?.();
    }
  }, [awayStartTime, onHidden]);

  const handleWindowFocus = useCallback(() => {
    const now = Date.now();
    console.log('✨ Window focus - user returned');
    
    setWindowHasFocus(true);
    lastFocusTime.current = now;
    
    // Calculate away time if we were tracking it
    if (awayStartTime && isVisible) {
      const awayDuration = Math.floor((now - awayStartTime) / 1000);
      if (awayDuration > 0) {
        setTotalAwaySeconds(prev => prev + awayDuration);
      }
      setAwayStartTime(null);
      onVisible?.();
    }
  }, [awayStartTime, isVisible, onVisible]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [handleVisibilityChange, handleWindowBlur, handleWindowFocus]);

  return {
    isVisible: isVisible && windowHasFocus,
    totalAwaySeconds,
    awayStartTime
  };
};
