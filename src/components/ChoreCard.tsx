import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Clock, Calendar, CheckCircle2, Sparkles } from 'lucide-react';
import { format, isPast } from 'date-fns';

interface ChoreCardProps {
  title: string;
  description?: string | null;
  xpReward: number;
  priority: string;
  dueDate?: string | null;
  status?: string;
  completedAt?: string | null;
  onClick?: () => void;
  onComplete?: () => void;
}

export function ChoreCard({
  title,
  description,
  xpReward,
  priority,
  dueDate,
  status,
  completedAt,
  onClick,
  onComplete,
}: ChoreCardProps) {
  const getPriorityBadge = (priority: string) => {
    const configs = {
      high: { label: 'High', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
      medium: { label: 'Medium', className: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
      low: { label: 'Low', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
    };
    return configs[priority as keyof typeof configs] || configs.medium;
  };

  const isOverdue = dueDate && !completedAt && isPast(new Date(dueDate));
  const isCompleted = status === 'completed' || status === 'verified';
  const isPending = status === 'pending';

  const priorityBadge = getPriorityBadge(priority);

  return (
    <Card 
      className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl border-2 ${
        isCompleted 
          ? 'bg-green-500/5 border-green-500/20' 
          : isOverdue 
          ? 'border-red-500/30 bg-red-500/5' 
          : 'border-border/50 hover:border-primary/30 hover:bg-primary/5'
      }`}
      onClick={onClick}
    >
      {/* Gradient overlay for pending items */}
      {isPending && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}

      {/* Completion shine effect */}
      {isCompleted && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/10 to-transparent -translate-x-full animate-pulse" />
      )}

      <div className="relative p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className={`text-lg font-bold mb-1 ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
              {title}
            </h3>
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
            )}
          </div>
          
          <Badge className={priorityBadge.className}>
            {priorityBadge.label}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* XP Display */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold ${
              isCompleted 
                ? 'bg-green-500/10 text-green-500' 
                : 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 text-yellow-600'
            }`}>
              <Star className={`h-4 w-4 ${isCompleted ? '' : 'fill-current'}`} />
              <span className="text-sm">{xpReward} XP</span>
            </div>

            {dueDate && !completedAt && (
              <div className={`flex items-center gap-1.5 text-xs ${
                isOverdue ? 'text-red-500 font-semibold' : 'text-muted-foreground'
              }`}>
                <Calendar className="h-3.5 w-3.5" />
                <span>{isOverdue ? 'Overdue' : 'Due'} {format(new Date(dueDate), 'MMM d')}</span>
              </div>
            )}

            {completedAt && (
              <div className="flex items-center gap-1.5 text-xs text-green-500">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Done {format(new Date(completedAt), 'MMM d')}</span>
              </div>
            )}
          </div>

          {/* Complete Button */}
          {isPending && onComplete && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
              size="sm"
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 transition-all duration-300"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Complete
            </Button>
          )}

          {isCompleted && (
            <div className="flex items-center gap-1.5 text-sm font-medium text-green-500">
              <Sparkles className="h-4 w-4" />
              <span>Completed!</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
