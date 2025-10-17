import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Chore {
  id: string;
  parent_id: string;
  title: string;
  description: string | null;
  xp_reward: number;
  frequency: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ChoreAssignment {
  id: string;
  chore_id: string;
  student_id: string;
  assigned_date: string;
  due_date: string | null;
  completed_at: string | null;
  verified_by: string | null;
  verified_at: string | null;
  status: string;
  notes: string | null;
  photo_proof_url: string | null;
  xp_awarded: number | null;
  created_at: string;
  chores?: Chore;
}

export function useChores(parentId?: string) {
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (parentId) {
      fetchChores();
    }
  }, [parentId]);

  const fetchChores = async () => {
    try {
      const { data, error } = await supabase
        .from('chores')
        .select('*')
        .eq('parent_id', parentId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChores(data || []);
    } catch (error) {
      console.error('Error fetching chores:', error);
      toast.error('Failed to load chores');
    } finally {
      setLoading(false);
    }
  };

  const createChore = async (chore: Omit<Chore, 'id' | 'created_at' | 'updated_at' | 'parent_id'>) => {
    try {
      const { error } = await supabase
        .from('chores')
        .insert({ ...chore, parent_id: parentId });

      if (error) throw error;
      
      await fetchChores();
      toast.success('Chore created successfully');
    } catch (error) {
      console.error('Error creating chore:', error);
      toast.error('Failed to create chore');
    }
  };

  const updateChore = async (id: string, updates: Partial<Chore>) => {
    try {
      const { error } = await supabase
        .from('chores')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      await fetchChores();
      toast.success('Chore updated successfully');
    } catch (error) {
      console.error('Error updating chore:', error);
      toast.error('Failed to update chore');
    }
  };

  const deleteChore = async (id: string) => {
    try {
      const { error } = await supabase
        .from('chores')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchChores();
      toast.success('Chore deleted successfully');
    } catch (error) {
      console.error('Error deleting chore:', error);
      toast.error('Failed to delete chore');
    }
  };

  return {
    chores,
    loading,
    createChore,
    updateChore,
    deleteChore,
    refreshChores: fetchChores,
  };
}

export function useChoreAssignments(studentId?: string) {
  const [assignments, setAssignments] = useState<ChoreAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      fetchAssignments();
    }
  }, [studentId]);

  const fetchAssignments = async () => {
    try {
      console.log('[useChoreAssignments] Fetching assignments for student:', studentId);
      const { data, error } = await supabase
        .from('chore_assignments')
        .select(`
          *,
          chores (*)
        `)
        .eq('student_id', studentId!)
        .order('assigned_date', { ascending: false });

      if (error) {
        console.error('[useChoreAssignments] Error:', error);
        throw error;
      }
      console.log('[useChoreAssignments] Fetched assignments:', data);
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load chores');
    } finally {
      setLoading(false);
    }
  };

  const assignChore = async (choreId: string, studentId: string, dueDate?: string) => {
    try {
      const { error } = await supabase
        .from('chore_assignments')
        .insert({
          chore_id: choreId,
          student_id: studentId,
          assigned_date: new Date().toISOString().split('T')[0],
          due_date: dueDate,
          status: 'pending',
        });

      if (error) throw error;
      
      await fetchAssignments();
      toast.success('Chore assigned successfully');
    } catch (error) {
      console.error('Error assigning chore:', error);
      toast.error('Failed to assign chore');
    }
  };

  const completeChore = async (assignmentId: string, notes?: string, photoUrl?: string) => {
    try {
      const { error } = await supabase
        .from('chore_assignments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          notes,
          photo_proof_url: photoUrl,
        })
        .eq('id', assignmentId);

      if (error) throw error;
      
      await fetchAssignments();
      toast.success('Chore marked as complete!');
    } catch (error) {
      console.error('Error completing chore:', error);
      toast.error('Failed to complete chore');
    }
  };

  const verifyChore = async (assignmentId: string, xpAwarded: number, parentId: string) => {
    try {
      // Update assignment
      const { error: assignmentError } = await supabase
        .from('chore_assignments')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: parentId,
          xp_awarded: xpAwarded,
        })
        .eq('id', assignmentId);

      if (assignmentError) throw assignmentError;

      // Get assignment details to award XP
      const { data: assignment, error: fetchError } = await supabase
        .from('chore_assignments')
        .select('student_id, chores(title)')
        .eq('id', assignmentId)
        .single();

      if (fetchError) throw fetchError;

      // Award XP
      const { error: xpError } = await supabase
        .from('xp_events')
        .insert({
          student_id: assignment.student_id,
          amount: xpAwarded,
          event_type: 'chore_completed',
          description: `Completed chore: ${assignment.chores?.title}`,
          reference_id: assignmentId,
        });

      if (xpError) throw xpError;
      
      await fetchAssignments();
      toast.success(`Chore verified! ${xpAwarded} XP awarded`);
    } catch (error) {
      console.error('Error verifying chore:', error);
      toast.error('Failed to verify chore');
    }
  };

  return {
    assignments,
    loading,
    assignChore,
    completeChore,
    verifyChore,
    refreshAssignments: fetchAssignments,
  };
}
