import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, GripVertical, Sparkles, RefreshCw, Lock, Unlock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ScheduledAssignment {
  id: string;
  title: string;
  subject: string;
  est_minutes: number;
  auto_scheduled_time: string | null;
  day_of_week: string | null;
  locked_schedule: boolean;
  due_at: string | null;
  course_id: string;
}

interface SmartScheduleCalendarProps {
  studentId: string;
}

export const SmartScheduleCalendar = ({ studentId }: SmartScheduleCalendarProps) => {
  const [assignments, setAssignments] = useState<ScheduledAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [draggedAssignment, setDraggedAssignment] = useState<string | null>(null);

  useEffect(() => {
    fetchScheduledAssignments();
  }, [studentId, selectedDate]);

  const fetchScheduledAssignments = async () => {
    try {
      setLoading(true);

      // Get start and end of week dates for filtering
      const startOfWeek = getStartOfWeek(selectedDate);
      const endOfWeek = getEndOfWeek(selectedDate);
      const weekDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const weekDays = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        return weekDayNames[date.getDay()];
      });

      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id,
          auto_scheduled_time,
          day_of_week,
          locked_schedule,
          due_at,
          curriculum_items!inner (
            title,
            est_minutes,
            course_id,
            courses!inner (
              student_id,
              subject
            )
          )
        `)
        .eq('curriculum_items.courses.student_id', studentId)
        .eq('status', 'assigned')
        .not('auto_scheduled_time', 'is', null)
        .in('day_of_week', weekDays);

      if (error) throw error;

      const formatted = data.map((a: any) => ({
        id: a.id,
        title: a.curriculum_items.title,
        subject: a.curriculum_items.courses.subject,
        est_minutes: a.curriculum_items.est_minutes,
        auto_scheduled_time: a.auto_scheduled_time,
        day_of_week: a.day_of_week,
        locked_schedule: a.locked_schedule,
        due_at: a.due_at,
        course_id: a.curriculum_items.course_id
      }));

      setAssignments(formatted);
    } catch (error: any) {
      console.error('Error fetching scheduled assignments:', error);
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const runSmartScheduler = async () => {
    try {
      setScheduling(true);
      toast.info('Running smart scheduler...');

      const startDate = getStartOfWeek(selectedDate).toISOString().split('T')[0];
      const endDate = getEndOfWeek(selectedDate).toISOString().split('T')[0];

      const { data, error } = await supabase.functions.invoke('smart-schedule-assignments', {
        body: { studentId, startDate, endDate }
      });

      if (error) throw error;

      toast.success(`Scheduled ${data.scheduled.length} assignments!`);
      fetchScheduledAssignments();
    } catch (error: any) {
      console.error('Scheduling error:', error);
      toast.error('Failed to run scheduler');
    } finally {
      setScheduling(false);
    }
  };

  const toggleLock = async (assignmentId: string, currentLocked: boolean) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ locked_schedule: !currentLocked })
        .eq('id', assignmentId);

      if (error) throw error;

      toast.success(currentLocked ? 'Assignment unlocked' : 'Assignment locked');
      fetchScheduledAssignments();
    } catch (error: any) {
      toast.error('Failed to toggle lock');
    }
  };

  const handleDragStart = (assignmentId: string) => {
    setDraggedAssignment(assignmentId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newDate: Date, newTime: string) => {
    e.preventDefault();

    if (!draggedAssignment) return;

    const assignment = assignments.find(a => a.id === draggedAssignment);
    if (!assignment || assignment.locked_schedule) {
      toast.error('Cannot reschedule locked assignments');
      return;
    }

    try {
      const timeOnly = `${newTime}:00`;
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][newDate.getDay()];

      const { error } = await supabase
        .from('assignments')
        .update({
          auto_scheduled_time: timeOnly,
          day_of_week: dayName
        })
        .eq('id', draggedAssignment);

      if (error) throw error;

      toast.success('Assignment rescheduled');
      fetchScheduledAssignments();
    } catch (error: any) {
      toast.error('Failed to reschedule');
    } finally {
      setDraggedAssignment(null);
    }
  };

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getEndOfWeek = (date: Date) => {
    const start = getStartOfWeek(date);
    return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  };

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = Array.from({ length: 25 }, (_, i) => {
    const hour = i + 6; // Start at 6 AM
    return hour > 23 ? null : `${hour.toString().padStart(2, '0')}:00`;
  }).filter(Boolean) as string[];

  const getAssignmentsForSlot = (day: string, time: string) => {
    return assignments.filter(a => {
      if (!a.auto_scheduled_time || !a.day_of_week) return false;
      const assignmentTime = a.auto_scheduled_time.substring(0, 5);
      return a.day_of_week === day && assignmentTime === time;
    });
  };

  const getWeekDates = () => {
    const start = getStartOfWeek(selectedDate);
    return weekDays.map((_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  };

  const weekDates = getWeekDates();

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Smart Schedule Calendar
            </CardTitle>
            <CardDescription>
              AI-optimized schedule based on your focus patterns
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 7)))}
            >
              Previous Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 7)))}
            >
              Next Week
            </Button>
            <Button
              onClick={runSmartScheduler}
              disabled={scheduling}
              size="sm"
            >
              {scheduling ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Auto-Schedule
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Calendar Grid */}
            <div className="grid grid-cols-8 gap-px bg-border">
              {/* Header Row */}
              <div className="bg-muted p-2 font-medium text-sm">Time</div>
              {weekDays.map((day, i) => (
                <div key={day} className="bg-muted p-2 text-center">
                  <div className="font-medium text-sm">{day}</div>
                  <div className="text-xs text-muted-foreground">
                    {weekDates[i].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}

              {/* Time Slots */}
              {timeSlots.map(time => (
                <>
                  <div key={`time-${time}`} className="bg-background p-2 text-xs text-muted-foreground">
                    {time}
                  </div>
                  {weekDays.map((day, dayIndex) => {
                    const slotAssignments = getAssignmentsForSlot(day, time);
                    return (
                      <div
                        key={`${day}-${time}`}
                        className={cn(
                          "bg-background p-1 min-h-[60px] relative",
                          "hover:bg-muted/50 transition-colors"
                        )}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, weekDates[dayIndex], time)}
                      >
                        {slotAssignments.map(assignment => (
                          <div
                            key={assignment.id}
                            draggable={!assignment.locked_schedule}
                            onDragStart={() => handleDragStart(assignment.id)}
                            className={cn(
                              "p-2 rounded text-xs mb-1 cursor-move",
                              "bg-primary/10 border border-primary/20",
                              "hover:bg-primary/20 transition-colors",
                              assignment.locked_schedule && "opacity-60 cursor-not-allowed"
                            )}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{assignment.title}</div>
                                <div className="text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Clock className="h-3 w-3" />
                                  {assignment.est_minutes}m
                                </div>
                              </div>
                              <button
                                onClick={() => toggleLock(assignment.id, assignment.locked_schedule)}
                                className="hover:bg-background/50 p-1 rounded"
                              >
                                {assignment.locked_schedule ? (
                                  <Lock className="h-3 w-3" />
                                ) : (
                                  <Unlock className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Legend</h4>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <span>Drag to reschedule</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Locked (cannot move)</span>
            </div>
            <div className="flex items-center gap-2">
              <Unlock className="h-4 w-4" />
              <span>Unlocked (can move)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};