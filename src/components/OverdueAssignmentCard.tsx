import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OverdueAssignmentCardProps {
  assignment: any;
  onXPPenalty?: (minutesLate: number) => void;
}

export function OverdueAssignmentCard({ assignment }: OverdueAssignmentCardProps) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isValidDate, setIsValidDate] = useState(true);
  
  useEffect(() => {
    const calculateCountdown = () => {
      if (!assignment.due_at) {
        setIsValidDate(false);
        return;
      }
      
      const dueDate = new Date(assignment.due_at);
      const now = new Date();
      
      // Check if date is valid and not unreasonably old (more than 1 year)
      if (isNaN(dueDate.getTime()) || (now.getTime() - dueDate.getTime()) > (365 * 24 * 60 * 60 * 1000)) {
        setIsValidDate(false);
        return;
      }
      
      const diff = now.getTime() - dueDate.getTime();
      
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setCountdown({ days, hours, minutes, seconds });
        setIsValidDate(true);
      }
    };
    
    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [assignment.due_at]);
  
  const course = assignment.curriculum_items?.courses;
  
  if (!isValidDate) {
    return null; // Don't show if date is invalid
  }
  
  return (
    <div className="border-l-4 border-destructive bg-destructive/5 rounded-md p-3 hover:bg-destructive/10 transition-colors">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="destructive" className="text-xs font-semibold">OVERDUE</Badge>
              {course?.title && (
                <span className="text-xs text-muted-foreground truncate">{course.title}</span>
              )}
            </div>
            <h3 className="font-semibold text-sm truncate">
              {assignment.curriculum_items?.title || 'Untitled Assignment'}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs font-mono text-destructive font-medium">
                {countdown.days > 0 && `${countdown.days}d `}
                {countdown.hours}h {countdown.minutes}m {countdown.seconds}s late
              </span>
              <span className="text-xs text-muted-foreground">-10 XP per 100min</span>
            </div>
          </div>
        </div>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => navigate(`/assignment/${assignment.id}`)}
          className="flex-shrink-0"
        >
          Start
        </Button>
      </div>
    </div>
  );
}
