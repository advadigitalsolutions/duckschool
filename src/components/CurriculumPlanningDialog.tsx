import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CurriculumPlanningChat } from './CurriculumPlanningChat';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface CurriculumPlanningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  existingSessionId?: string;
}

export const CurriculumPlanningDialog = ({ 
  open, 
  onOpenChange,
  onComplete,
  existingSessionId
}: CurriculumPlanningDialogProps) => {
  const navigate = useNavigate();

  const handlePlanningComplete = async (sessionId: string, collectedData: any) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create student profile
      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert({
          parent_id: user.id,
          name: collectedData.studentName,
          grade_level: collectedData.gradeLevel,
          learning_profile: {
            pedagogicalApproach: collectedData.pedagogicalApproach,
            learningStyle: collectedData.learningProfile?.style,
            interests: collectedData.learningProfile?.interests,
            challenges: collectedData.learningProfile?.challenges
          },
          accommodations: collectedData.learningProfile?.specialNeeds || {}
        })
        .select()
        .single();

      if (studentError) throw studentError;

      // Create initial course based on collected data
      const subjects = collectedData.subjects || 'core subjects';
      const goals = collectedData.goals || 'grade-level mastery';
      
      await supabase.from('courses').insert({
        student_id: student.id,
        title: `${collectedData.gradeLevel} Curriculum`,
        subject: subjects,
        grade_level: collectedData.gradeLevel,
        description: `Personalized curriculum focused on ${subjects} to achieve ${goals}`,
        standards_scope: Array.isArray(collectedData.standardsFramework) 
          ? collectedData.standardsFramework 
          : [collectedData.standardsFramework || 'Common Core']
      });

      // Mark session as completed
      await supabase
        .from('curriculum_planning_sessions')
        .update({
          status: 'completed',
          student_id: student.id
        })
        .eq('id', sessionId);

      toast.success('Curriculum plan created successfully!');
      onOpenChange(false);
      
      if (onComplete) {
        onComplete();
      }
      
      // Navigate to student detail
      navigate(`/parent/student/${student.id}`);
    } catch (error) {
      console.error('Error creating curriculum plan:', error);
      toast.error('Failed to create curriculum plan');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 flex flex-col">
        <CurriculumPlanningChat 
          onComplete={handlePlanningComplete}
          existingSessionId={existingSessionId}
        />
      </DialogContent>
    </Dialog>
  );
};