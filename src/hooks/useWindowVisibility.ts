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

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  return {
    isVisible,
    totalAwaySeconds,
    awayStartTime
  };
};
