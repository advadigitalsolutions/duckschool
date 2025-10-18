import { useEffect, useState, useCallback, useRef } from 'react';
import { FocusJourneyDuck } from './FocusJourneyDuck';
import { BookOpen } from 'lucide-react';
import { 
  playRandomFallSound, 
  playRandomClimbSound, 
  playRandomAttentionSound, 
  playRandomReturnSound 
} from '@/utils/soundEffects';
import { useActivitySession } from '@/hooks/useActivitySession';
import { useFocusSession } from '@/hooks/useFocusSession';
import { useIdleDetection } from '@/hooks/useIdleDetection';
import { useWindowVisibility } from '@/hooks/useWindowVisibility';
import { usePageContext } from '@/hooks/usePageContext';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface FocusJourneyBarProps {
  studentId: string;
}

export function FocusJourneyBar({ studentId }: FocusJourneyBarProps) {
  const [goalSeconds] = useState(1500); // 25 minutes
  const [duckState, setDuckState] = useState<'walking' | 'falling' | 'fallen' | 'ghostly-jumping' | 'climbing' | 'celebrating' | 'celebrating-return' | 'idle' | 'jumping'>('walking');
  const [milestonesReached, setMilestonesReached] = useState<number[]>([]);
  const [buttonFlash, setButtonFlash] = useState(false);
  const [celebrationProgress, setCelebrationProgress] = useState<number | null>(null);
  const [celebrationStartSeconds, setCelebrationStartSeconds] = useState<number | null>(null);

  // Track learning windows to prevent false idle penalties
  const [activeLearningWindows, setActiveLearningWindows] = useState<Set<string>>(new Set());
  const [lastLearningActivity, setLastLearningActivity] = useState<number>(Date.now());

  const { pageContext, courseId, assignmentId } = usePageContext();

  // Database session management
  const { 
    sessionId, 
    createSession, 
    endSession, 
    updateActiveTime, 
    updateIdleTime, 
    updateAwayTime,
    updateResearchTime,
    sessionData 
  } = useActivitySession(studentId);

  // Clean state management
  const {
    times,
    focusSegments,
    gapSegments,
    progress,
    isOnBreak,
    isReading,
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
  } = useFocusSession(goalSeconds);

  // Sync local times to database
  useEffect(() => {
    if (!sessionId) return;
    
    // Sync active time
    const activeDiff = times.activeSeconds - sessionData.activeSeconds;
    if (activeDiff > 0) {
      updateActiveTime(activeDiff);
    }
  }, [times.activeSeconds]);

  useEffect(() => {
    if (!sessionId) return;
    
    // Sync idle time
    const idleDiff = times.idleSeconds - sessionData.idleSeconds;
    if (idleDiff > 0) {
      updateIdleTime(idleDiff);
    }
  }, [times.idleSeconds]);

  useEffect(() => {
    if (!sessionId) return;
    
    // Sync away time
    const awayDiff = times.awaySeconds - sessionData.awaySeconds;
    if (awayDiff > 0) {
      updateAwayTime(awayDiff);
    }
  }, [times.awaySeconds]);

  useEffect(() => {
    if (!sessionId) return;
    
    // Sync research time
    const researchDiff = times.researchSeconds - sessionData.researchSeconds;
    if (researchDiff > 0) {
      console.log('📚 Syncing research time to DB - diff:', researchDiff);
      updateResearchTime(researchDiff);
    }
  }, [times.researchSeconds]);

  // Learning window broadcast tracking
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

  // Initialize session
  useEffect(() => {
    if (!sessionId) {
      createSession();
    } else {
      startTracking();
    }
  }, [sessionId]);

  // Handle warning (30s idle)
  const handleWarning = useCallback(() => {
    if (!isOnBreak && !isReading && duckState !== 'fallen' && duckState !== 'ghostly-jumping' && duckState !== 'falling') {
      console.log('⚠️ Duck warning - user idle for 30s');
      setDuckState('jumping');
      playRandomAttentionSound(0.6);
    }
  }, [isOnBreak, isReading, duckState]);

  // Handle full idle (60s)
  const handleIdle = useCallback(async () => {
    // Don't mark idle if on break, reading, or actively learning in another window
    const timeSinceLastLearningActivity = Date.now() - lastLearningActivity;
    const hasRecentLearningActivity = timeSinceLastLearningActivity < 60000; // Within last 60s
    
    if (isOnBreak || isReading || (activeLearningWindows.size > 0 && hasRecentLearningActivity)) {
      console.log('⏭️ Skipping idle - user is actively learning');
      return;
    }
    
    console.log('😴 User went idle');
    goIdle();
    setDuckState('falling');
    playRandomFallSound(0.6);
    
    if (sessionId) {
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
  }, [sessionId, studentId, pageContext, courseId, assignmentId, isOnBreak, isReading, activeLearningWindows, lastLearningActivity, goIdle]);

  // Handle return to active
  const handleActive = useCallback(async () => {
    if (isOnBreak || isReading) {
      setDuckState('walking');
      return;
    }
    
    console.log('🟢 User became active');
    goActive();
    setDuckState('climbing');
    playRandomReturnSound(0.6);
    
    if (sessionId) {
      await supabase.from('activity_events').insert({
        student_id: studentId,
        session_id: sessionId,
        event_type: 'resumed_activity',
        page_context: pageContext,
        course_id: courseId,
        assignment_id: assignmentId
      });
    }
  }, [sessionId, studentId, pageContext, courseId, assignmentId, isOnBreak, isReading, goActive]);

  // Idle detection
  useIdleDetection({
    warningThreshold: 30000, // 30 seconds
    idleThreshold: 60000, // 60 seconds
    onWarning: handleWarning,
    onIdle: handleIdle,
    onActive: handleActive
  });

  // Window visibility
  const { isVisible } = useWindowVisibility({
    onHidden: () => {
      if (!isOnBreak && !isReading) {
        console.log('🚪 Window hidden - tracking away time');
        goAway();
      }
    },
    onVisible: () => {
      if (!isOnBreak && !isReading) {
        console.log('👋 Window visible - back to active');
        returnFromAway();
      }
    }
  });

  // Handle take break
  const handleTakeBreak = useCallback(async () => {
    console.log('☕ Taking break');
    startBreak();
    setDuckState('idle');
    toast.success('Break started! Take your time.');
    
    if (sessionId) {
      await supabase.from('activity_events').insert({
        student_id: studentId,
        session_id: sessionId,
        event_type: 'break_started',
        page_context: pageContext
      });
    }
  }, [sessionId, studentId, pageContext, startBreak]);

  // Handle end break
  const handleEndBreak = useCallback(async () => {
    console.log('☕ Ending break');
    endBreak();
    setDuckState('climbing');
    playRandomClimbSound(0.6);
    toast.success('Welcome back! Keep up the good work!');
    
    if (sessionId) {
      await supabase.from('activity_events').insert({
        student_id: studentId,
        session_id: sessionId,
        event_type: 'break_ended',
        page_context: pageContext
      });
    }
  }, [sessionId, studentId, pageContext, endBreak]);

  // Handle reading mode
  const handleReading = useCallback(async () => {
    if (isReading) {
      console.log('📚 Ending focused research');
      endReading();
      setDuckState('walking');
      toast.success('Research session complete!');
      
      if (sessionId) {
        await supabase.from('activity_events').insert({
          student_id: studentId,
          session_id: sessionId,
          event_type: 'reading_ended',
          page_context: pageContext,
          metadata: { research_seconds: times.researchSeconds }
        });
      }
    } else {
      console.log('📚 Starting focused research');
      startReading();
      setButtonFlash(true);
      setTimeout(() => setButtonFlash(false), 3000);
      toast.success('Focused research mode activated!');
      
      if (sessionId) {
        await supabase.from('activity_events').insert({
          student_id: studentId,
          session_id: sessionId,
          event_type: 'reading_started',
          page_context: pageContext
        });
      }
    }
  }, [isReading, sessionId, studentId, pageContext, times.researchSeconds, startReading, endReading]);

  // Check for milestones and celebrations
  useEffect(() => {
    const milestones = [25, 50, 75, 100];
    
    milestones.forEach(milestone => {
      if (progress >= milestone && !milestonesReached.includes(milestone)) {
        setMilestonesReached(prev => [...prev, milestone]);
        
        if (milestone === 100) {
          setDuckState('celebrating');
          setCelebrationProgress(progress);
          setCelebrationStartSeconds(times.activeSeconds);
          toast.success('🎉 Goal complete! Amazing work!', { duration: 5000 });
        } else {
          toast.success(`${milestone}% complete! Keep going!`, { duration: 3000 });
        }
      }
    });
  }, [progress, milestonesReached, times.activeSeconds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionId) {
        stopTracking();
        endSession('manual');
      }
    };
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="relative w-full h-32 bg-gradient-to-b from-transparent via-background/80 to-background backdrop-blur-sm">
        {/* Progress bar track */}
        <div className="absolute bottom-12 left-0 right-0 h-2 bg-muted/30 overflow-hidden">
          {/* Focus segments */}
          {focusSegments.map((segment, i) => (
            <div
              key={`focus-${i}`}
              className="absolute h-full bg-primary/80"
              style={{
                left: `${segment.startPercent}%`,
                width: `${segment.widthPercent}%`
              }}
            />
          ))}
          
          {/* Gap segments */}
          {gapSegments.map((segment, i) => {
            const bgColor = segment.reason === 'break' ? 'bg-blue-500/40' :
                           segment.reason === 'reading' ? 'bg-purple-500/60' :
                           segment.reason === 'away' ? 'bg-yellow-500/40' :
                           'bg-red-500/40';
            
            return (
              <div
                key={`gap-${i}`}
                className={`absolute h-full ${bgColor}`}
                style={{
                  left: `${segment.startPercent}%`,
                  width: `${segment.widthPercent}%`
                }}
              />
            );
          })}
          
          {/* Current progress indicator */}
          <div
            className="absolute h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
          
          {/* Milestone markers */}
          {[25, 50, 75, 100].map(milestone => (
            <div
              key={milestone}
              className={`absolute top-0 bottom-0 w-1 ${
                progress >= milestone ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
              style={{ left: `${milestone}%` }}
            />
          ))}
        </div>

        {/* Duck */}
        <div
          className="absolute bottom-12 transition-all duration-500 ease-out"
          style={{ left: `${Math.min(progress, 100)}%`, transform: 'translateX(-50%)' }}
        >
          <FocusJourneyDuck animationState={duckState} />
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="font-mono">
              {Math.floor(times.activeSeconds / 60)}:{(times.activeSeconds % 60).toString().padStart(2, '0')}
            </span>
            <span className="mx-2">/</span>
            <span>{Math.floor(goalSeconds / 60)} min</span>
            {times.researchSeconds > 0 && (
              <span className="ml-4 text-purple-500">
                📚 {Math.floor(times.researchSeconds / 60)}:{(times.researchSeconds % 60).toString().padStart(2, '0')}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            {isOnBreak ? (
              <button
                onClick={handleEndBreak}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition"
              >
                End Break
              </button>
            ) : (
              <button
                onClick={handleTakeBreak}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
              >
                Take Break
              </button>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleReading}
                    className={`px-4 py-2 rounded-md transition ${
                      isReading
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-500 text-white hover:bg-purple-600'
                    } ${buttonFlash ? 'animate-pulse' : ''}`}
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {isReading ? 'End Focused Research' : 'Start Focused Research'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
