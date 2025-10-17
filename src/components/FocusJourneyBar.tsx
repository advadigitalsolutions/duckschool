import { useEffect, useState, useCallback, useRef } from 'react';
import { FocusJourneyDuck } from './FocusJourneyDuck';
import { Sparkles, BookOpen } from 'lucide-react';
import { playSound, playRandomFallSound, playRandomClimbSound, playRandomAttentionSound, playRandomReturnSound } from '@/utils/soundEffects';
import { useActivitySession } from '@/hooks/useActivitySession';
import { useIdleDetection } from '@/hooks/useIdleDetection';
import { useWindowVisibility } from '@/hooks/useWindowVisibility';
import { usePageContext } from '@/hooks/usePageContext';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  reason: 'idle' | 'away' | 'break' | 'reading';
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
  const [duckState, setDuckState] = useState<'walking' | 'falling' | 'fallen' | 'ghostly-jumping' | 'climbing' | 'celebrating' | 'celebrating-return' | 'idle' | 'jumping'>('walking');
  const [goalSeconds] = useState(1500); // 25 minutes default goal
  const [milestonesReached, setMilestonesReached] = useState<number[]>([]);
  const [gapStartTime, setGapStartTime] = useState<number | null>(null);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState<number | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [readingStartTime, setReadingStartTime] = useState<number | null>(null);
  const [readingStartTimestamp, setReadingStartTimestamp] = useState<number | null>(null);
  const [celebrationProgress, setCelebrationProgress] = useState<number | null>(null);
  const [celebrationStartSeconds, setCelebrationStartSeconds] = useState<number | null>(null);
  const lastBlurTime = useRef<number>(0);
  const lastFocusTime = useRef<number>(Date.now());

  // Track learning windows to prevent penalization
  const [activeLearningWindows, setActiveLearningWindows] = useState<Set<string>>(new Set());
  const [lastLearningActivity, setLastLearningActivity] = useState<number>(Date.now());

  useEffect(() => {
    const channel = new BroadcastChannel('learning-window');
    
    channel.onmessage = (event) => {
      const { type, sessionId: msgSessionId, url } = event.data;
      
      if (msgSessionId !== studentId) return;
      
      if (type === 'learning-window-opened') {
        setActiveLearningWindows(prev => new Set(prev).add(url));
        setLastLearningActivity(Date.now());
      } else if (type === 'learning-window-closed') {
        setActiveLearningWindows(prev => {
          const next = new Set(prev);
          next.delete(url);
          return next;
        });
      } else if (type === 'learning-activity') {
        setLastLearningActivity(Date.now());
      }
    };

    return () => channel.close();
  }, [studentId]);

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
    // Don't show warning if duck is fallen, ghostly, on break, or reading
    if (!isOnBreak && !isReading && duckState !== 'fallen' && duckState !== 'ghostly-jumping' && duckState !== 'falling') {
      setDuckState('jumping');
      playRandomAttentionSound(0.6);
    }
  }, [isOnBreak, isReading, duckState]);

  const handleIdle = useCallback(async () => {
    if (isOnBreak || isReading) return; // Don't mark as idle during intentional break or reading
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
  }, [sessionId, studentId, pageContext, courseId, assignmentId, sessionData.activeSeconds, currentSegmentStart, goalSeconds, sessionNumber, isOnBreak, isReading]);

  const handleActive = useCallback(async () => {
    console.log('🟢 handleActive called', { isOnBreak, isReading, sessionId: !!sessionId, gapStartTime });
    // If returning from break or reading, don't treat as gap
    if (isOnBreak || isReading) {
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
      playRandomReturnSound(0.6);
      
      await supabase.from('activity_events').insert({
        student_id: studentId,
        session_id: sessionId,
        event_type: 'resumed_activity',
        page_context: pageContext,
        course_id: courseId,
        assignment_id: assignmentId
      });
    }
  }, [sessionId, studentId, pageContext, courseId, assignmentId, gapStartTime, sessionData.activeSeconds, goalSeconds, isOnBreak, isReading]);

  // Check if user is actively learning (even in another window)
  const hasRecentLearningActivity = activeLearningWindows.size > 0 && 
    (Date.now() - lastLearningActivity < 5000); // 5 second grace period

  const { isIdle, isWarning, resetIdleTimer } = useIdleDetection({
    warningThreshold: 30000, // 30 seconds
    idleThreshold: 60000, // 60 seconds
    onWarning: hasRecentLearningActivity ? () => {} : handleWarning, // Don't warn if learning
    onIdle: hasRecentLearningActivity ? () => {} : handleIdle, // Don't mark as idle if learning
    onActive: handleActive
  });

  const handleWindowHidden = useCallback(async () => {
    // Don't penalize if learning in another window
    if (activeLearningWindows.size > 0) {
      console.log('🦆 Learning window active, not penalizing for hidden window');
      return;
    }
    
    // Prevent duplicate calls - only process if we're not already in a gap
    if (gapStartTime !== null || isOnBreak || isReading) {
      console.log('🦆 Ignoring window blur - already in gap, on break, or reading');
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
      lastBlurTime.current = Date.now();
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
  }, [sessionId, studentId, pageContext, sessionData.activeSeconds, currentSegmentStart, goalSeconds, sessionNumber, gapStartTime, isOnBreak, isReading]);

  const handleWindowVisible = useCallback(async () => {
    console.log('👁️ handleWindowVisible called', { sessionId: !!sessionId, gapStartTime, duckState });
    
    // Check if duck is in fallen or ghostly state - first climb back up!
    if (duckState === 'fallen' || duckState === 'ghostly-jumping') {
      console.log('🎉 User returned while duck was fallen/ghostly - CLIMBING BACK UP!');
      
      if (!sessionId || gapStartTime === null) {
        // Just climb and reset
        setDuckState('climbing');
        playRandomReturnSound(0.6);
        lastFocusTime.current = Date.now();
        resetIdleTimer();
        return;
      }

      // Store current progress before starting climb animation
      const currentSeconds = sessionData.activeSeconds;
      const currentProgress = Math.min((currentSeconds / goalSeconds) * 100, 100);
      console.log(`🎯 Storing celebration progress: ${currentSeconds}s = ${currentProgress.toFixed(2)}%`);
      setCelebrationProgress(currentProgress);
      setCelebrationStartSeconds(currentSeconds);

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
        reason: 'away'
      }]);
      
      // Don't reset currentSegmentStart yet - wait until climb animation completes
      setSessionNumber(prev => prev + 1);
      setGapStartTime(null);
      lastFocusTime.current = Date.now();
      setDuckState('climbing');
      playRandomReturnSound(0.6);
      
      // Reset idle timer when returning
      resetIdleTimer();
      
      await supabase.from('activity_events').insert({
        student_id: studentId,
        session_id: sessionId,
        event_type: 'joyful_return',
        page_context: pageContext,
        metadata: { timestamp: new Date().toISOString(), gap_duration: gapDuration }
      });
      
      return;
    }
    
    // Only process if we actually have a gap to recover from
    if (!sessionId || gapStartTime === null) {
      console.log('🦆 Ignoring window focus - no gap to recover from');
      lastFocusTime.current = Date.now();
      // Reset idle timer when window becomes visible
      resetIdleTimer();
      return;
    }
    
    console.log('🦆 Duck climbing - user returned! sessionId:', sessionId);
    
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
      reason: 'away'
    }]);
    
    // Start new focus segment
    setCurrentSegmentStart(currentSeconds);
    setSessionNumber(prev => prev + 1);
    setGapStartTime(null);
    lastFocusTime.current = Date.now();
    setDuckState('climbing');
    playRandomReturnSound(0.6);
    
    // Reset idle timer when returning
    resetIdleTimer();
    
    await supabase.from('activity_events').insert({
      student_id: studentId,
      session_id: sessionId,
      event_type: 'window_focus',
      page_context: pageContext,
      metadata: { timestamp: new Date().toISOString(), gap_duration: gapDuration }
    });
  }, [sessionId, studentId, pageContext, gapStartTime, sessionData.activeSeconds, goalSeconds, resetIdleTimer, duckState, focusSegments, currentSegmentStart]);

  const { isVisible } = useWindowVisibility({
    onHidden: handleWindowHidden,
    onVisible: handleWindowVisible
  });

  // Create session on mount
  useEffect(() => {
    console.log('🎬 FocusJourneyBar mounted for student:', studentId);
    if (!sessionId) {
      console.log('📝 No session found, creating new session');
      createSession();
    } else {
      console.log('✅ Session already exists:', sessionId);
    }
  }, [sessionId, createSession, studentId]);

  // Update active time counter - only when session is active, user is present, and not idle
  // BUT continue counting during intentional breaks and reading mode
  useEffect(() => {
    // Log state changes
    console.log('⏱️ Timer state:', { 
      sessionId: !!sessionId, 
      isIdle, 
      isVisible,
      isOnBreak,
      isReading,
      shouldRun: !!(sessionId && (isOnBreak || isReading || (!isIdle && isVisible)))
    });
    
    // Continue timer during breaks/reading even if idle or window not focused
    // Only pause if truly idle (not on break/reading) or window not visible
    if (!sessionId || (!isOnBreak && !isReading && (isIdle || !isVisible))) {
      console.log('⏸️ Timer paused:', { sessionId: !!sessionId, isIdle, isVisible, isOnBreak, isReading });
      return;
    }

    console.log('▶️ Timer RUNNING - incrementing every second');
    const interval = setInterval(() => {
      updateActiveTime(1);
    }, 1000);

    // Cleanup interval when component unmounts or dependencies change
    return () => {
      console.log('🛑 Clearing timer interval');
      clearInterval(interval);
    };
  }, [sessionId, isIdle, isVisible, isOnBreak, isReading, updateActiveTime]);

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

  // Calculate progress based on total elapsed time
  useEffect(() => {
    // During celebration, use the preserved progress to prevent jumping
    if (celebrationProgress !== null) {
      console.log(`🎭 CELEBRATION MODE: Using fixed progress ${celebrationProgress.toFixed(2)}%`);
      setProgress(celebrationProgress);
      return;
    }
    
    // Progress is simply: total time elapsed / goal time
    const newProgress = Math.min((sessionData.activeSeconds / goalSeconds) * 100, 100);
    
    console.log(`📊 PROGRESS: ${sessionData.activeSeconds}s / ${goalSeconds}s = ${newProgress.toFixed(2)}%`);
    setProgress(newProgress);

    // Check for milestone achievements
    const milestones = [25, 50, 75, 100];
    milestones.forEach(milestone => {
      if (newProgress >= milestone && !milestonesReached.includes(milestone)) {
        setMilestonesReached(prev => [...prev, milestone]);
        playSound('milestone', 0.5);
        
        if (milestone === 100) {
          setDuckState('celebrating');
          playSound('complete', 0.7);
        }
      }
    });
  }, [celebrationProgress, sessionData.activeSeconds, goalSeconds, milestonesReached]);

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

  const handleReading = () => {
    if (isReading) {
      // Resuming from reading
      const readingDuration = sessionData.activeSeconds - (readingStartTime || 0);
      const startPercent = ((readingStartTime || 0) / goalSeconds) * 100;
      const widthPercent = (readingDuration / goalSeconds) * 100;

      // Add reading segment
      setGapSegments(prev => [...prev, {
        type: 'gap',
        startSeconds: readingStartTime || 0,
        endSeconds: sessionData.activeSeconds,
        startPercent,
        widthPercent,
        duration: readingDuration,
        reason: 'reading'
      }]);

      setCurrentSegmentStart(sessionData.activeSeconds);
      setIsReading(false);
      setReadingStartTime(null);
      setReadingStartTimestamp(null);
      setDuckState('walking');
      toast.success('Back to active learning! 🦆');
    } else {
      // Starting reading
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

      setIsReading(true);
      setReadingStartTime(currentSeconds);
      setReadingStartTimestamp(Date.now());
      setDuckState('idle');
      toast.info('Deep reading mode... Duck is focused and hard at work! 📚🦆', {
        description: 'Stay focused on your reading!'
      });
    }
  };

  const handleDuckAnimationComplete = () => {
    if (duckState === 'climbing') {
      // After climbing, celebrate the return
      setDuckState('celebrating-return');
      playSound('milestone', 0.7);
    } else if (duckState === 'celebrating') {
      setDuckState('walking');
    } else if (duckState === 'celebrating-return') {
      // After celebrating return, set currentSegmentStart to the CURRENT activeSeconds
      // (not the stored one, since time has passed during the celebration animation)
      console.log(`🎬 CELEBRATION END: Setting currentSegmentStart to CURRENT activeSeconds=${sessionData.activeSeconds}s (celebration started at ${celebrationStartSeconds}s, focusSegments total=${focusSegments.reduce((sum, seg) => sum + seg.duration, 0)}s)`);
      setCurrentSegmentStart(sessionData.activeSeconds);
      setCelebrationProgress(null);
      setCelebrationStartSeconds(null);
      setDuckState('walking');
    }
  };

  // Handle duck's internal state changes (fallen, ghostly)
  const handleDuckStateChange = useCallback((newState: typeof duckState) => {
    console.log('🦆 Duck internal state changed to:', newState);
    setDuckState(newState);
  }, []);

  // Handle clicks anywhere on the page when duck is fallen/ghostly
  const handlePageClick = useCallback(async () => {
    if (duckState === 'fallen' || duckState === 'ghostly-jumping') {
      console.log('🎉 User clicked while duck was fallen/ghostly - CLIMBING BACK UP!');
      
      if (!sessionId || gapStartTime === null) {
        // Just climb and reset
        setDuckState('climbing');
        playRandomReturnSound(0.6);
        lastFocusTime.current = Date.now();
        resetIdleTimer();
        return;
      }

      const currentSeconds = sessionData.activeSeconds;
      
      // Store current progress before starting climb animation
      const currentProgress = Math.min((currentSeconds / goalSeconds) * 100, 100);
      console.log(`🎯 Storing celebration progress (click): ${currentSeconds}s = ${currentProgress.toFixed(2)}%`);
      setCelebrationProgress(currentProgress);
      setCelebrationStartSeconds(currentSeconds);

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
        reason: 'away'
      }]);
      
      // Don't reset currentSegmentStart yet - wait until climb animation completes
      setSessionNumber(prev => prev + 1);
      setGapStartTime(null);
      lastFocusTime.current = Date.now();
      setDuckState('climbing');
      playRandomReturnSound(0.6);
      
      // Reset idle timer when returning
      resetIdleTimer();
      
      await supabase.from('activity_events').insert({
        student_id: studentId,
        session_id: sessionId,
        event_type: 'joyful_return',
        page_context: pageContext,
        metadata: { timestamp: new Date().toISOString(), gap_duration: gapDuration }
      });
    }
  }, [duckState, sessionId, gapStartTime, sessionData.activeSeconds, goalSeconds, studentId, pageContext, resetIdleTimer, focusSegments, currentSegmentStart]);

  // Add global click listener for fallen/ghostly states
  useEffect(() => {
    if (duckState === 'fallen' || duckState === 'ghostly-jumping') {
      document.addEventListener('click', handlePageClick);
      return () => document.removeEventListener('click', handlePageClick);
    }
  }, [duckState, handlePageClick]);

  const getProgressColor = () => {
    if (progress >= 75) return 'from-amber-500 to-yellow-500';
    if (progress >= 50) return 'from-emerald-400 to-green-500';
    return 'from-blue-400 to-emerald-500';
  };

  return (
    <div 
      className="w-full bg-card border-b border-border sticky top-0 z-40 pt-12 pb-2 px-4"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Focus journey progress: ${Math.round(progress)}%`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="relative h-10 rounded-full border-2 border-gray-300/40 dark:border-gray-600/40" style={{ 
          overflow: 'visible',
          background: 'transparent'
        }}>
          {/* Single continuous progress fill - color based on current state */}
          <div 
            className="absolute inset-y-1 left-0 rounded-full mx-1 transition-all duration-300 ease-out"
            style={{ 
              width: `${progress}%`,
              background: isReading 
                ? 'linear-gradient(90deg, #93C5FD 0%, #7FB8F9 100%)'
                : isOnBreak
                ? 'linear-gradient(90deg, #F4C2B0 0%, #F4B5A0 100%)'
                : gapStartTime !== null
                ? 'linear-gradient(90deg, #F4A261 0%, #E89455 100%)'
                : 'linear-gradient(90deg, #5FD39E 0%, #4BC187 100%)'
            }}
          />

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
          {(duckState !== 'fallen' && duckState !== 'ghostly-jumping' && duckState !== 'celebrating-return') && (
            <div 
              className="absolute flex items-center pointer-events-none"
              style={{ 
                left: `${Math.min(progress + 2, 100)}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: duckState === 'falling' || duckState === 'climbing' ? 9999 : 10
              }}
            >
              <FocusJourneyDuck 
                animationState={duckState}
                onAnimationComplete={handleDuckAnimationComplete}
                onStateChange={handleDuckStateChange}
              />
            </div>
          )}

          {/* Duck in special states (fallen, ghostly, celebrating-return) - render outside progress bar */}
          {(duckState === 'fallen' || duckState === 'ghostly-jumping' || duckState === 'celebrating-return') && (
            <FocusJourneyDuck 
              animationState={duckState}
              onAnimationComplete={handleDuckAnimationComplete}
              onStateChange={handleDuckStateChange}
            />
          )}

          {/* Control buttons */}
          <TooltipProvider>
            {/* Reading button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleReading}
                  className="absolute right-12 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-blue-400/20 hover:bg-blue-400/30 text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 transition-colors pointer-events-auto"
                  aria-label={isReading ? 'Resume active learning' : 'Reading mode'}
                >
                  {isReading ? (
                    <span className="text-xs font-mono text-blue-700 dark:text-blue-300">
                      {formatDuration(Math.floor((Date.now() - (readingStartTimestamp || Date.now())) / 1000))}
                    </span>
                  ) : (
                    <BookOpen className="w-4 h-4" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isReading ? 'Resume active learning' : 'Reading/Research mode'}</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Break button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleTakeBreak}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-sm pointer-events-auto"
                  aria-label={isOnBreak ? 'Resume focus' : 'Take a break'}
                >
                  {isOnBreak ? (
                    <span className="text-xs font-mono">
                      {formatDuration(sessionData.activeSeconds - (breakStartTime || 0))}
                    </span>
                  ) : (
                    '⏸'
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isOnBreak ? 'Resume focus' : 'Take a quick break!'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
