import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { AILearningCoach } from './AILearningCoach';
import { ResearchPhase } from './wizard/ResearchPhase';
import { NotesPhase } from './wizard/NotesPhase';
import { DiscussionPhase } from './wizard/DiscussionPhase';
import { PracticePhase } from './wizard/PracticePhase';
import { AssignmentQuestions } from './AssignmentQuestions';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2 } from 'lucide-react';

interface LearningWizardProps {
  assignment: any;
  studentId: string;
  onComplete?: () => void;
}

const STEPS = [
  { key: 'research', label: 'Research', icon: '🔍' },
  { key: 'notes', label: 'Notes', icon: '📝' },
  { key: 'discussion', label: 'Discussion', icon: '💬' },
  { key: 'practice', label: 'Practice', icon: '🎯' },
  { key: 'assessment', label: 'Assessment', icon: '✅' }
];

export const LearningWizard: React.FC<LearningWizardProps> = ({
  assignment,
  studentId,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState('research');
  const [progress, setProgress] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [isSidebarMode, setIsSidebarMode] = useState(false);

  const assignmentBody = typeof assignment.curriculum_items?.body === 'string'
    ? JSON.parse(assignment.curriculum_items.body)
    : assignment.curriculum_items?.body;

  useEffect(() => {
    loadProgress();
    loadResources();
  }, [assignment.id, studentId]);

  const loadProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('assignment_learning_progress')
        .select('*')
        .eq('assignment_id', assignment.id)
        .eq('student_id', studentId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setProgress(data);
        setCurrentStep(data.current_step || 'research');
      } else {
        // Initialize progress
        await initializeProgress();
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const initializeProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('assignment_learning_progress')
        .insert([{
          assignment_id: assignment.id,
          student_id: studentId,
          current_step: 'research'
        }])
        .select()
        .single();

      if (error) throw error;
      setProgress(data);
    } catch (error) {
      console.error('Error initializing progress:', error);
    }
  };

  const loadResources = async () => {
    try {
      const { data, error } = await supabase
        .from('assignment_research')
        .select('*')
        .eq('assignment_id', assignment.id)
        .eq('student_id', studentId);

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error loading resources:', error);
    }
  };

  const updateProgress = async (step: string, completed: boolean = false) => {
    try {
      const updates: any = {
        assignment_id: assignment.id,
        student_id: studentId,
        current_step: step,
        updated_at: new Date().toISOString()
      };

      // Mark previous step as completed
      if (completed && currentStep) {
        updates[`${currentStep}_completed`] = true;
        
        const stepList = progress?.steps_completed || [];
        if (!stepList.includes(currentStep)) {
          updates.steps_completed = [...stepList, currentStep];
        }
      }

      const { error } = await supabase
        .from('assignment_learning_progress')
        .upsert([updates], {
          onConflict: 'assignment_id,student_id'
        });

      if (error) throw error;
      
      setCurrentStep(step);
      await loadProgress();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleStepComplete = (nextStep: string) => {
    updateProgress(nextStep, true);
  };

  const handleStepBack = (prevStep: string) => {
    updateProgress(prevStep, false);
  };

  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep);
  const progressPercent = ((currentStepIndex + 1) / STEPS.length) * 100;

  const studentContext = {
    resources,
    notes,
    personalityType: assignment.students?.personality_type,
    learningProfile: assignment.students?.learning_profile
  };

  return (
    <div className={`space-y-6 transition-all duration-300 ${isSidebarMode ? 'mr-96' : ''}`}>
      {/* Progress Bar */}
      <Card className="p-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Your Learning Journey</h2>
            <span className="text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {STEPS.length}
            </span>
          </div>
          
          <Progress value={progressPercent} className="h-2" />
          
          <div className="flex justify-between">
            {STEPS.map((step, idx) => (
              <div
                key={step.key}
                className={`flex flex-col items-center gap-1 ${
                  idx <= currentStepIndex ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <div className="text-2xl">{step.icon}</div>
                <div className="text-xs font-medium">{step.label}</div>
                {progress?.[`${step.key}_completed`] && (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Current Step Content */}
      <div>
        {currentStep === 'research' && (
          <ResearchPhase
            assignmentId={assignment.id}
            studentId={studentId}
            researchGuidance={assignmentBody?.research_guidance}
            onComplete={() => handleStepComplete('notes')}
          />
        )}

        {currentStep === 'notes' && (
          <NotesPhase
            assignmentId={assignment.id}
            studentId={studentId}
            keyConcepts={assignmentBody?.key_concepts || []}
            onComplete={() => handleStepComplete('discussion')}
            onBack={() => handleStepBack('research')}
          />
        )}

        {currentStep === 'discussion' && (
          <DiscussionPhase
            assignmentId={assignment.id}
            studentId={studentId}
            discussionPrompts={assignmentBody?.discussion_prompts || []}
            onComplete={() => handleStepComplete('practice')}
            onBack={() => handleStepBack('notes')}
          />
        )}

        {currentStep === 'practice' && (
          <PracticePhase
            assignmentId={assignment.id}
            studentId={studentId}
            guidedPractice={assignmentBody?.guided_practice || []}
            onComplete={() => handleStepComplete('assessment')}
            onBack={() => handleStepBack('discussion')}
          />
        )}

        {currentStep === 'assessment' && (
          <AssignmentQuestions
            assignment={assignment}
            studentId={studentId}
          />
        )}
      </div>

      {/* AI Coach - Available on all steps */}
      <AILearningCoach
        assignmentId={assignment.id}
        studentId={studentId}
        currentStep={currentStep}
        studentContext={studentContext}
        assignmentBody={assignmentBody}
        onSidebarModeChange={setIsSidebarMode}
      />
    </div>
  );
};
