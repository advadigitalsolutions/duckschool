import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, RefreshCw, Clock } from 'lucide-react';

interface MasteryData {
  mastered: number;
  activelyMastering: number;
  pending: number;
}

interface CourseMasteryChartProps {
  masteryData: MasteryData;
}

export function CourseMasteryChart({ masteryData }: CourseMasteryChartProps) {
  const items = [
    {
      label: 'Knowledge Mastered',
      value: masteryData.mastered,
      color: 'bg-green-500',
      icon: CheckCircle2,
      description: 'Demonstrated mastery through repeated correct answers'
    },
    {
      label: 'Actively Mastering',
      value: masteryData.activelyMastering,
      color: 'bg-yellow-500',
      icon: RefreshCw,
      description: 'Currently learning, some incorrect answers'
    },
    {
      label: 'Pending Mastery',
      value: masteryData.pending,
      color: 'bg-gray-400',
      icon: Clock,
      description: 'Not yet taught or attempted'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Knowledge Mastery</CardTitle>
        <CardDescription>Track your understanding and progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual progress bar showing all three states */}
        <div className="relative h-8 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-green-500 transition-all"
            style={{ width: `${masteryData.mastered}%` }}
          />
          <div
            className="absolute top-0 h-full bg-yellow-500 transition-all"
            style={{ 
              left: `${masteryData.mastered}%`,
              width: `${masteryData.activelyMastering}%` 
            }}
          />
          <div
            className="absolute top-0 h-full bg-gray-400 transition-all"
            style={{ 
              left: `${masteryData.mastered + masteryData.activelyMastering}%`,
              width: `${masteryData.pending}%` 
            }}
          />
        </div>

        {/* Breakdown */}
        <div className="space-y-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 text-${item.color.replace('bg-', '')}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold">{item.value.toFixed(1)}%</span>
                </div>
                <Progress value={item.value} className="h-2" />
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
