import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { AssignmentContentRenderer } from '../AssignmentContentRenderer';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

interface DiscussionPhaseProps {
  assignmentId: string;
  studentId: string;
  discussionPrompts: string[];
  onComplete: () => void;
  onBack: () => void;
}

export const DiscussionPhase: React.FC<DiscussionPhaseProps> = ({
  assignmentId,
  studentId,
  discussionPrompts,
  onComplete,
  onBack
}) => {
  const [conceptsDiscussed, setConceptsDiscussed] = useState<number>(0);

  const formatInstructions = () => {
    const promptsList = discussionPrompts?.map((prompt: string, i: number) => 
      `${i + 1}. ${prompt}`
    ).join('\n') || '';

    return `## 💬 Let's Discuss What You Learned\n\nUse the AI coach to discuss your understanding of the concepts.\n\n**Discussion topics:**\n${promptsList}\n\n**Tips:**\n- Explain concepts in your own words\n- Give examples when you can\n- Ask the coach if you're unsure about something\n- The coach will ask follow-up questions to check your understanding`;
  };

  // For MVP, we'll trust the student used the coach
  // In production, we'd track actual discussion depth via AI coaching history
  const canAdvance = true;

  return (
    <div className="space-y-6">
      <Card className="p-6 border-primary/20 bg-primary/5">
        <AssignmentContentRenderer content={formatInstructions()} />
      </Card>

      <Card className="p-6 text-center">
        <p className="text-muted-foreground mb-4">
          Open the AI Coach (chat button below this area) to have a discussion about what you've learned.
        </p>
        <p className="text-sm text-muted-foreground">
          The coach will ask you questions to verify your understanding of the key concepts.
        </p>
      </Card>

      <div className="flex justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          size="lg"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Notes
        </Button>

        <Button
          onClick={onComplete}
          disabled={!canAdvance}
          size="lg"
          className="min-w-[200px]"
        >
          <CheckCircle2 className="h-5 w-5 mr-2" />
          Continue to Practice
        </Button>
      </div>
    </div>
  );
};
