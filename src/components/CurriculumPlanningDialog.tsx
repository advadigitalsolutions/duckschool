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
  const [isCreating, setIsCreating] = useState(false);

  const handlePlanningComplete = async (sessionId: string, collectedData: any) => {
    setIsCreating(true);
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

      // Define core subjects for the grade level
      const gradeLevel = collectedData.gradeLevel || '12th grade';
      const coreSubjects = [
        { name: 'Mathematics', description: 'Advanced mathematics including Pre-Calculus and Calculus' },
        { name: 'English Language Arts', description: 'Literature, composition, and critical analysis' },
        { name: 'Science', description: 'Physics, Chemistry, or Biology with lab components' },
        { name: 'History & Social Science', description: 'World history, government, and economics' },
        { name: 'Computer Science', description: 'Programming, algorithms, and software development' }
      ];

      // Add extracurriculars if mentioned
      const allSubjects = [...coreSubjects];
      if (collectedData.extracurriculars && collectedData.extracurriculars.length > 0) {
        collectedData.extracurriculars.forEach((extra: string) => {
          allSubjects.push({
            name: extra.charAt(0).toUpperCase() + extra.slice(1),
            description: `Extracurricular focus on ${extra}`
          });
        });
      }

      // Create a course for each subject
      const createdCourses = [];
      for (const subject of allSubjects) {
        const { data: course, error: courseError } = await supabase
          .from('courses')
          .insert({
            student_id: student.id,
            title: `${gradeLevel} ${subject.name}`,
            subject: subject.name,
            grade_level: gradeLevel,
            description: subject.description,
            standards_scope: Array.isArray(collectedData.standardsFramework) 
              ? collectedData.standardsFramework 
              : [collectedData.standardsFramework || 'Common Core']
          })
          .select()
          .single();

        if (courseError) {
          console.error('Error creating course:', courseError);
          continue;
        }

        createdCourses.push(course);

        // Create initial assessment for this course
        try {
          const { data: assignmentContent } = await supabase.functions.invoke('generate-assignment', {
            body: {
              courseTitle: course.title,
              courseSubject: subject.name,
              topic: `Initial ${subject.name} Assessment`,
              gradeLevel: gradeLevel,
              standards: collectedData.standardsFramework,
              studentProfile: {
                display_name: collectedData.studentName,
                learning_profile: collectedData.learningProfile || {},
                accommodations: collectedData.accommodations || {},
                goals: collectedData.goals
              },
              isInitialAssessment: true
            }
          });

          if (assignmentContent) {
            // Create curriculum item for the assignment
            const { data: curriculumItem } = await supabase
              .from('curriculum_items')
              .insert({
                course_id: course.id,
                title: `Initial ${subject.name} Assessment`,
                type: 'assignment',
                body: assignmentContent,
                est_minutes: assignmentContent.estimated_minutes || 60
              })
              .select()
              .single();

            // Create the assignment record
            if (curriculumItem) {
              await supabase
                .from('assignments')
                .insert({
                  curriculum_item_id: curriculumItem.id,
                  status: 'assigned' as const,
                  max_attempts: 3,
                  rubric: assignmentContent.rubric || []
                });
            }
          }
        } catch (assessmentError) {
          console.error(`Error creating assessment for ${subject.name}:`, assessmentError);
        }
      }

      toast.success(`Created ${createdCourses.length} courses with initial assessments!`);
      console.log('Created courses:', createdCourses);
      console.log('Collected data:', collectedData);

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
      
      // Navigate to student detail after a brief delay to show the success message
      setTimeout(() => {
        navigate(`/parent/student/${student.id}`);
      }, 1500);
    } catch (error) {
      console.error('Error creating curriculum plan:', error);
      toast.error('Failed to create curriculum plan');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 flex flex-col">
        {isCreating ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            <p className="text-lg font-medium">Creating your personalized curriculum...</p>
            <p className="text-sm text-muted-foreground">Generating courses and assessments</p>
          </div>
        ) : (
          <CurriculumPlanningChat 
            onComplete={handlePlanningComplete}
            existingSessionId={existingSessionId}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};