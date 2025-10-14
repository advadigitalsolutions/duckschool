import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useFocusJourney } from '@/contexts/FocusJourneyContext';
import { toast } from 'sonner';

interface BioBreakButtonProps {
  studentId: string;
}

export function BioBreakButton({ studentId }: BioBreakButtonProps) {
  const { sessionId } = useFocusJourney();
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isOnBreak || !breakStartTime) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - breakStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOnBreak, breakStartTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleBreak = async () => {
    if (!sessionId) return;

    if (!isOnBreak) {
      // Start break
      setIsOnBreak(true);
      setBreakStartTime(Date.now());
      
      await supabase.from('activity_events').insert({
        student_id: studentId,
        session_id: sessionId,
        event_type: 'bio_break_start',
        metadata: { timestamp: new Date().toISOString() }
      });

      toast.info('Break started - Timer paused');
    } else {
      // End break
      const duration = breakStartTime ? Math.floor((Date.now() - breakStartTime) / 1000) : 0;
      
      await supabase.from('activity_events').insert({
        student_id: studentId,
        session_id: sessionId,
        event_type: 'bio_break_end',
        metadata: { 
          duration_seconds: duration,
          timestamp: new Date().toISOString() 
        }
      });

      toast.success(`Break ended (${formatTime(duration)})`);
      
      setIsOnBreak(false);
      setBreakStartTime(null);
      setElapsedTime(0);
    }
  };

  return (
    <Button
      onClick={handleToggleBreak}
      variant={isOnBreak ? "destructive" : "outline"}
      size="sm"
      className="fixed bottom-4 right-4 z-50 shadow-lg"
    >
      {isOnBreak ? (
        <>⏸️ Resume ({formatTime(elapsedTime)})</>
      ) : (
        <>🚽 Quick Pause</>
      )}
    </Button>
  );
}
