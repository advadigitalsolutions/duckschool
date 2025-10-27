import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { AssignmentContentRenderer } from '../AssignmentContentRenderer';
import { CheckCircle2, ArrowLeft, MessageSquare } from 'lucide-react';
import { DiscussionTipCard } from '../DiscussionTipCard';
import { useDiscussionProgress } from '@/hooks/useDiscussionProgress';
import { cn } from '@/lib/utils';

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
  const { exchangeCount, shouldShowTip, dismissTip } = useDiscussionProgress(studentId, assignmentId);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    setShowTip(shouldShowTip);
  }, [shouldShowTip]);

  const handleDismissTip = async () => {
    setShowTip(false);
    await dismissTip();
  };

  const formatInstructions = () => {
    const promptsList = discussionPrompts?.map((prompt: string, i: number) => 
      `${i + 1}. ${prompt}`
    ).join('\n') || '';

    return `## 💬 Let's Discuss What You Learned\n\nUse the AI coach to discuss your understanding of the concepts.\n\n**Discussion topics:**\n${promptsList}\n\n**Tips:**\n- Explain concepts in your own words\n- Give examples when you can\n- Ask the coach if you're unsure about something\n- The coach will ask follow-up questions to check your understanding`;
  };

  const canAdvance = true;

  // Determine button state based on exchange count
  const getButtonState = () => {
    if (exchangeCount === 0) return 'default';
    if (exchangeCount < 3) return 'engaged';
    return 'ready';
  };

  const buttonState = getButtonState();

  return (
    <div className="space-y-6">
      <Card className="p-6 border-primary/20 bg-primary/5">
        <AssignmentContentRenderer content={formatInstructions()} />
      </Card>

      <Card className="p-6 text-center space-y-4">
        <p className="text-muted-foreground">
          Open the AI Coach (chat button below) to have a discussion about what you've learned.
        </p>
        
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  exchangeCount >= i 
                    ? "bg-primary" 
                    : "bg-muted-foreground/20"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {exchangeCount === 0 && "Start your discussion"}
            {exchangeCount > 0 && exchangeCount < 3 && `${exchangeCount} exchange${exchangeCount === 1 ? '' : 's'}`}
            {exchangeCount >= 3 && "Great engagement!"}
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          The more you discuss, the better we understand your learning! 
          <br />
          (But 3 exchanges is a great start)
        </p>
      </Card>

      {/* First-time user tip */}
      {showTip && (
        <DiscussionTipCard onDismiss={handleDismissTip} />
      )}

      <div className="flex justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          size="lg"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          ← Notes
        </Button>

        <Button
          onClick={onComplete}
          size="lg"
          className={cn(
            "min-w-[200px] transition-all",
            buttonState === 'engaged' && "animate-pulse",
            buttonState === 'ready' && "bg-green-600 hover:bg-green-700"
          )}
        >
          {buttonState === 'ready' && <CheckCircle2 className="h-5 w-5 mr-2" />}
          {buttonState === 'default' && <MessageSquare className="h-5 w-5 mr-2" />}
          {buttonState === 'engaged' && <MessageSquare className="h-5 w-5 mr-2" />}
          Practice →
        </Button>
      </div>
    </div>
  );
};
