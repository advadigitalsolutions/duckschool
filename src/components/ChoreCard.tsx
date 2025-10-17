import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Clock, Calendar } from 'lucide-react';
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
}: ChoreCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'verified':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'missed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const isOverdue = dueDate && !completedAt && isPast(new Date(dueDate));

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isOverdue ? 'border-destructive' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={getPriorityColor(priority)} className="capitalize">
              {priority}
            </Badge>
            {status && (
              <Badge variant={getStatusColor(status)} className="capitalize">
                {status}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-primary">
              <Star className="h-4 w-4 fill-current" />
              <span className="font-medium">{xpReward} XP</span>
            </div>
            {dueDate && (
              <div className={`flex items-center gap-1.5 ${
                isOverdue ? 'text-destructive' : 'text-muted-foreground'
              }`}>
                <Calendar className="h-4 w-4" />
                <span>Due {format(new Date(dueDate), 'MMM d')}</span>
              </div>
            )}
          </div>
          {completedAt && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Completed {format(new Date(completedAt), 'MMM d')}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
