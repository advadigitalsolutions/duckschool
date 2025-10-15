import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DiscussionProgress {
  exchangeCount: number;
  shouldShowTip: boolean;
  dismissTip: () => Promise<void>;
}

export const useDiscussionProgress = (
  studentId: string,
  assignmentId: string
): DiscussionProgress => {
  const [exchangeCount, setExchangeCount] = useState(0);
  const [shouldShowTip, setShouldShowTip] = useState(false);
  const [tipsShown, setTipsShown] = useState(0);

  useEffect(() => {
    loadProgress();
  }, [studentId, assignmentId]);

  const loadProgress = async () => {
    try {
      // Check if tips should be shown
      const { data: studentData } = await supabase
        .from('students')
        .select('discussion_tips_shown')
        .eq('id', studentId)
        .single();

      const tipsCount = studentData?.discussion_tips_shown || 0;
      setTipsShown(tipsCount);
      setShouldShowTip(tipsCount < 3);

      // Load conversation history to count exchanges
      const { data: progressData } = await supabase
        .from('assignment_learning_progress')
        .select('ai_coaching_history')
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .maybeSingle();

      if (progressData?.ai_coaching_history) {
        const history = Array.isArray(progressData.ai_coaching_history) 
          ? progressData.ai_coaching_history 
          : [];
        
        // Count user messages only
        const userMessages = history.filter((m: any) => m.role === 'user');
        setExchangeCount(userMessages.length);
      }
    } catch (error) {
      console.error('Error loading discussion progress:', error);
    }
  };

  const dismissTip = async () => {
    setShouldShowTip(false);
    
    // Increment tips shown counter
    try {
      const { error } = await supabase
        .from('students')
        .update({ discussion_tips_shown: tipsShown + 1 })
        .eq('id', studentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating tips counter:', error);
    }
  };

  return {
    exchangeCount,
    shouldShowTip,
    dismissTip
  };
};
