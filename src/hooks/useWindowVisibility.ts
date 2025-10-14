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
    setIsVisible(!hidden);
    
    if (hidden) {
      // Window became hidden
      setAwayStartTime(Date.now());
      onHidden?.();
    } else {
      // Window became visible
      if (awayStartTime) {
        const awayDuration = Math.floor((Date.now() - awayStartTime) / 1000);
        setTotalAwaySeconds(prev => prev + awayDuration);
        setAwayStartTime(null);
      }
      onVisible?.();
    }
  }, [awayStartTime, onHidden, onVisible]);

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
