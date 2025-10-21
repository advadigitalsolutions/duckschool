import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { AssignmentContentRenderer } from '../AssignmentContentRenderer';
import { CheckCircle2, ArrowLeft, SkipForward } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { debounce } from 'lodash';

interface PracticePhaseProps {
  assignmentId: string;
  studentId: string;
  guidedPractice: any[];
  onComplete: () => void;
  onBack: () => void;
}

export const PracticePhase: React.FC<PracticePhaseProps> = ({
  assignmentId,
  studentId,
  guidedPractice,
  onComplete,
  onBack
}) => {
  const [practiceWork, setPracticeWork] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const task = guidedPractice?.[0] || {};

  // Load saved practice work on mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const { data, error } = await supabase
          .from('assignment_learning_progress')
          .select('practice_work')
          .eq('assignment_id', assignmentId)
          .eq('student_id', studentId)
          .maybeSingle();

        if (error) throw error;
        
        if (data?.practice_work) {
          setPracticeWork(data.practice_work);
        }
      } catch (error) {
        console.error('Error loading practice work:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [assignmentId, studentId]);

  // Debounced save function
  const savePracticeWork = useCallback(
    debounce(async (work: string) => {
      if (!work.trim()) return;
      
      setIsSaving(true);
      try {
        const { error } = await supabase
          .from('assignment_learning_progress')
          .update({ practice_work: work })
          .eq('assignment_id', assignmentId)
          .eq('student_id', studentId);

        if (error) throw error;
      } catch (error) {
        console.error('Error saving practice work:', error);
        toast({
          title: "Save failed",
          description: "Your work couldn't be saved. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsSaving(false);
      }
    }, 2000),
    [assignmentId, studentId, toast]
  );

  // Save whenever practice work changes
  useEffect(() => {
    if (practiceWork && !isLoading) {
      savePracticeWork(practiceWork);
    }
  }, [practiceWork, savePracticeWork, isLoading]);

  const handleSkipPractice = async () => {
    try {
      const { error } = await supabase
        .from('assignment_learning_progress')
        .update({ 
          skipped_practice: true,
          practice_work: practiceWork,
          practice_completed: true
        })
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId);

      if (error) throw error;

      toast({
        title: "Practice skipped",
        description: "Moving to assessment phase",
      });

      onComplete();
    } catch (error) {
      console.error('Error skipping practice:', error);
      toast({
        title: "Error",
        description: "Failed to skip practice. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatInstructions = () => {
    const scaffolding = task.scaffolding?.map((hint: string, i: number) => 
      `${i + 1}. ${hint}`
    ).join('\n') || '';

    return `## 🎯 Practice What You've Learned\n\n**Task:**\n${task.task || 'Complete the practice activity'}\n\n**Steps to help you:**\n${scaffolding}\n\n**Success criteria:**\n${task.success_criteria || 'Complete the task to the best of your ability'}\n\n**Remember:** Use the AI coach if you get stuck!`;
  };

  const canAdvance = practiceWork.trim().length > 50;
  const canSkip = practiceWork.trim().length > 20;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <p className="text-muted-foreground">Loading your practice work...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 border-primary/20 bg-primary/5">
        <AssignmentContentRenderer content={formatInstructions()} />
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Your Work</h3>
          {isSaving && (
            <span className="text-sm text-muted-foreground">Saving...</span>
          )}
          {!isSaving && practiceWork.length > 0 && (
            <span className="text-sm text-green-600">Saved</span>
          )}
        </div>
        <Textarea
          value={practiceWork}
          onChange={(e) => setPracticeWork(e.target.value)}
          placeholder="Show your work here..."
          rows={10}
          className="font-mono"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-muted-foreground">
            {practiceWork.length} / 50 characters {canAdvance ? '✓' : ''}
          </p>
          {!canAdvance && canSkip && (
            <p className="text-sm text-muted-foreground">
              Need {50 - practiceWork.length} more to continue, or skip after some work
            </p>
          )}
        </div>
      </Card>

      <div className="flex justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          size="lg"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Discussion
        </Button>

        <div className="flex gap-2">
          {canSkip && !canAdvance && (
            <Button
              onClick={handleSkipPractice}
              variant="outline"
              size="lg"
            >
              <SkipForward className="h-5 w-5 mr-2" />
              Skip Practice
            </Button>
          )}
          
          <Button
            onClick={onComplete}
            disabled={!canAdvance}
            size="lg"
            className="min-w-[200px]"
          >
            {canAdvance ? (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Continue to Assessment
              </>
            ) : (
              'Complete practice to continue'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
