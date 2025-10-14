import { useState, useEffect, useCallback } from 'react';

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

  const handleVisibilityChange = useCallback(() => {
    const hidden = document.hidden;
    console.log('👁️ Window visibility changed:', { hidden, wasVisible: isVisible });
    setIsVisible(!hidden);
    
    if (hidden) {
      // Window became hidden
      console.log('🚪 User navigated away from tab/window');
      setAwayStartTime(Date.now());
      onHidden?.();
    } else {
      // Window became visible
      console.log('👋 User returned to tab/window');
      if (awayStartTime) {
        const awayDuration = Math.floor((Date.now() - awayStartTime) / 1000);
        setTotalAwaySeconds(prev => prev + awayDuration);
        setAwayStartTime(null);
      }
      onVisible?.();
    }
  }, [awayStartTime, isVisible, onHidden, onVisible]);

  // Handle window blur/focus (for clicking to desktop, other apps, etc.)
  const handleWindowBlur = useCallback(() => {
    console.log('💨 Window blur - user clicked away to desktop/other app');
    setWindowHasFocus(false);
    if (!awayStartTime) {
      setAwayStartTime(Date.now());
      onHidden?.();
    }
  }, [awayStartTime, onHidden]);

  const handleWindowFocus = useCallback(() => {
    console.log('✨ Window focus - user returned from desktop/other app');
    setWindowHasFocus(true);
    if (awayStartTime && isVisible) {
      const awayDuration = Math.floor((Date.now() - awayStartTime) / 1000);
      setTotalAwaySeconds(prev => prev + awayDuration);
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
