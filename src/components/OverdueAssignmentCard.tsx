import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle } from 'lucide-react';
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
    <Card className="border-destructive/50 bg-destructive/5 hover:bg-destructive/10 transition-colors">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
              <Badge variant="destructive" className="font-semibold">
                OVERDUE
              </Badge>
            </div>
            
            {course?.title && (
              <div className="text-xs font-medium text-muted-foreground mb-1">
                {course.title}
              </div>
            )}
            
            <h3 className="font-semibold text-base mb-1 text-destructive">
              {assignment.curriculum_items?.title || 'Untitled Assignment'}
            </h3>
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
              <Clock className="h-3 w-3" />
              {assignment.curriculum_items?.est_minutes || 30} minutes
            </div>
            
            {/* Countdown Timer */}
            <div className="bg-background/80 rounded-lg p-3 mb-2">
              <div className="flex items-center justify-center gap-2 text-destructive font-mono font-bold text-lg">
                {countdown.days > 0 && <span>{countdown.days}d</span>}
                <span>{countdown.hours.toString().padStart(2, '0')}h</span>
                <span>{countdown.minutes.toString().padStart(2, '0')}m</span>
                <span>{countdown.seconds.toString().padStart(2, '0')}s</span>
                <span className="text-sm font-normal">late</span>
              </div>
            </div>
            
            {/* XP Penalty Warning */}
            <p className="text-xs text-destructive/80 text-center mb-3 italic">
              ⚠️ Every 100 minutes late eats 10 xp!
            </p>
          </div>
          
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => navigate(`/assignment/${assignment.id}`)}
            className="flex-shrink-0"
          >
            Start Now
          </Button>
        </div>
      </div>
    </Card>
  );
}
