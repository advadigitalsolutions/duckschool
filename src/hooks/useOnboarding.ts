import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseOnboardingReturn {
  hasSeenWizard: (type: string) => boolean;
  markWizardComplete: (type: string, skipped?: boolean) => Promise<void>;
  resetWizard: (type: string) => Promise<void>;
  resetAllWizards: () => Promise<void>;
  loading: boolean;
}

export const useOnboarding = (): UseOnboardingReturn => {
  const [completedWizards, setCompletedWizards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load completion status from DB and localStorage
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Check DB first
        const { data, error } = await supabase
          .from('onboarding_progress')
          .select('wizard_type, completed_at')
          .eq('user_id', user.id);

        if (error) throw error;

        const completed = new Set<string>();
        
        // Add DB records
        data?.forEach(record => {
          if (record.completed_at) {
            completed.add(record.wizard_type);
          }
        });

        // Also check localStorage for backwards compatibility
        const localKeys = [
          'focus_duck_wizard_completed',
          'learning_wizard_completed',
          'dashboard_tour_completed'
        ];
        
        localKeys.forEach(key => {
          if (localStorage.getItem(key)) {
            const wizardType = key.replace('_completed', '');
            completed.add(wizardType);
          }
        });

        setCompletedWizards(completed);
      } catch (error) {
        console.error('Error loading onboarding progress:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, []);

  const hasSeenWizard = useCallback((type: string): boolean => {
    return completedWizards.has(type);
  }, [completedWizards]);

  const markWizardComplete = useCallback(async (type: string, skipped = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update DB
      await supabase
        .from('onboarding_progress')
        .upsert({
          user_id: user.id,
          wizard_type: type,
          completed_at: new Date().toISOString(),
          skipped
        });

      // Update localStorage for backwards compatibility
      localStorage.setItem(`${type}_completed`, 'true');

      // Update state
      setCompletedWizards(prev => new Set(prev).add(type));

      if (!skipped) {
        toast({
          title: "Tutorial complete! 🎉",
          description: "You can replay this anytime from settings"
        });
      }
    } catch (error) {
      console.error('Error marking wizard complete:', error);
    }
  }, [toast]);

  const resetWizard = useCallback(async (type: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete from DB
      await supabase
        .from('onboarding_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('wizard_type', type);

      // Remove from localStorage
      localStorage.removeItem(`${type}_completed`);

      // Update state
      setCompletedWizards(prev => {
        const next = new Set(prev);
        next.delete(type);
        return next;
      });

      toast({
        title: "Tutorial reset",
        description: "The tutorial will show again next time"
      });
    } catch (error) {
      console.error('Error resetting wizard:', error);
    }
  }, [toast]);

  const resetAllWizards = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete all from DB
      await supabase
        .from('onboarding_progress')
        .delete()
        .eq('user_id', user.id);

      // Clear all localStorage keys
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (key.includes('_wizard_completed') || key.includes('_tour_completed')) {
          localStorage.removeItem(key);
        }
      });

      // Reset state
      setCompletedWizards(new Set());

      toast({
        title: "All tutorials reset",
        description: "Tutorials will show again as you explore"
      });
    } catch (error) {
      console.error('Error resetting all wizards:', error);
    }
  }, [toast]);

  return {
    hasSeenWizard,
    markWizardComplete,
    resetWizard,
    resetAllWizards,
    loading
  };
};
