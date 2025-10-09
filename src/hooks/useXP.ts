import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface XPEvent {
  id: string;
  student_id: string;
  amount: number;
  event_type: string;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface XPConfig {
  id: string;
  parent_id: string;
  assignment_completion_xp: number;
  question_correct_xp: number;
  daily_goal_completion_xp: number;
  attendance_per_minute_xp: number;
  custom_rules: any;
}

export function useXP(studentId?: string) {
  const [totalXP, setTotalXP] = useState(0);
  const [availableXP, setAvailableXP] = useState(0);
  const [weeklyXP, setWeeklyXP] = useState(0);
  const [xpEvents, setXPEvents] = useState<XPEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      fetchXPData();
    }
  }, [studentId]);

  const fetchXPData = async () => {
    if (!studentId) return;

    try {
      // Fetch all XP events
      const { data: events, error: eventsError } = await supabase
        .from('xp_events')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      setXPEvents(events || []);

      // Calculate totals
      const total = events?.reduce((sum, event) => sum + event.amount, 0) || 0;
      setTotalXP(total);
      setAvailableXP(total); // Same as total for now (will be adjusted for redemptions)

      // Calculate weekly XP (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekly = events?.filter(event => new Date(event.created_at) >= weekAgo)
        .reduce((sum, event) => event.amount > 0 ? sum + event.amount : sum, 0) || 0;
      setWeeklyXP(weekly);
    } catch (error) {
      console.error('Error fetching XP data:', error);
    } finally {
      setLoading(false);
    }
  };

  const awardXP = async (
    amount: number,
    eventType: string,
    description: string,
    referenceId?: string
  ) => {
    if (!studentId) return;

    try {
      const { error } = await supabase
        .from('xp_events')
        .insert({
          student_id: studentId,
          amount,
          event_type: eventType,
          description,
          reference_id: referenceId,
        });

      if (error) throw error;

      await fetchXPData();
      toast.success(`+${amount} XP earned! ${description}`);
    } catch (error) {
      console.error('Error awarding XP:', error);
      toast.error('Failed to award XP');
    }
  };

  return {
    totalXP,
    availableXP,
    weeklyXP,
    xpEvents,
    loading,
    awardXP,
    refreshXP: fetchXPData,
  };
}

export function useXPConfig() {
  const [config, setConfig] = useState<XPConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let { data: existingConfig } = await supabase
        .from('xp_config')
        .select('*')
        .eq('parent_id', user.id)
        .single();

      // Create default config if none exists
      if (!existingConfig) {
        const { data: newConfig, error } = await supabase
          .from('xp_config')
          .insert({
            parent_id: user.id,
            assignment_completion_xp: 50,
            question_correct_xp: 10,
            daily_goal_completion_xp: 25,
            attendance_per_minute_xp: 1,
          })
          .select()
          .single();

        if (error) throw error;
        existingConfig = newConfig;
      }

      setConfig(existingConfig);
    } catch (error) {
      console.error('Error fetching XP config:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (updates: Partial<XPConfig>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !config) return;

      const { error } = await supabase
        .from('xp_config')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('parent_id', user.id);

      if (error) throw error;

      await fetchConfig();
      toast.success('XP configuration updated');
    } catch (error) {
      console.error('Error updating XP config:', error);
      toast.error('Failed to update XP configuration');
    }
  };

  return { config, loading, updateConfig, refreshConfig: fetchConfig };
}
