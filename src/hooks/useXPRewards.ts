import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface XPRewardsConfig {
  studentId: string | null;
  onXPAwarded?: (amount: number, reason: string) => void;
}

export function useXPRewards({ studentId, onXPAwarded }: XPRewardsConfig) {
  
  // Award XP for completing an assignment
  const awardAssignmentCompletion = async (assignmentId: string, score?: number) => {
    if (!studentId) return;
    
    // Base completion XP
    let xpAmount = 50;
    
    // Bonus XP for good grades
    if (score) {
      if (score >= 90) {
        xpAmount += 30; // A grade
      } else if (score >= 80) {
        xpAmount += 20; // B grade
      } else if (score >= 70) {
        xpAmount += 10; // C grade
      }
    }
    
    const { error } = await supabase
      .from('xp_events')
      .insert({
        student_id: studentId,
        amount: xpAmount,
        event_type: 'assignment_completion',
        description: `Completed assignment${score ? ` with ${score}%` : ''}`,
        reference_id: assignmentId,
      });
    
    if (!error) {
      onXPAwarded?.(xpAmount, 'Assignment completed!');
      toast.success(`+${xpAmount} XP earned!`, {
        description: score ? `Great work! You scored ${score}%` : 'Keep up the great work!',
        icon: '🎯',
      });
    }
  };
  
  // Award XP for focus streaks (pomodoro sessions)
  const awardFocusStreak = async (sessionCount: number) => {
    if (!studentId) return;
    
    // Award XP based on consecutive sessions
    let xpAmount = sessionCount * 10;
    
    // Bonus for milestones
    if (sessionCount >= 4) xpAmount += 20;
    if (sessionCount >= 8) xpAmount += 50;
    
    const { error } = await supabase
      .from('xp_events')
      .insert({
        student_id: studentId,
        amount: xpAmount,
        event_type: 'focus_streak',
        description: `${sessionCount} consecutive focus sessions`,
        reference_id: `focus-${Date.now()}`,
      });
    
    if (!error) {
      onXPAwarded?.(xpAmount, 'Focus streak!');
      toast.success(`+${xpAmount} XP for focus streak!`, {
        description: `${sessionCount} sessions in a row! 🔥`,
        icon: '🎯',
      });
    }
  };
  
  // Award XP for daily submission streak
  const awardDailyStreak = async (daysInARow: number) => {
    if (!studentId) return;
    
    // Award increasing XP for longer streaks
    let xpAmount = daysInARow * 15;
    
    // Milestone bonuses
    if (daysInARow >= 7) xpAmount += 50;  // Week streak
    if (daysInARow >= 30) xpAmount += 150; // Month streak
    
    const { error } = await supabase
      .from('xp_events')
      .insert({
        student_id: studentId,
        amount: xpAmount,
        event_type: 'daily_streak',
        description: `${daysInARow} days in a row`,
        reference_id: `streak-${Date.now()}`,
      });
    
    if (!error) {
      onXPAwarded?.(xpAmount, 'Daily streak!');
      toast.success(`+${xpAmount} XP for ${daysInARow} day streak!`, {
        description: 'Keep the momentum going! 🚀',
        icon: '🔥',
      });
    }
  };
  
  // Award XP for correct answers during practice
  const awardCorrectAnswer = async (questionId: string) => {
    if (!studentId) return;
    
    const xpAmount = 5; // Small reward per correct answer
    
    const { error } = await supabase
      .from('xp_events')
      .insert({
        student_id: studentId,
        amount: xpAmount,
        event_type: 'correct_answer',
        description: 'Correct answer',
        reference_id: questionId,
      });
    
    if (!error) {
      onXPAwarded?.(xpAmount, 'Correct!');
    }
  };
  
  // Check and award weekly completion streak
  const checkWeeklyStreak = async () => {
    if (!studentId) return;
    
    try {
      // Get submissions from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: submissions } = await supabase
        .from('submissions')
        .select('created_at')
        .eq('student_id', studentId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });
      
      if (submissions && submissions.length >= 5) {
        // Check if we've already awarded this week
        const { data: existingAward } = await supabase
          .from('xp_events')
          .select('id')
          .eq('student_id', studentId)
          .eq('event_type', 'weekly_completion')
          .gte('created_at', sevenDaysAgo.toISOString())
          .maybeSingle();
        
        if (!existingAward) {
          const xpAmount = 100;
          
          const { error } = await supabase
            .from('xp_events')
            .insert({
              student_id: studentId,
              amount: xpAmount,
              event_type: 'weekly_completion',
              description: 'Completed 5+ assignments this week',
              reference_id: `weekly-${Date.now()}`,
            });
          
          if (!error) {
            onXPAwarded?.(xpAmount, 'Weekly goal achieved!');
            toast.success(`+${xpAmount} XP for weekly completion!`, {
              description: '5+ assignments this week! 🌟',
              icon: '🏆',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking weekly streak:', error);
    }
  };
  
  // Check weekly streak on mount and daily
  useEffect(() => {
    if (studentId) {
      checkWeeklyStreak();
      
      // Check once per day
      const interval = setInterval(checkWeeklyStreak, 24 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [studentId]);
  
  return {
    awardAssignmentCompletion,
    awardFocusStreak,
    awardDailyStreak,
    awardCorrectAnswer,
    checkWeeklyStreak,
  };
}