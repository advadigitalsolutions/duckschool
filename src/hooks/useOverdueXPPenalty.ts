import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useOverdueXPPenalty(studentId: string | null, overdueAssignments: any[]) {
  const processedPenalties = useRef<Set<string>>(new Set());
  const isProcessing = useRef<boolean>(false);
  
  useEffect(() => {
    if (!studentId || overdueAssignments.length === 0 || isProcessing.current) return;
    
    const checkAndApplyPenalties = async () => {
      // Prevent concurrent executions
      if (isProcessing.current) return;
      isProcessing.current = true;
      
      try {
        for (const assignment of overdueAssignments) {
          const dueDate = new Date(assignment.due_at);
          const now = new Date();
          const diff = now.getTime() - dueDate.getTime();
          const totalDaysLate = Math.floor(diff / (1000 * 60 * 60 * 24));
          
          // Calculate how many full days have passed since due date
          if (totalDaysLate > 0) {
            const penaltyKey = `${assignment.id}-day-${totalDaysLate}`;
            
            // Check if we've already processed this penalty level in this session
            if (!processedPenalties.current.has(penaltyKey)) {
              // Check if we've already recorded this penalty in the database
              const { data: existingPenalties } = await supabase
                .from('xp_events')
                .select('id')
                .eq('student_id', studentId)
                .eq('reference_id', assignment.id)
                .eq('event_type', 'overdue_penalty')
                .gte('created_at', new Date(dueDate.getTime() + totalDaysLate * 24 * 60 * 60 * 1000).toISOString())
                .lte('created_at', new Date(dueDate.getTime() + (totalDaysLate + 1) * 24 * 60 * 60 * 1000).toISOString());
              
              if (!existingPenalties || existingPenalties.length === 0) {
                // Apply -10 XP penalty for this day
                const { error } = await supabase
                  .from('xp_events')
                  .insert({
                    student_id: studentId,
                    amount: -10,
                    event_type: 'overdue_penalty',
                    description: `Overdue penalty (Day ${totalDaysLate}): ${assignment.curriculum_items?.title || 'Assignment'}`,
                    reference_id: assignment.id,
                  });
                
                if (!error) {
                  processedPenalties.current.add(penaltyKey);
                  toast.error(`-10 XP: Assignment is ${totalDaysLate} day${totalDaysLate > 1 ? 's' : ''} overdue`, {
                    icon: '⏰',
                  });
                }
              } else {
                // Mark as processed so we don't check again
                processedPenalties.current.add(penaltyKey);
              }
            }
          }
        }
      } finally {
        isProcessing.current = false;
      }
    };
    
    // Check on mount after a short delay to prevent race conditions
    const timeoutId = setTimeout(checkAndApplyPenalties, 500);
    
    // Check every hour for new penalty days
    const interval = setInterval(checkAndApplyPenalties, 60 * 60 * 1000);
    
    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [studentId, overdueAssignments]);
}
