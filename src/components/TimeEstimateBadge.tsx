import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAccessibility } from '@/contexts/AccessibilityContext';

interface TimeEstimateBadgeProps {
  estimatedMinutes: number;
  onStartTimer?: () => void;
  className?: string;
}

export function TimeEstimateBadge({ 
  estimatedMinutes, 
  onStartTimer,
  className 
}: TimeEstimateBadgeProps) {
  const { showTimeEstimates } = useAccessibility();

  // Don't render if time estimates are disabled
  if (!showTimeEstimates) {
    return null;
  }

  const handleClick = () => {
    if (onStartTimer) {
      onStartTimer();
    }
  };

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <Badge 
        variant="secondary" 
        className="cursor-pointer hover:bg-secondary/80 transition-colors text-xs"
        onClick={handleClick}
      >
        ⏱️ {estimatedMinutes} min
      </Badge>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 p-0 hover:bg-accent"
        onClick={handleClick}
        title="Start timer for this task"
      >
        <Clock className="h-3 w-3" />
      </Button>
    </div>
  );
}
