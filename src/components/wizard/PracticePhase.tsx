import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { AssignmentContentRenderer } from '../AssignmentContentRenderer';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

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

  const task = guidedPractice?.[0] || {};

  const formatInstructions = () => {
    const scaffolding = task.scaffolding?.map((hint: string, i: number) => 
      `${i + 1}. ${hint}`
    ).join('\n') || '';

    return `## 🎯 Practice What You've Learned\n\n**Task:**\n${task.task || 'Complete the practice activity'}\n\n**Steps to help you:**\n${scaffolding}\n\n**Success criteria:**\n${task.success_criteria || 'Complete the task to the best of your ability'}\n\n**Remember:** Use the AI coach if you get stuck!`;
  };

  const canAdvance = practiceWork.trim().length > 50; // Require some work

  return (
    <div className="space-y-6">
      <Card className="p-6 border-primary/20 bg-primary/5">
        <AssignmentContentRenderer content={formatInstructions()} />
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-3">Your Work</h3>
        <Textarea
          value={practiceWork}
          onChange={(e) => setPracticeWork(e.target.value)}
          placeholder="Show your work here..."
          rows={10}
          className="font-mono"
        />
        <p className="text-sm text-muted-foreground mt-2">
          {practiceWork.length} characters
        </p>
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
  );
};
