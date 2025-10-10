import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, BookOpen, Target, ChevronRight } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface WeeklyViewProps {
  studentId: string;
}

export function WeeklyView({ studentId }: WeeklyViewProps) {
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    fetchWeeklyData();
  }, [studentId]);

  const fetchWeeklyData = async () => {
    try {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
      const weekEnd = addDays(weekStart, 4); // Friday

      // Fetch current week's assignments
      const { data: assignmentsData, error } = await supabase
        .from('assignments')
        .select(`
          *,
          curriculum_items (
            *,
            courses (
              id,
              title,
              subject
            )
          )
        `)
        .gte('assigned_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('assigned_date', format(weekEnd, 'yyyy-MM-dd'))
        .eq('curriculum_items.courses.student_id', studentId)
        .order('assigned_date', { ascending: true })
        .order('day_of_week', { ascending: true });

      if (error) throw error;

      // Fetch current week record
      const { data: weekData } = await supabase
        .from('curriculum_weeks')
        .select('*')
        .eq('student_id', studentId)
        .gte('start_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('end_date', format(weekEnd, 'yyyy-MM-dd'))
        .single();

      setWeeklyData(weekData);
      setAssignments(assignmentsData || []);

    } catch (error: any) {
      console.error('Error fetching weekly data:', error);
      toast.error('Failed to load weekly schedule');
    } finally {
      setLoading(false);
    }
  };

  const groupByDay = () => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    return days.map(day => ({
      day,
      assignments: assignments.filter(a => a.day_of_week === day)
    }));
  };

  const calculateProgress = () => {
    if (assignments.length === 0) return 0;
    // This would need to check submissions, simplified for now
    return 0;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  const dayGroups = groupByDay();
  const progress = calculateProgress();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  return (
    <div className="space-y-6">
      {/* Week Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                This Week's Learning
              </CardTitle>
              {weeklyData?.theme && (
                <CardDescription className="mt-2">
                  Theme: {weeklyData.theme}
                </CardDescription>
              )}
            </div>
            <Badge variant="outline" className="text-lg">
              Week {weeklyData?.week_number || '—'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Weekly Progress</span>
                <span className="text-sm font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {weeklyData?.focus_areas && weeklyData.focus_areas.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Focus Areas:</p>
                <div className="flex flex-wrap gap-2">
                  {weeklyData.focus_areas.map((area: string, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      <Target className="h-3 w-3 mr-1" />
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daily Breakdown */}
      <div className="space-y-4">
        {dayGroups.map(({ day, assignments: dayAssignments }) => {
          const isToday = day === today;
          const dayDate = addDays(
            startOfWeek(new Date(), { weekStartsOn: 1 }),
            ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].indexOf(day)
          );

          return (
            <Card key={day} className={isToday ? 'border-primary shadow-md' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="capitalize flex items-center gap-2">
                    {isToday && <ChevronRight className="h-5 w-5 text-primary" />}
                    {day}
                    {isToday && <Badge variant="default">Today</Badge>}
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {format(dayDate, 'MMM d')}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {dayAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No assignments scheduled</p>
                ) : (
                  <div className="space-y-3">
                    {dayAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => {
                          // Navigate to assignment detail
                          window.location.href = `/assignment/${assignment.id}`;
                        }}
                      >
                        <BookOpen className="h-5 w-5 mt-0.5 text-primary" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium line-clamp-1">
                            {assignment.curriculum_items?.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {assignment.curriculum_items?.est_minutes || 30} min
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {assignment.curriculum_items?.courses?.subject}
                            </Badge>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {assignments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No assignments this week</h3>
            <p className="text-sm text-muted-foreground">
              Your weekly curriculum hasn't been generated yet, or you're all caught up!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
