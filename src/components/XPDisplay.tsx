import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, TrendingUp, Award } from 'lucide-react';
import { useXP } from '@/hooks/useXP';

interface XPDisplayProps {
  studentId: string;
  variant?: 'compact' | 'full';
}

export function XPDisplay({ studentId, variant = 'compact' }: XPDisplayProps) {
  const { totalXP, weeklyXP, loading } = useXP(studentId);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-20 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border">
        <div className="p-2 bg-primary/20 rounded-full">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total XP</p>
              <p className="text-2xl font-bold text-primary">{totalXP.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                This Week
              </p>
              <p className="text-lg font-semibold">{weeklyXP.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate level (every 100 XP = 1 level)
  const level = Math.floor(totalXP / 100);
  const xpInCurrentLevel = totalXP % 100;
  const progressToNextLevel = xpInCurrentLevel;

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/20 rounded-full">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Level</p>
              <p className="text-3xl font-bold text-primary">{level}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground">Total XP</p>
            <p className="text-2xl font-bold">{totalXP.toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress to Level {level + 1}</span>
            <span className="font-medium">{xpInCurrentLevel}/100</span>
          </div>
          <Progress value={progressToNextLevel} className="h-3" />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {weeklyXP.toLocaleString()} XP this week
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
