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
}

export const CurriculumPlanningDialog = ({ 
  open, 
  onOpenChange,
  onComplete 
}: CurriculumPlanningDialogProps) => {
  const navigate = useNavigate();

  const handlePlanningComplete = async (sessionId: string, collectedData: any) => {
    try {
      // Create student profile
      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert({
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

      // Create courses based on subject planning
      if (collectedData.subjectPlanning) {
        for (const subject of Object.keys(collectedData.subjectPlanning)) {
          await supabase.from('courses').insert({
            student_id: student.id,
            title: `${subject} - Grade ${collectedData.gradeLevel}`,
            subject: subject,
            grade_level: collectedData.gradeLevel,
            description: `${collectedData.pedagogicalApproach} approach to ${subject}`,
            standards_scope: collectedData.standardsFramework || []
          });
        }
      }

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
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create Personalized Curriculum Plan</DialogTitle>
          <DialogDescription>
            Let's work together to create the perfect educational plan for your student
          </DialogDescription>
        </DialogHeader>
        <CurriculumPlanningChat onComplete={handlePlanningComplete} />
      </DialogContent>
    </Dialog>
  );
};