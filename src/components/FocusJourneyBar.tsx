import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FocusJourneyDuck } from './FocusJourneyDuck';
import { Sparkles } from 'lucide-react';
import { playSound } from '@/utils/soundEffects';
import { useActivitySession } from '@/hooks/useActivitySession';
import { useIdleDetection } from '@/hooks/useIdleDetection';
import { useWindowVisibility } from '@/hooks/useWindowVisibility';
import { usePageContext } from '@/hooks/usePageContext';

interface ActivitySegment {
  type: 'active' | 'idle' | 'away' | 'break';
  start: number; // percentage
  width: number; // percentage
}

interface FocusJourneyBarProps {
  studentId: string;
}

export function FocusJourneyBar({ studentId }: FocusJourneyBarProps) {
  const [segments, setSegments] = useState<ActivitySegment[]>([]);
  const [progress, setProgress] = useState(0);
  const [duckState, setDuckState] = useState<'walking' | 'falling' | 'climbing' | 'celebrating' | 'idle'>('walking');
  const [goalSeconds] = useState(1500); // 25 minutes default goal
  const [milestonesReached, setMilestonesReached] = useState<number[]>([]);

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

  const { isIdle } = useIdleDetection({
    threshold: 60000, // 60 seconds
    onIdle: async () => {
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
        setDuckState('falling');
      }
    },
    onActive: async () => {
      if (sessionId) {
        await supabase.from('activity_events').insert({
          student_id: studentId,
          session_id: sessionId,
          event_type: 'resumed_activity',
          page_context: pageContext,
          course_id: courseId,
          assignment_id: assignmentId
        });
        setDuckState('climbing');
      }
    }
  });

  const { isVisible } = useWindowVisibility({
    onHidden: async () => {
      if (sessionId) {
        await supabase.from('activity_events').insert({
          student_id: studentId,
          session_id: sessionId,
          event_type: 'window_blur',
          page_context: pageContext
        });
      }
    },
    onVisible: async () => {
      if (sessionId) {
        await supabase.from('activity_events').insert({
          student_id: studentId,
          session_id: sessionId,
          event_type: 'window_focus',
          page_context: pageContext
        });
      }
    }
  });

  // Create session on mount
  useEffect(() => {
    if (!sessionId) {
      createSession();
    }
  }, [sessionId, createSession]);

  // Update active time counter
  useEffect(() => {
    if (!sessionId || isIdle || !isVisible) return;

    const interval = setInterval(() => {
      updateActiveTime(1);
    }, 1000);

    return () => clearInterval(interval);
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
        }
      }
    });
  }, [sessionData.activeSeconds, goalSeconds, milestonesReached]);

  // Subscribe to activity events for real-time updates
  useEffect(() => {
    if (!studentId) return;

    const channel = supabase
      .channel('focus_journey_updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_events',
        filter: `student_id=eq.${studentId}`
      }, (payload) => {
        const event = payload.new;
        
        // Update segments based on event type
        if (event.event_type === 'went_idle' || 
            event.event_type === 'window_blur' ||
            event.event_type === 'bio_break_start') {
          // Add gap segment
          setSegments(prev => [...prev, {
            type: event.event_type === 'bio_break_start' ? 'break' : 'idle',
            start: progress,
            width: 2 // Will update with actual duration
          }]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId, progress]);

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
        <div className="relative h-10 bg-muted/30 rounded-full overflow-hidden border border-border/50">
          {/* Progress fill */}
          <div 
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getProgressColor()} transition-all duration-500 ease-out`}
            style={{ width: `${progress}%` }}
          />

          {/* Idle/gap segments */}
          {segments.map((segment, index) => (
            <div
              key={index}
              className={`absolute inset-y-0 border-2 border-dashed ${
                segment.type === 'break' ? 'border-blue-400' : 'border-yellow-400'
              } bg-transparent`}
              style={{ 
                left: `${segment.start}%`, 
                width: `${segment.width}%` 
              }}
            />
          ))}

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

          {/* Duck character */}
          <div 
            className="absolute top-0 bottom-0 flex items-center transition-all duration-500 ease-out"
            style={{ 
              left: `calc(${progress}% - 15px)`,
              transform: 'translateY(-5px)'
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
