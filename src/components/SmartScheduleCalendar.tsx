import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, GripVertical, Sparkles, RefreshCw, Lock, Unlock, BookOpen, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SchedulingBlocksManager } from './SchedulingBlocksManager';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

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
  body: any;
  curriculum_item_id: string;
}

interface SmartScheduleCalendarProps {
  studentId: string;
}

interface SchedulingBlock {
  id: string;
  block_type: string;
  specific_date: string | null;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  reason: string | null;
}

export const SmartScheduleCalendar = ({ studentId }: SmartScheduleCalendarProps) => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<ScheduledAssignment[]>([]);
  const [blocks, setBlocks] = useState<SchedulingBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [draggedAssignment, setDraggedAssignment] = useState<string | null>(null);
  const [schedulingNotes, setSchedulingNotes] = useState<string[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<ScheduledAssignment | null>(null);

  useEffect(() => {
    fetchScheduledAssignments();
    fetchBlocks();
  }, [studentId, selectedDate]);

  const fetchBlocks = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduling_blocks')
        .select('*')
        .eq('student_id', studentId)
        .eq('active', true);

      if (error) throw error;
      
      console.log('📋 Loaded scheduling blocks:', data?.length || 0);
      setBlocks(data || []);
    } catch (error: any) {
      console.error('Error fetching blocks:', error);
      toast.error('Failed to load scheduling blocks');
    }
  };

  const fetchScheduledAssignments = async () => {
    try {
      setLoading(true);

      console.log('📅 Fetching assignments for student:', studentId);

      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id,
          auto_scheduled_time,
          day_of_week,
          locked_schedule,
          due_at,
          curriculum_items!inner (
            id,
            title,
            body,
            est_minutes,
            course_id,
            courses!inner (
              student_id,
              subject
            )
          )
        `)
        .eq('curriculum_items.courses.student_id', studentId)
        .eq('status', 'assigned');

      console.log('📊 Query result:', { count: data?.length, error });
      
      if (error) throw error;

      // Filter for current week on the client side
      const startOfWeek = getStartOfWeek(selectedDate);
      const endOfWeek = getEndOfWeek(selectedDate);
      const weekDayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const weekDays = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        return weekDayNames[date.getDay()];
      });

      const filtered = (data || []).filter(a => 
        a.auto_scheduled_time && 
        a.day_of_week && 
        weekDays.includes(a.day_of_week)
      );

      const formatted = filtered.map((a: any) => ({
        id: a.id,
        title: a.curriculum_items.title,
        subject: a.curriculum_items.courses.subject,
        est_minutes: a.curriculum_items.est_minutes,
        auto_scheduled_time: a.auto_scheduled_time,
        day_of_week: a.day_of_week,
        locked_schedule: a.locked_schedule,
        due_at: a.due_at,
        course_id: a.curriculum_items.course_id,
        body: a.curriculum_items.body,
        curriculum_item_id: a.curriculum_items.id
      }));

      console.log('✅ Loaded assignments for week:', formatted.length);
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
      const startDate = getStartOfWeek(selectedDate).toISOString().split('T')[0];
      const endDate = getEndOfWeek(selectedDate).toISOString().split('T')[0];
      
      console.log('🤖 Starting scheduler:', { studentId, startDate, endDate });
      toast.info('Running smart scheduler...');

      const { data, error } = await supabase.functions.invoke('smart-schedule-assignments', {
        body: { studentId, startDate, endDate }
      });

      if (error) throw error;

      console.log('📊 Scheduler result:', data);
      
      const successCount = data.scheduled?.length || 0;
      const errorCount = data.errors?.length || 0;
      
      // Store scheduling notes
      if (data.notes && data.notes.length > 0) {
        setSchedulingNotes(data.notes);
      }
      
      if (successCount > 0) {
        toast.success(`Scheduled ${successCount} assignments!`);
        await fetchScheduledAssignments();
      } else if (errorCount > 0) {
        toast.error(`Failed to schedule ${errorCount} assignments`);
        console.error('Scheduling errors:', data.errors);
      } else {
        toast.info('No assignments to schedule');
      }
    } catch (error: any) {
      console.error('Scheduling error:', error);
      toast.error(error.message || 'Failed to run scheduler');
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
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][newDate.getDay()];

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
      return a.day_of_week.toLowerCase() === day.toLowerCase() && assignmentTime === time;
    });
  };

  const isSlotBlocked = (date: Date, time: string): SchedulingBlock | null => {
    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];
    
    return blocks.find(block => {
      // Check if time falls within block's time range
      const blockStart = block.start_time.substring(0, 5);
      const blockEnd = block.end_time.substring(0, 5);
      
      if (time < blockStart || time >= blockEnd) return false;
      
      // Check if it's a recurring block for this day
      if (block.day_of_week !== null && block.day_of_week === dayOfWeek) {
        return true;
      }
      
      // Check if it's a one-time block for this specific date
      if (block.specific_date === dateStr) {
        return true;
      }
      
      return false;
    }) || null;
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
        {/* Scheduling Blocks Manager */}
        <div className="mb-6">
          <SchedulingBlocksManager 
            studentId={studentId}
            onBlocksChange={fetchBlocks}
          />
        </div>

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
                    const blockedSlot = isSlotBlocked(weekDates[dayIndex], time);
                    
                    return (
                      <div
                        key={`${day}-${time}`}
                        className={cn(
                          "bg-background p-1 min-h-[60px] relative",
                          "hover:bg-muted/50 transition-colors",
                          blockedSlot && "bg-destructive/5 border-l-2 border-destructive/30"
                        )}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, weekDates[dayIndex], time)}
                      >
                        {blockedSlot && (
                          <div className="absolute inset-0 flex items-center justify-center p-2">
                            <div className="text-[10px] text-destructive/70 font-medium text-center leading-tight">
                              {blockedSlot.reason || 'Blocked'}
                            </div>
                          </div>
                        )}
                        
                        {slotAssignments.map(assignment => (
                          <div
                            key={assignment.id}
                            draggable={!assignment.locked_schedule}
                            onDragStart={() => handleDragStart(assignment.id)}
                            onClick={() => setSelectedAssignment(assignment)}
                            className={cn(
                              "p-2 rounded text-xs mb-1 group relative",
                              "bg-primary/10 border border-primary/20",
                              "hover:bg-primary/20 hover:shadow-md transition-all",
                              "cursor-pointer",
                              assignment.locked_schedule && "opacity-60"
                            )}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate flex items-center gap-1">
                                  <BookOpen className="h-3 w-3 opacity-60" />
                                  {assignment.title}
                                </div>
                                <div className="text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Clock className="h-3 w-3" />
                                  {assignment.est_minutes}m
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLock(assignment.id, assignment.locked_schedule);
                                }}
                                className="hover:bg-background/50 p-1 rounded transition-colors"
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

        {/* Scheduling Notes */}
        {schedulingNotes.length > 0 && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/50">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {schedulingNotes.join(' ')}
            </p>
          </div>
        )}

        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">How to Use</h4>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span>Click to view lesson details</span>
            </div>
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <span>Drag to reschedule</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Lock to prevent changes</span>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Assignment Details Dialog */}
      <Dialog open={!!selectedAssignment} onOpenChange={() => setSelectedAssignment(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedAssignment && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {selectedAssignment.title}
                </DialogTitle>
                <DialogDescription>
                  {selectedAssignment.subject} • {selectedAssignment.est_minutes} minutes
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Lesson Summary */}
                {selectedAssignment.body?.overview && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Overview</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedAssignment.body.overview}
                    </p>
                  </div>
                )}

                {/* Learning Objectives */}
                {selectedAssignment.body?.learning_objectives && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Learning Objectives</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {selectedAssignment.body.learning_objectives.map((obj: string, i: number) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Schedule Info */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {selectedAssignment.day_of_week && 
                          selectedAssignment.day_of_week.charAt(0).toUpperCase() + 
                          selectedAssignment.day_of_week.slice(1)
                        }
                        {selectedAssignment.auto_scheduled_time && 
                          ` at ${selectedAssignment.auto_scheduled_time.substring(0, 5)}`
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{selectedAssignment.est_minutes} minutes</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      navigate(`/assignment/${selectedAssignment.id}`);
                    }}
                    className="flex-1"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Assignment
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedAssignment(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};