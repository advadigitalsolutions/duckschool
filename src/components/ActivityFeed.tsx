import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { 
  CheckCircle2, 
  Trophy, 
  Target, 
  Clock, 
  TrendingUp,
  FileText,
  Award
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: 'submission' | 'grade' | 'xp' | 'goal' | 'attendance' | 'progress';
  studentName: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

interface ActivityFeedProps {
  studentIds: string[];
}

export function ActivityFeed({ studentIds }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentIds.length === 0) {
      setLoading(false);
      return;
    }
    fetchActivities();
  }, [studentIds]);

  const fetchActivities = async () => {
    try {
      const allActivities: Activity[] = [];

      // Fetch students info for names
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, name')
        .in('id', studentIds);

      const studentMap = new Map(studentsData?.map(s => [s.id, s.name]) || []);

      // Fetch recent submissions
      const { data: submissions } = await supabase
        .from('submissions')
        .select('id, student_id, assignment_id, submitted_at, assignments(curriculum_items(title))')
        .in('student_id', studentIds)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false })
        .limit(5);

      submissions?.forEach(sub => {
        const assignmentTitle = (sub.assignments as any)?.curriculum_items?.title || 'Assignment';
        allActivities.push({
          id: sub.id,
          type: 'submission',
          studentName: studentMap.get(sub.student_id) || 'Student',
          description: `Submitted ${assignmentTitle}`,
          timestamp: sub.submitted_at!,
        });
      });

      // Fetch recent grades
      const { data: grades } = await supabase
        .from('grades')
        .select('id, student_id, score, max_score, graded_at, assignment_id, assignments(curriculum_items(title))')
        .in('student_id', studentIds)
        .order('graded_at', { ascending: false })
        .limit(5);

      grades?.forEach(grade => {
        const assignmentTitle = (grade.assignments as any)?.curriculum_items?.title || 'Assignment';
        const percentage = grade.max_score ? Math.round((Number(grade.score) / Number(grade.max_score)) * 100) : 0;
        allActivities.push({
          id: grade.id,
          type: 'grade',
          studentName: studentMap.get(grade.student_id) || 'Student',
          description: `Received ${percentage}% on ${assignmentTitle}`,
          timestamp: grade.graded_at!,
          metadata: { score: grade.score, maxScore: grade.max_score }
        });
      });

      // Fetch recent XP events
      const { data: xpEvents } = await supabase
        .from('xp_events')
        .select('id, student_id, amount, description, created_at')
        .in('student_id', studentIds)
        .order('created_at', { ascending: false })
        .limit(5);

      xpEvents?.forEach(xp => {
        allActivities.push({
          id: xp.id,
          type: 'xp',
          studentName: studentMap.get(xp.student_id) || 'Student',
          description: `Earned ${xp.amount} XP${xp.description ? `: ${xp.description}` : ''}`,
          timestamp: xp.created_at!,
        });
      });

      // Fetch recent daily goals
      const { data: goals } = await supabase
        .from('daily_goals')
        .select('id, student_id, goal_text, completed, created_at')
        .in('student_id', studentIds)
        .eq('completed', true)
        .order('created_at', { ascending: false })
        .limit(5);

      goals?.forEach(goal => {
        allActivities.push({
          id: goal.id,
          type: 'goal',
          studentName: studentMap.get(goal.student_id) || 'Student',
          description: `Completed goal: ${goal.goal_text}`,
          timestamp: goal.created_at!,
        });
      });

      // Fetch recent attendance
      const { data: attendance } = await supabase
        .from('attendance_logs')
        .select('id, student_id, minutes, date')
        .in('student_id', studentIds)
        .order('date', { ascending: false })
        .limit(5);

      attendance?.forEach(att => {
        allActivities.push({
          id: att.id,
          type: 'attendance',
          studentName: studentMap.get(att.student_id) || 'Student',
          description: `Logged ${att.minutes} minutes of study time`,
          timestamp: new Date(att.date).toISOString(),
        });
      });

      // Fetch recent progress events
      const { data: progressEvents } = await supabase
        .from('progress_events')
        .select('id, student_id, event, ts')
        .in('student_id', studentIds)
        .order('ts', { ascending: false })
        .limit(5);

      progressEvents?.forEach(evt => {
        allActivities.push({
          id: evt.id,
          type: 'progress',
          studentName: studentMap.get(evt.student_id) || 'Student',
          description: `Progress update: ${evt.event}`,
          timestamp: evt.ts!,
        });
      });

      // Sort all activities by timestamp
      allActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(allActivities.slice(0, 10));
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'submission':
        return <FileText className="h-4 w-4" />;
      case 'grade':
        return <Award className="h-4 w-4" />;
      case 'xp':
        return <Trophy className="h-4 w-4" />;
      case 'goal':
        return <Target className="h-4 w-4" />;
      case 'attendance':
        return <Clock className="h-4 w-4" />;
      case 'progress':
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'submission':
        return 'text-blue-500';
      case 'grade':
        return 'text-purple-500';
      case 'xp':
        return 'text-yellow-500';
      case 'goal':
        return 'text-green-500';
      case 'attendance':
        return 'text-orange-500';
      case 'progress':
        return 'text-pink-500';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">No recent activity to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <Card key={activity.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 ${getActivityColor(activity.type)}`}>
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{activity.studentName}</p>
              <p className="text-sm text-muted-foreground">{activity.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
