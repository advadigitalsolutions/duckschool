import { useEffect, useState, useCallback } from 'react';
import { FocusJourneyDuck } from './FocusJourneyDuck';
import { Sparkles } from 'lucide-react';
import { playSound, playRandomFallSound, playRandomClimbSound, playRandomAttentionSound } from '@/utils/soundEffects';
import { useActivitySession } from '@/hooks/useActivitySession';
import { useIdleDetection } from '@/hooks/useIdleDetection';
import { useWindowVisibility } from '@/hooks/useWindowVisibility';
import { usePageContext } from '@/hooks/usePageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FocusSegment {
  type: 'completed' | 'active';
  startSeconds: number;
  endSeconds?: number;
  startPercent: number;
  widthPercent: number;
  duration: number; // in seconds
  sessionNumber: number;
}

interface GapSegment {
  type: 'gap';
  startSeconds: number;
  endSeconds?: number;
  startPercent: number;
  widthPercent: number;
  duration: number; // in seconds
  reason: 'idle' | 'away' | 'break';
}

interface FocusJourneyBarProps {
  studentId: string;
}

export function FocusJourneyBar({ studentId }: FocusJourneyBarProps) {
  const [focusSegments, setFocusSegments] = useState<FocusSegment[]>([]);
  const [gapSegments, setGapSegments] = useState<GapSegment[]>([]);
  const [currentSegmentStart, setCurrentSegmentStart] = useState(0);
  const [sessionNumber, setSessionNumber] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duckState, setDuckState] = useState<'walking' | 'falling' | 'climbing' | 'celebrating' | 'idle' | 'jumping'>('walking');
  const [goalSeconds] = useState(1500); // 25 minutes default goal
  const [milestonesReached, setMilestonesReached] = useState<number[]>([]);
  const [gapStartTime, setGapStartTime] = useState<number | null>(null);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState<number | null>(null);

  // Log duck state changes
  useEffect(() => {
    console.log('🦆 Duck state changed to:', duckState);
  }, [duckState]);

  const { 
    sessionId, 
    createSession, 
    endSession, 
    updateActiveTime, 
    updateIdleTime, 
    updateAwayTime,
    sessionData 
  } = useActivitySession(studentId);

  const { pageContext, courseId, assignmentId } = usePageContext();

  const handleWarning = useCallback(() => {
    console.log('⚠️ Duck warning - user idle for 30s');
    if (!isOnBreak) {
      setDuckState('jumping');
      playRandomAttentionSound(0.6);
    }
  }, [isOnBreak]);

  const handleIdle = useCallback(async () => {
    if (isOnBreak) return; // Don't mark as idle during intentional break
    if (sessionId) {
      // Complete current focus segment
      const currentSeconds = sessionData.activeSeconds;
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
      setDuckState('falling');
      playRandomFallSound(0.6);
      
      await supabase.from('activity_events').insert({
        student_id: studentId,
        session_id: sessionId,
        event_type: 'went_idle',
        page_context: pageContext,
        course_id: courseId,
        assignment_id: assignmentId,
        metadata: { duration_seconds: 0 }
      });
    }
  }, [sessionId, studentId, pageContext, courseId, assignmentId, sessionData.activeSeconds, currentSegmentStart, goalSeconds, sessionNumber, isOnBreak]);

  const handleActive = useCallback(async () => {
    // If returning from break, don't treat as gap
    if (isOnBreak) {
      setDuckState('walking');
      return;
    }
    if (sessionId && gapStartTime !== null) {
      const currentSeconds = sessionData.activeSeconds;
      const gapDuration = currentSeconds - gapStartTime;
      const startPercent = (gapStartTime / goalSeconds) * 100;
      const widthPercent = (gapDuration / goalSeconds) * 100;
      
      // Create gap segment
      setGapSegments(prev => [...prev, {
        type: 'gap',
        startSeconds: gapStartTime,
        endSeconds: currentSeconds,
        startPercent,
        widthPercent,
        duration: gapDuration,
        reason: 'idle'
      }]);
      
      // Start new focus segment
      setCurrentSegmentStart(currentSeconds);
      setSessionNumber(prev => prev + 1);
      setGapStartTime(null);
      setDuckState('climbing');
      playRandomClimbSound(0.5);
      
      await supabase.from('activity_events').insert({
        student_id: studentId,
        session_id: sessionId,
        event_type: 'resumed_activity',
        page_context: pageContext,
        course_id: courseId,
        assignment_id: assignmentId
      });
    }
  }, [sessionId, studentId, pageContext, courseId, assignmentId, gapStartTime, sessionData.activeSeconds, goalSeconds, isOnBreak]);

  const { isIdle, isWarning } = useIdleDetection({
    warningThreshold: 30000, // 30 seconds
    idleThreshold: 60000, // 60 seconds
    onWarning: handleWarning,
    onIdle: handleIdle,
    onActive: handleActive
  });

  const handleWindowHidden = useCallback(async () => {
    // Prevent duplicate calls - only process if we're not already in a gap
    if (gapStartTime !== null || isOnBreak) {
      console.log('🦆 Ignoring window blur - already in gap or on break');
      return;
    }
    
    console.log('🦆 Duck falling - user left tab! sessionId:', sessionId);
    if (sessionId) {
      // Complete current focus segment
      const currentSeconds = sessionData.activeSeconds;
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
      setDuckState('falling');
      playRandomFallSound(0.6);
      
      await supabase.from('activity_events').insert({
        student_id: studentId,
        session_id: sessionId,
        event_type: 'window_blur',
        page_context: pageContext,
        metadata: { timestamp: new Date().toISOString() }
      });
    } else {
      console.warn('⚠️ No session ID when trying to log window_blur');
    }
  }, [sessionId, studentId, pageContext, sessionData.activeSeconds, currentSegmentStart, goalSeconds, sessionNumber, gapStartTime, isOnBreak]);

  const handleWindowVisible = useCallback(async () => {
    // Only process if we actually have a gap to recover from
    if (!sessionId || gapStartTime === null) {
      console.log('🦆 Ignoring window focus - no gap to recover from');
      return;
    }
    
    // Minimum gap duration to avoid false positives (100ms)
    const currentSeconds = sessionData.activeSeconds;
    const gapDuration = currentSeconds - gapStartTime;
    if (gapDuration < 0.1) {
      console.log('🦆 Ignoring window focus - gap too short:', gapDuration);
      setGapStartTime(null); // Reset the gap start time
      return;
    }
    
    console.log('🦆 Duck climbing - user returned! sessionId:', sessionId, 'gap duration:', gapDuration);
    
    const startPercent = (gapStartTime / goalSeconds) * 100;
    const widthPercent = (gapDuration / goalSeconds) * 100;
    
    // Create gap segment
    setGapSegments(prev => [...prev, {
      type: 'gap',
      startSeconds: gapStartTime,
      endSeconds: currentSeconds,
      startPercent,
      widthPercent,
      duration: gapDuration,
      reason: 'away'
    }]);
    
    // Start new focus segment
    setCurrentSegmentStart(currentSeconds);
    setSessionNumber(prev => prev + 1);
    setGapStartTime(null);
    setDuckState('climbing');
    playRandomClimbSound(0.5);
    
    await supabase.from('activity_events').insert({
      student_id: studentId,
      session_id: sessionId,
      event_type: 'window_focus',
      page_context: pageContext,
      metadata: { timestamp: new Date().toISOString(), gap_duration: gapDuration }
    });
  }, [sessionId, studentId, pageContext, gapStartTime, sessionData.activeSeconds, goalSeconds]);

  const { isVisible } = useWindowVisibility({
    onHidden: handleWindowHidden,
    onVisible: handleWindowVisible
  });

  // Create session on mount
  useEffect(() => {
    if (!sessionId) {
      createSession();
    }
  }, [sessionId, createSession]);

  // Update active time counter - only when session is active, user is present, and not idle
  useEffect(() => {
    // Don't count if any of these conditions are true
    if (!sessionId || isIdle || !isVisible) {
      console.log('⏸️ Timer paused:', { sessionId: !!sessionId, isIdle, isVisible });
      return;
    }

    console.log('▶️ Timer active:', { sessionId: !!sessionId, isIdle, isVisible });
    const interval = setInterval(() => {
      updateActiveTime(1);
    }, 1000);

    // Cleanup interval when component unmounts or dependencies change
    return () => {
      console.log('🛑 Clearing timer interval');
      clearInterval(interval);
    };
  }, [sessionId, isIdle, isVisible, updateActiveTime]);

  // Update idle time counter
  useEffect(() => {
    if (!sessionId || !isIdle) return;

    const interval = setInterval(() => {
      updateIdleTime(1);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId, isIdle, updateIdleTime]);

  // Update away time counter
  useEffect(() => {
    if (!sessionId || isVisible) return;

    const interval = setInterval(() => {
      updateAwayTime(1);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId, isVisible, updateAwayTime]);

  // Calculate progress based on active time
  useEffect(() => {
    const newProgress = Math.min((sessionData.activeSeconds / goalSeconds) * 100, 100);
    setProgress(newProgress);

    // Check for milestone achievements
    const milestones = [25, 50, 75, 100];
    milestones.forEach(milestone => {
      if (newProgress >= milestone && !milestonesReached.includes(milestone)) {
        setMilestonesReached(prev => [...prev, milestone]);
        playSound('milestone', 0.5);
        
        if (milestone === 100) {
          setDuckState('celebrating');
          playSound('complete', 0.7); // Celebration sound!
        }
      }
    });
  }, [sessionData.activeSeconds, goalSeconds, milestonesReached]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
  };

  const handleTakeBreak = () => {
    if (isOnBreak) {
      // Resuming from break
      const breakDuration = sessionData.activeSeconds - (breakStartTime || 0);
      const startPercent = ((breakStartTime || 0) / goalSeconds) * 100;
      const widthPercent = (breakDuration / goalSeconds) * 100;

      // Add break segment
      setGapSegments(prev => [...prev, {
        type: 'gap',
        startSeconds: breakStartTime || 0,
        endSeconds: sessionData.activeSeconds,
        startPercent,
        widthPercent,
        duration: breakDuration,
        reason: 'break'
      }]);

      setCurrentSegmentStart(sessionData.activeSeconds);
      setIsOnBreak(false);
      setBreakStartTime(null);
      setDuckState('walking');
      toast.success('Break over! Back to work! 🦆');
    } else {
      // Starting break
      const currentSeconds = sessionData.activeSeconds;
      
      // Complete current focus segment
      if (currentSeconds > currentSegmentStart) {
        const duration = currentSeconds - currentSegmentStart;
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
      setBreakStartTime(currentSeconds);
      setDuckState('idle');
      toast.info('Break time! Duck is resting 🦆💤');
    }
  };

  const handleDuckAnimationComplete = () => {
    if (duckState === 'climbing') {
      setDuckState('walking');
    } else if (duckState === 'celebrating') {
      setDuckState('walking');
    }
  };

  const getProgressColor = () => {
    if (progress >= 75) return 'from-amber-500 to-yellow-500';
    if (progress >= 50) return 'from-emerald-400 to-green-500';
    return 'from-blue-400 to-emerald-500';
  };

  return (
    <div 
      className="w-full bg-card border-b border-border sticky top-0 z-40 py-2 px-4"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Focus journey progress: ${Math.round(progress)}%`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1" />
          <Button
            variant={isOnBreak ? "default" : "outline"}
            size="sm"
            onClick={handleTakeBreak}
            className="text-xs"
          >
            {isOnBreak ? '▶️ Resume Focus' : '☕ Take Break'}
          </Button>
        </div>
        <div className="relative h-10 bg-muted/30 rounded-full border border-border/50" style={{ overflow: 'visible' }}>
          {/* Completed focus segments */}
          {focusSegments.map((segment, index) => (
            <div
              key={`focus-${index}`}
              className="absolute inset-y-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shadow-md"
              style={{ 
                left: `${segment.startPercent}%`, 
                width: `${segment.widthPercent}%`,
                minWidth: '40px'
              }}
            >
              {segment.widthPercent > 3 && formatDuration(segment.duration)}
            </div>
          ))}

          {/* Gap segments */}
          {gapSegments.map((segment, index) => {
            const showTimestamp = segment.duration >= 60;
            const isShortGap = segment.duration < 60;
            const isBreak = segment.reason === 'break';
            
            return (
              <div
                key={`gap-${index}`}
                className={`absolute inset-y-0 flex items-center justify-center ${
                  isBreak 
                    ? 'bg-amber-500/20 border-2 border-amber-500/40 rounded-full' 
                    : isShortGap 
                      ? 'bg-transparent' 
                      : 'bg-muted/50'
                }`}
                style={{ 
                  left: `${segment.startPercent}%`, 
                  width: `${segment.widthPercent}%`,
                  minWidth: isShortGap ? '2px' : isBreak ? '30px' : '20px',
                  borderLeft: isShortGap ? '2px dashed hsl(var(--border))' : 'none',
                  borderRight: isShortGap ? '2px dashed hsl(var(--border))' : 'none'
                }}
              >
                {isBreak && segment.widthPercent > 2 && (
                  <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300">
                    ☕ {formatDuration(segment.duration)}
                  </span>
                )}
                {!isBreak && showTimestamp && segment.widthPercent > 4 && (
                  <span className="text-[9px] text-muted-foreground font-medium">
                    Away: {formatDuration(segment.duration)}
                  </span>
                )}
              </div>
            );
          })}

          {/* Current active segment */}
          {gapStartTime === null && !isOnBreak && (
            <div 
              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getProgressColor()} transition-all duration-500 ease-out opacity-40 rounded-full`}
              style={{ 
                left: `${(currentSegmentStart / goalSeconds) * 100}%`,
                width: `${((sessionData.activeSeconds - currentSegmentStart) / goalSeconds) * 100}%` 
              }}
            />
          )}

          {/* Milestone markers */}
          <div className="absolute inset-0 flex justify-between px-2 pointer-events-none">
            {[25, 50, 75, 100].map(milestone => (
              <div
                key={milestone}
                className="flex items-center justify-center"
                style={{ marginLeft: milestone === 100 ? '-8px' : '0' }}
              >
                {milestonesReached.includes(milestone) && (
                  <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
                )}
              </div>
            ))}
          </div>

          {/* Duck character - positioned to break out of container */}
          <div 
            className="absolute top-0 bottom-0 flex items-center transition-all duration-500 ease-out pointer-events-none"
            style={{ 
              left: `calc(${progress}% - 15px)`,
              transform: 'translateY(-5px)',
              zIndex: duckState === 'falling' || duckState === 'climbing' ? 9999 : 10
            }}
          >
            <FocusJourneyDuck 
              animationState={duckState}
              onAnimationComplete={handleDuckAnimationComplete}
            />
          </div>
        </div>

        {/* Progress text */}
        <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
          <span>{Math.round(progress)}%</span>
          <span className="font-medium text-foreground">
            {Math.floor(sessionData.activeSeconds / 60)} / {Math.floor(goalSeconds / 60)} minutes
          </span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
