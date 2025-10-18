import { useState, useCallback, useEffect } from 'react';
import { useFocusTimer, TimerMode } from './useFocusTimer';

export interface FocusSegment {
  type: 'completed' | 'active';
  startSeconds: number;
  endSeconds?: number;
  startPercent: number;
  widthPercent: number;
  duration: number;
  sessionNumber: number;
}

export interface GapSegment {
  type: 'gap';
  startSeconds: number;
  endSeconds?: number;
  startPercent: number;
  widthPercent: number;
  duration: number;
  reason: 'idle' | 'away' | 'break' | 'reading';
}

interface SessionTimes {
  activeSeconds: number;
  idleSeconds: number;
  awaySeconds: number;
  researchSeconds: number;
}

/**
 * Clean state management for focus session
 * Separates business logic from UI
 */
export const useFocusSession = (goalSeconds: number = 1500) => {
  const [times, setTimes] = useState<SessionTimes>({
    activeSeconds: 0,
    idleSeconds: 0,
    awaySeconds: 0,
    researchSeconds: 0
  });

  const [focusSegments, setFocusSegments] = useState<FocusSegment[]>([]);
  const [gapSegments, setGapSegments] = useState<GapSegment[]>([]);
  const [currentSegmentStart, setCurrentSegmentStart] = useState(0);
  const [sessionNumber, setSessionNumber] = useState(1);
  const [progress, setProgress] = useState(0);
  
  const [timerMode, setTimerMode] = useState<TimerMode>('active');
  const [timerEnabled, setTimerEnabled] = useState(false);
  
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [gapStartTime, setGapStartTime] = useState<number | null>(null);

  // Centralized timer tick handler
  const handleTimerTick = useCallback((seconds: number, mode: TimerMode) => {
    setTimes(prev => {
      const next = { ...prev };
      switch (mode) {
        case 'active':
          next.activeSeconds += seconds;
          break;
        case 'idle':
          next.idleSeconds += seconds;
          break;
        case 'away':
          next.awaySeconds += seconds;
          break;
        case 'research':
          next.researchSeconds += seconds;
          next.activeSeconds += seconds; // Research counts as active time too
          break;
      }
      return next;
    });
  }, []);

  // Use the centralized timer
  useFocusTimer({
    enabled: timerEnabled,
    mode: timerMode,
    onTick: handleTimerTick
  });

  // Calculate progress
  useEffect(() => {
    const totalElapsed = times.activeSeconds + times.idleSeconds + times.awaySeconds;
    const newProgress = Math.min((totalElapsed / goalSeconds) * 100, 100);
    setProgress(newProgress);
  }, [times, goalSeconds]);

  const startTracking = useCallback(() => {
    console.log('📊 Starting focus tracking');
    setTimerEnabled(true);
    setTimerMode('active');
  }, []);

  const stopTracking = useCallback(() => {
    console.log('📊 Stopping focus tracking');
    setTimerEnabled(false);
  }, []);

  const goIdle = useCallback(() => {
    if (isOnBreak || isReading) return;
    
    console.log('😴 Going idle');
    const currentSeconds = times.activeSeconds;
    const duration = currentSeconds - currentSegmentStart;
    
    if (duration > 0) {
      const startPercent = (currentSegmentStart / goalSeconds) * 100;
      const widthPercent = (duration / goalSeconds) * 100;
      
      setFocusSegments(prev => [...prev, {
        type: 'completed',
        startSeconds: currentSegmentStart,
        endSeconds: currentSeconds,
        startPercent,
        widthPercent,
        duration,
        sessionNumber
      }]);
    }
    
    setGapStartTime(currentSeconds);
    setTimerMode('idle');
  }, [times.activeSeconds, currentSegmentStart, goalSeconds, sessionNumber, isOnBreak, isReading]);

  const goActive = useCallback(() => {
    if (isOnBreak || isReading) return;
    
    console.log('🟢 Going active');
    if (gapStartTime !== null) {
      const currentSeconds = times.activeSeconds;
      const gapDuration = currentSeconds - gapStartTime;
      const startPercent = (gapStartTime / goalSeconds) * 100;
      const widthPercent = (gapDuration / goalSeconds) * 100;
      
      setGapSegments(prev => [...prev, {
        type: 'gap',
        startSeconds: gapStartTime,
        endSeconds: currentSeconds,
        startPercent,
        widthPercent,
        duration: gapDuration,
        reason: 'idle'
      }]);
      
      setCurrentSegmentStart(currentSeconds);
      setSessionNumber(prev => prev + 1);
      setGapStartTime(null);
    }
    
    setTimerMode('active');
  }, [gapStartTime, times.activeSeconds, goalSeconds, isOnBreak, isReading]);

  const goAway = useCallback(() => {
    console.log('🚪 User went away');
    setTimerMode('away');
  }, []);

  const returnFromAway = useCallback(() => {
    console.log('👋 User returned');
    setTimerMode('active');
  }, []);

  const startBreak = useCallback(() => {
    console.log('☕ Starting break');
    const currentSeconds = times.activeSeconds;
    const duration = currentSeconds - currentSegmentStart;
    
    if (duration > 0) {
      const startPercent = (currentSegmentStart / goalSeconds) * 100;
      const widthPercent = (duration / goalSeconds) * 100;
      
      setFocusSegments(prev => [...prev, {
        type: 'completed',
        startSeconds: currentSegmentStart,
        endSeconds: currentSeconds,
        startPercent,
        widthPercent,
        duration,
        sessionNumber
      }]);
    }
    
    setIsOnBreak(true);
    setTimerEnabled(false);
  }, [times.activeSeconds, currentSegmentStart, goalSeconds, sessionNumber]);

  const endBreak = useCallback(() => {
    console.log('☕ Ending break');
    const breakDuration = times.activeSeconds - currentSegmentStart;
    const startPercent = (currentSegmentStart / goalSeconds) * 100;
    const widthPercent = (breakDuration / goalSeconds) * 100;
    
    setGapSegments(prev => [...prev, {
      type: 'gap',
      startSeconds: currentSegmentStart,
      startPercent,
      widthPercent,
      duration: breakDuration,
      reason: 'break'
    }]);
    
    setCurrentSegmentStart(times.activeSeconds);
    setSessionNumber(prev => prev + 1);
    setIsOnBreak(false);
    setTimerEnabled(true);
    setTimerMode('active');
  }, [times.activeSeconds, currentSegmentStart, goalSeconds]);

  const startReading = useCallback(() => {
    console.log('📚 Starting focused research');
    const currentSeconds = times.activeSeconds;
    
    setIsReading(true);
    setTimerMode('research');
  }, [times.activeSeconds]);

  const endReading = useCallback(() => {
    console.log('📚 Ending focused research');
    const readingDuration = times.researchSeconds;
    const startPercent = (currentSegmentStart / goalSeconds) * 100;
    const widthPercent = (readingDuration / goalSeconds) * 100;
    
    setGapSegments(prev => [...prev, {
      type: 'gap',
      startSeconds: currentSegmentStart,
      startPercent,
      widthPercent,
      duration: readingDuration,
      reason: 'reading'
    }]);
    
    setIsReading(false);
    setTimerMode('active');
  }, [times.researchSeconds, currentSegmentStart, goalSeconds]);

  const reset = useCallback(() => {
    console.log('🔄 Resetting focus session');
    setTimes({
      activeSeconds: 0,
      idleSeconds: 0,
      awaySeconds: 0,
      researchSeconds: 0
    });
    setFocusSegments([]);
    setGapSegments([]);
    setCurrentSegmentStart(0);
    setSessionNumber(1);
    setProgress(0);
    setGapStartTime(null);
    setIsOnBreak(false);
    setIsReading(false);
    setTimerEnabled(false);
  }, []);

  return {
    // State
    times,
    focusSegments,
    gapSegments,
    progress,
    sessionNumber,
    isOnBreak,
    isReading,
    
    // Actions
    startTracking,
    stopTracking,
    goIdle,
    goActive,
    goAway,
    returnFromAway,
    startBreak,
    endBreak,
    startReading,
    endReading,
    reset
  };
};
