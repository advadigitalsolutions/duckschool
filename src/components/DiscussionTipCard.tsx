import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Lightbulb, CheckCircle2, Clock, MessageSquare } from 'lucide-react';

interface DiscussionTipCardProps {
  onDismiss: () => void;
}

export const DiscussionTipCard: React.FC<DiscussionTipCardProps> = ({ onDismiss }) => {
  return (
    <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-500 rounded-lg text-white shrink-0">
          <Lightbulb className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-2">
          <h4 className="font-semibold text-sm">New to Discussion Phase?</h4>
          <p className="text-sm text-muted-foreground">
            You're in control! Here's how it works:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <span>Chat as long as you need - no timer</span>
            </li>
            <li className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <span>Your conversation helps us understand your thinking</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <span>Move forward whenever you feel ready</span>
            </li>
          </ul>
          <p className="text-xs text-muted-foreground italic">
            The AI coach will help wrap up naturally after a few exchanges
          </p>
        </div>
      </div>
      <Button
        onClick={onDismiss}
        size="sm"
        className="w-full"
      >
        Got it!
      </Button>
    </Card>
  );
};
