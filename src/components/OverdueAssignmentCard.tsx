import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
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
  
  useEffect(() => {
    const calculateCountdown = () => {
      const dueDate = new Date(assignment.due_at);
      const now = new Date();
      const diff = now.getTime() - dueDate.getTime();
      
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setCountdown({ days, hours, minutes, seconds });
      }
    };
    
    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [assignment.due_at]);
  
  const course = assignment.curriculum_items?.courses;
  
  return (
    <Card className="border-destructive bg-destructive/10 hover:shadow-lg hover:border-destructive/80 transition-all">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-3">
            {/* Header with badge */}
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
              <Badge variant="destructive" className="font-bold text-xs px-2 py-0.5">
                OVERDUE
              </Badge>
              {course?.title && (
                <span className="text-xs text-muted-foreground">
                  {course.title}
                </span>
              )}
            </div>
            
            {/* Assignment title */}
            <h3 className="font-bold text-lg leading-tight">
              {assignment.curriculum_items?.title || 'Untitled Assignment'}
            </h3>
            
            {/* Countdown Timer */}
            <div className="bg-background rounded-lg p-4 border-2 border-destructive/20">
              <div className="flex items-center justify-center gap-2 text-destructive font-mono font-bold text-xl">
                {countdown.days > 0 && <span>{countdown.days}d</span>}
                <span>{countdown.hours.toString().padStart(2, '0')}h</span>
                <span>{countdown.minutes.toString().padStart(2, '0')}m</span>
                <span>{countdown.seconds.toString().padStart(2, '0')}s</span>
                <span className="text-sm font-normal ml-1">late</span>
              </div>
            </div>
            
            {/* XP Penalty Warning */}
            <p className="text-xs text-center text-destructive font-medium">
              ⚠️ Every 100 minutes late eats 10 xp!
            </p>
          </div>
          
          <Button 
            variant="destructive" 
            size="lg"
            onClick={() => navigate(`/assignment/${assignment.id}`)}
            className="flex-shrink-0 font-bold shadow-lg hover:shadow-xl"
          >
            Start Now
          </Button>
        </div>
      </div>
    </Card>
  );
}
