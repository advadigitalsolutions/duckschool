import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Storage key for tracking applied penalties
const PENALTY_STORAGE_KEY = 'overdue_penalties_applied';

// Get penalties applied in this browser session
const getAppliedPenaltiesFromStorage = (): Set<string> => {
  try {
    const stored = localStorage.getItem(PENALTY_STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

// Save penalties applied in this browser session
const saveAppliedPenaltyToStorage = (penaltyKey: string) => {
  try {
    const existing = getAppliedPenaltiesFromStorage();
    existing.add(penaltyKey);
    localStorage.setItem(PENALTY_STORAGE_KEY, JSON.stringify([...existing]));
  } catch {
    // Ignore storage errors
  }
};

export function useOverdueXPPenalty(studentId: string | null, overdueAssignments: any[]) {
  const isProcessing = useRef<boolean>(false);
  const hasCheckedOnMount = useRef<boolean>(false);
  
  useEffect(() => {
    if (!studentId || overdueAssignments.length === 0) return;
    
    // Only run once on mount, not on every render
    if (hasCheckedOnMount.current) return;
    hasCheckedOnMount.current = true;
    
    const checkAndApplyPenalties = async () => {
      // Prevent concurrent executions
      if (isProcessing.current) return;
      isProcessing.current = true;
      
      try {
        const appliedInSession = getAppliedPenaltiesFromStorage();
        
        for (const assignment of overdueAssignments) {
          const dueDate = new Date(assignment.due_at);
          const now = new Date();
          const diff = now.getTime() - dueDate.getTime();
          const totalDaysLate = Math.floor(diff / (1000 * 60 * 60 * 24));
          
          if (totalDaysLate > 0) {
            const penaltyKey = `${studentId}-${assignment.id}-day-${totalDaysLate}`;
            
            // Skip if already processed in this session
            if (appliedInSession.has(penaltyKey)) continue;
            
            // Build the exact description that would be used
            const penaltyDescription = `Overdue penalty (Day ${totalDaysLate}): ${assignment.curriculum_items?.title || 'Assignment'}`;
            
            // Check database for this exact penalty
            const { data: existingPenalty } = await supabase
              .from('xp_events')
              .select('id')
              .eq('student_id', studentId)
              .eq('reference_id', assignment.id)
              .eq('event_type', 'overdue_penalty')
              .eq('description', penaltyDescription)
              .maybeSingle();
            
            if (!existingPenalty) {
              // Apply penalty
              const { error } = await supabase
                .from('xp_events')
                .insert({
                  student_id: studentId,
                  amount: -10,
                  event_type: 'overdue_penalty',
                  description: penaltyDescription,
                  reference_id: assignment.id,
                });
              
              if (!error) {
                saveAppliedPenaltyToStorage(penaltyKey);
                toast.error(`-10 XP: Assignment is ${totalDaysLate} day${totalDaysLate > 1 ? 's' : ''} overdue`, {
                  icon: '⏰',
                });
              }
            } else {
              // Already exists in DB, mark as applied in session
              saveAppliedPenaltyToStorage(penaltyKey);
            }
          }
        }
      } finally {
        isProcessing.current = false;
      }
    };
    
    // Run check after a short delay
    const timeoutId = setTimeout(checkAndApplyPenalties, 1000);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [studentId, overdueAssignments]);
}
