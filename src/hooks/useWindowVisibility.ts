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
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Handle window blur/focus with debouncing to prevent false positives
  const handleWindowBlur = useCallback(() => {
    // Clear any pending blur timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }

    // Only process blur if focused for at least 2 seconds
    const timeSinceFocus = Date.now() - lastFocusTime.current;
    if (timeSinceFocus < 2000) {
      console.log('💨 Ignoring blur - too soon after focus:', timeSinceFocus, 'ms');
      return;
    }

    // Delay blur action to avoid false positives from quick clicks
    blurTimeoutRef.current = setTimeout(() => {
      console.log('💨 Window blur - user clicked away to desktop/other app');
      setWindowHasFocus(false);
      lastBlurTime.current = Date.now();
      if (!awayStartTime) {
        setAwayStartTime(Date.now());
        onHidden?.();
      }
    }, 500); // 500ms delay to filter out quick clicks
  }, [awayStartTime, onHidden]);

  const handleWindowFocus = useCallback(() => {
    // Clear any pending blur timeout - this was just a quick click
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
      console.log('✨ Focus returned quickly - ignoring blur');
      return;
    }

    const timeSinceBlur = Date.now() - lastBlurTime.current;
    console.log('✨ Window focus - user returned from desktop/other app. Time since blur:', timeSinceBlur, 'ms');
    
    setWindowHasFocus(true);
    
    // Only trigger onVisible if we've been away for a meaningful amount of time
    if (awayStartTime && isVisible && timeSinceBlur > 1000) {
      const awayDuration = Math.floor((Date.now() - awayStartTime) / 1000);
      setTotalAwaySeconds(prev => prev + awayDuration);
      setAwayStartTime(null);
      lastFocusTime.current = Date.now();
      onVisible?.();
    } else if (awayStartTime && timeSinceBlur <= 1000) {
      // Was away too briefly, cancel the blur
      console.log('✨ Blur was too brief, canceling');
      setAwayStartTime(null);
      lastFocusTime.current = Date.now();
    } else {
      lastFocusTime.current = Date.now();
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
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, [handleVisibilityChange, handleWindowBlur, handleWindowFocus]);

  return {
    isVisible: isVisible && windowHasFocus,
    totalAwaySeconds,
    awayStartTime
  };
};
