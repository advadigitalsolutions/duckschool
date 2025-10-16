import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useOverdueXPPenalty(studentId: string | null, overdueAssignments: any[]) {
  const processedPenalties = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    if (!studentId || overdueAssignments.length === 0) return;
    
    const checkAndApplyPenalties = async () => {
      for (const assignment of overdueAssignments) {
        const dueDate = new Date(assignment.due_at);
        const now = new Date();
        const diff = now.getTime() - dueDate.getTime();
        const totalMinutesLate = Math.floor(diff / (1000 * 60));
        
        // Calculate how many 100-minute chunks have passed
        const penaltyChunks = Math.floor(totalMinutesLate / 100);
        
        if (penaltyChunks > 0) {
          const penaltyKey = `${assignment.id}-${penaltyChunks}`;
          
          // Check if we've already processed this penalty level
          if (!processedPenalties.current.has(penaltyKey)) {
            // Check if we've already recorded this penalty in the database
            const { data: existingPenalty } = await supabase
              .from('xp_events')
              .select('id')
              .eq('student_id', studentId)
              .eq('reference_id', assignment.id)
              .eq('description', `Overdue penalty chunk ${penaltyChunks}: ${assignment.curriculum_items?.title || 'Assignment'}`)
              .maybeSingle();
            
            if (!existingPenalty) {
              // Apply -10 XP penalty for this chunk
              const { error } = await supabase
                .from('xp_events')
                .insert({
                  student_id: studentId,
                  amount: -10,
                  event_type: 'overdue_penalty',
                  description: `Overdue penalty chunk ${penaltyChunks}: ${assignment.curriculum_items?.title || 'Assignment'}`,
                  reference_id: assignment.id,
                });
              
              if (!error) {
                processedPenalties.current.add(penaltyKey);
                toast.error(`-10 XP: Assignment is ${Math.floor(totalMinutesLate / 60)}h ${totalMinutesLate % 60}m overdue`, {
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
    };
    
    // Check immediately
    checkAndApplyPenalties();
    
    // Check every minute for new penalty milestones
    const interval = setInterval(checkAndApplyPenalties, 60000);
    
    return () => clearInterval(interval);
  }, [studentId, overdueAssignments]);
}
