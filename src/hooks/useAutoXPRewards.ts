import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AutoXPConfig {
  studentId: string | null;
  enabled?: boolean;
}

/**
 * Hook that automatically awards XP for various student activities
 */
export function useAutoXPRewards({ studentId, enabled = true }: AutoXPConfig) {
  
  useEffect(() => {
    if (!studentId || !enabled) return;

    // Listen for assignment submissions and award XP
    const submissionsChannel = supabase
      .channel('xp-submissions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'submissions',
          filter: `student_id=eq.${studentId}`
        },
        async (payload) => {
          console.log('New submission detected, awarding XP', payload);
          
          // Award base submission XP
          await supabase.from('xp_events').insert({
            student_id: studentId,
            amount: 25,
            event_type: 'submission_completed',
            description: 'Submitted an assignment',
            reference_id: payload.new.assignment_id || payload.new.id,
          });
        }
      )
      .subscribe();

    // Listen for grades and award bonus XP for good performance
    const gradesChannel = supabase
      .channel('xp-grades')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'grades',
          filter: `student_id=eq.${studentId}`
        },
        async (payload) => {
          console.log('New grade detected, checking for bonus XP', payload);
          
          const score = payload.new.score as number;
          const maxScore = payload.new.max_score as number || 100;
          const percentage = (score / maxScore) * 100;
          
          let bonusXP = 0;
          let bonusReason = '';
          
          if (percentage >= 95) {
            bonusXP = 50;
            bonusReason = 'Outstanding work! 95%+ score';
          } else if (percentage >= 90) {
            bonusXP = 30;
            bonusReason = 'Excellent! 90%+ score';
          } else if (percentage >= 80) {
            bonusXP = 20;
            bonusReason = 'Great job! 80%+ score';
          } else if (percentage >= 70) {
            bonusXP = 10;
            bonusReason = 'Good effort! 70%+ score';
          }
          
          if (bonusXP > 0) {
            await supabase.from('xp_events').insert({
              student_id: studentId,
              amount: bonusXP,
              event_type: 'grade_bonus',
              description: bonusReason,
              reference_id: payload.new.assignment_id || payload.new.id,
            });
          }
        }
      )
      .subscribe();

    // Listen for daily goals completion
    const goalsChannel = supabase
      .channel('xp-goals')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'daily_goals',
          filter: `student_id=eq.${studentId}`
        },
        async (payload) => {
          // Check if goal was just completed
          const oldCompleted = payload.old?.completed;
          const newCompleted = payload.new.completed;
          
          if (!oldCompleted && newCompleted) {
            console.log('Goal completed, awarding XP');
            
            await supabase.from('xp_events').insert({
              student_id: studentId,
              amount: 5,
              event_type: 'goal_completed',
              description: 'Completed a daily micro-goal',
              reference_id: payload.new.id,
            });
          }
        }
      )
      .subscribe();

    // Listen for learning sessions (focus time)
    const sessionsChannel = supabase
      .channel('xp-sessions')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'learning_sessions',
          filter: `student_id=eq.${studentId}`
        },
        async (payload) => {
          // Award XP when session ends
          if (payload.old && !payload.old.session_end && payload.new.session_end) {
            const activeSeconds = payload.new.total_active_seconds || 0;
            const activeMinutes = Math.floor(activeSeconds / 60);
            
            // Award 1 XP per 5 minutes of active focus time
            const xpAmount = Math.floor(activeMinutes / 5);
            
            if (xpAmount > 0) {
              await supabase.from('xp_events').insert({
                student_id: studentId,
                amount: xpAmount,
                event_type: 'focus_time',
                description: `${activeMinutes} minutes of focused learning`,
                reference_id: payload.new.id,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(submissionsChannel);
      supabase.removeChannel(gradesChannel);
      supabase.removeChannel(goalsChannel);
      supabase.removeChannel(sessionsChannel);
    };
  }, [studentId, enabled]);

  return null;
}
