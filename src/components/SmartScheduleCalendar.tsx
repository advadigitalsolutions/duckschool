import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, GripVertical, Sparkles, RefreshCw, Lock, Unlock, BookOpen, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SchedulingBlocksManager } from './SchedulingBlocksManager';
import { BlockedTimeDialog } from './BlockedTimeDialog';
import { ReassignAssignmentDialog } from './ReassignAssignmentDialog';
import { CalendarChatAssistant } from './CalendarChatAssistant';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [reassignAssignment, setReassignAssignment] = useState<ScheduledAssignment | null>(null);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<SchedulingBlock | null>(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [newBlockSlot, setNewBlockSlot] = useState<{ date: Date; time: string } | null>(null);
  const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState(true);
  const [scheduleAnalysisOpen, setScheduleAnalysisOpen] = useState(false);
  const [scheduleAnalysis, setScheduleAnalysis] = useState<{
    summary: string;
    changes: Array<{ assignment: string; reason: string; }>;
    recommendations: string[];
  } | null>(null);
  const [moveAnalysisOpen, setMoveAnalysisOpen] = useState(false);
  const [moveAnalysis, setMoveAnalysis] = useState<string>('');

  useEffect(() => {
    fetchScheduledAssignments();
    fetchBlocks();
  }, [studentId]); // Only refetch when student changes, not when week changes

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

      // Format assignments - show ALL scheduled assignments regardless of selected week
      const formatted = (data || [])
        .filter(a => a.auto_scheduled_time && a.day_of_week) // Only show assignments with schedule
        .map((a: any) => ({
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

      console.log('✅ Loaded scheduled assignments:', formatted.length);
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
      
      console.log('🤖 Starting scheduler:', { studentId, startDate, endDate, aiAnalysisEnabled });
      toast.info(aiAnalysisEnabled ? 'Analyzing schedule with AI...' : 'Running scheduler...');

      const { data, error } = await supabase.functions.invoke('smart-schedule-assignments', {
        body: { 
          studentId, 
          startDate, 
          endDate,
          includeAnalysis: aiAnalysisEnabled 
        }
      });

      if (error) throw error;

      console.log('📊 Scheduler result:', data);
      
      const successCount = data.scheduled?.length || 0;
      const errorCount = data.errors?.length || 0;
      
      // Always show AI analysis in a dialog
      if (data.analysis) {
        setScheduleAnalysis(data.analysis);
        setScheduleAnalysisOpen(true);
      }
      
      // Store the summary as persistent notes at bottom of calendar
      if (data.analysis?.summary) {
        setSchedulingNotes([data.analysis.summary]);
      }
      
      if (successCount > 0) {
        toast.success(`Scheduled ${successCount} assignments!`);
        await fetchScheduledAssignments();
      } else if (errorCount > 0) {
        toast.error(`Failed to schedule ${errorCount} assignments`);
        console.error('Scheduling errors:', data.errors);
      } else if (data.analysis) {
        toast.success('Schedule analyzed - see results below');
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
      // Optimistic update - update UI immediately
      setAssignments(prev => 
        prev.map(a => 
          a.id === assignmentId 
            ? { ...a, locked_schedule: !currentLocked } 
            : a
        )
      );

      const { error } = await supabase
        .from('assignments')
        .update({ locked_schedule: !currentLocked })
        .eq('id', assignmentId);

      if (error) {
        // Revert on error
        setAssignments(prev => 
          prev.map(a => 
            a.id === assignmentId 
              ? { ...a, locked_schedule: currentLocked } 
              : a
          )
        );
        throw error;
      }

      toast.success(currentLocked ? 'Assignment unlocked' : 'Assignment locked');
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
    console.log('Drop triggered', { draggedAssignment, newDate, newTime });

    if (!draggedAssignment) {
      console.log('No dragged assignment');
      return;
    }

    const assignment = assignments.find(a => a.id === draggedAssignment);
    console.log('Found assignment', assignment);
    
    if (!assignment || assignment.locked_schedule) {
      toast.error('Cannot reschedule locked assignments');
      setDraggedAssignment(null);
      return;
    }

    const timeOnly = `${newTime}:00`;
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][newDate.getDay()];
    console.log('Rescheduling to:', { dayName, timeOnly });

    try {
      // Optimistic update - update UI immediately
      setAssignments(prev =>
        prev.map(a =>
          a.id === draggedAssignment
            ? { ...a, auto_scheduled_time: timeOnly, day_of_week: dayName }
            : a
        )
      );

      const oldDay = assignment.day_of_week;
      const oldTime = assignment.auto_scheduled_time?.substring(0, 5);

      console.log('Updating database...');
      const { error } = await supabase
        .from('assignments')
        .update({
          auto_scheduled_time: timeOnly,
          day_of_week: dayName
        })
        .eq('id', draggedAssignment);

      console.log('Database update result:', { error });

      if (error) {
        // Revert on error
        setAssignments(prev =>
          prev.map(a =>
            a.id === draggedAssignment
              ? { ...a, auto_scheduled_time: assignment.auto_scheduled_time, day_of_week: assignment.day_of_week }
              : a
          )
        );
        throw error;
      }

      toast.success('Assignment rescheduled');

      // Always run AI analysis after successful move
      if (aiAnalysisEnabled) {
        try {
          const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-schedule-change', {
            body: {
              assignmentId: assignment.id,
              newDay: dayName,
              newTime: newTime,
              studentId,
              oldDay,
              oldTime
            }
          });

          if (!analysisError && analysisData?.analysis) {
            setMoveAnalysis(analysisData.analysis);
            setMoveAnalysisOpen(true);
          }
        } catch (error) {
          console.error('Analysis error:', error);
          // Don't block the reschedule if analysis fails
        }
      }
    } catch (error: any) {
      console.error('Reschedule error:', error);
      toast.error('Failed to reschedule');
    } finally {
      console.log('Cleaning up drag state');
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

  // Check if selected week contains today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = getStartOfWeek(selectedDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  const isCurrentWeek = today >= weekStart && today <= weekEnd;

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
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-muted/30">
              <Switch
                id="ai-analysis"
                checked={aiAnalysisEnabled}
                onCheckedChange={setAiAnalysisEnabled}
                className="data-[state=checked]:bg-primary"
              />
              <Label htmlFor="ai-analysis" className="text-sm font-medium cursor-pointer">
                AI Analysis
              </Label>
            </div>
            <div className="h-6 w-px bg-border" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 7)))}
              className="hover:border-orange-500 hover:text-orange-500 transition-colors"
            >
              Previous Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
              className={cn(
                "transition-colors",
                isCurrentWeek 
                  ? "border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950" 
                  : "hover:border-orange-500 hover:text-orange-500"
              )}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 7)))}
              className="hover:border-orange-500 hover:text-orange-500 transition-colors"
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
              {weekDays.map((day, i) => {
                const isToday = weekDates[i].toDateString() === today.toDateString();
                return (
                  <div 
                    key={day} 
                    className={cn(
                      "bg-muted p-2 text-center transition-all",
                      isToday && "border-2 border-orange-500 relative"
                    )}
                  >
                    <div className="font-medium text-sm">{day}</div>
                    <div className={cn(
                      "text-xs text-muted-foreground",
                      isToday && "text-orange-600 dark:text-orange-400 font-semibold"
                    )}>
                      {weekDates[i].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                );
              })}

              {/* Time Slots */}
              {timeSlots.map(time => (
                <React.Fragment key={time}>
                  <div className="bg-background p-2 text-xs text-muted-foreground">
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
                          blockedSlot && "bg-destructive/5 border-l-2 border-destructive/30",
                          !blockedSlot && !slotAssignments.length && "cursor-pointer group"
                        )}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, weekDates[dayIndex], time)}
                        onDoubleClick={() => {
                          if (!blockedSlot && !slotAssignments.length) {
                            setNewBlockSlot({ date: weekDates[dayIndex], time });
                            setSelectedBlock(null);
                            setBlockDialogOpen(true);
                          }
                        }}
                      >
                        {!blockedSlot && !slotAssignments.length && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="text-[10px] text-muted-foreground">
                              Double-click to block
                            </div>
                          </div>
                        )}
                        
                        {blockedSlot && (
                          <div 
                            className="absolute inset-0 flex items-center justify-center p-2 cursor-pointer hover:bg-destructive/10 transition-colors"
                            onClick={() => {
                              setSelectedBlock(blockedSlot);
                              setBlockDialogOpen(true);
                            }}
                          >
                            <div className="text-[10px] text-destructive/70 font-medium text-center leading-tight">
                              {blockedSlot.reason || 'Blocked Time'}
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
                              "p-2 rounded-lg text-xs mb-1 group relative",
                              "bg-gradient-to-br from-primary/10 to-primary/5",
                              "border border-primary/20",
                              "hover:from-primary/20 hover:to-primary/10",
                              "hover:shadow-lg hover:scale-[1.02] hover:border-primary/40",
                              "transition-all duration-200",
                              "cursor-pointer active:scale-[0.98]",
                              assignment.locked_schedule && "opacity-60"
                            )}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold truncate flex items-center gap-1.5 mb-1">
                                  <BookOpen className="h-3.5 w-3.5 text-primary/70" />
                                  <span>{assignment.title}</span>
                                </div>
                                <div className="text-muted-foreground flex items-center gap-1.5">
                                  <Clock className="h-3 w-3" />
                                  <span>{assignment.est_minutes} min</span>
                                </div>
                                <div className="text-[10px] text-primary/60 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  Click to view details
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLock(assignment.id, assignment.locked_schedule);
                                }}
                                className="hover:bg-background/80 p-1 rounded transition-all hover:scale-110"
                              >
                                {assignment.locked_schedule ? (
                                  <Lock className="h-3.5 w-3.5 text-primary/70" />
                                ) : (
                                  <Unlock className="h-3.5 w-3.5 text-muted-foreground/70" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* AI Schedule Analysis - Key factors explaining current schedule */}
        {schedulingNotes && schedulingNotes.length > 0 && (
          <div className="mt-6 p-5 rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 rounded-full bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                  AI Schedule Analysis
                  <span className="text-xs font-normal text-muted-foreground">(Key Factors & Determinants)</span>
                </h4>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                  {Array.isArray(schedulingNotes) ? schedulingNotes.join(' ') : schedulingNotes}
                </p>
              </div>
            </div>
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

      {/* Lesson Details Dialog - Delightfully Simple */}
      <Dialog open={!!selectedAssignment} onOpenChange={() => setSelectedAssignment(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
          {selectedAssignment && (
            <>
              {/* Header with gradient */}
              <div className="relative -m-6 mb-0 p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
                <DialogTitle className="text-2xl font-bold flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  {selectedAssignment.title}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-4 text-base">
                  <span className="font-medium text-foreground/80">{selectedAssignment.subject}</span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {selectedAssignment.est_minutes} min
                  </span>
                </DialogDescription>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto space-y-6 py-6">
                {/* Quick Schedule Info Card - Clickable to Reassign */}
                <div 
                  className="p-4 rounded-lg bg-muted/30 border border-border/50 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setReassignAssignment(selectedAssignment);
                    setReassignDialogOpen(true);
                  }}
                  title="Click to reassign to a different time"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary/70" />
                      <span className="font-medium text-sm">
                        {selectedAssignment.day_of_week && 
                          selectedAssignment.day_of_week.charAt(0).toUpperCase() + 
                          selectedAssignment.day_of_week.slice(1)
                        }
                        {selectedAssignment.auto_scheduled_time && 
                          ` at ${selectedAssignment.auto_scheduled_time.substring(0, 5)}`
                        }
                      </span>
                    </div>
                    {selectedAssignment.locked_schedule && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        Locked
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-2">
                    Click to change day/time
                  </div>
                </div>

                {/* Lesson Content */}
                {selectedAssignment.body?.overview && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-foreground/80 uppercase tracking-wide">Overview</h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {selectedAssignment.body.overview}
                    </p>
                  </div>
                )}

                {selectedAssignment.body?.learning_objectives && selectedAssignment.body.learning_objectives.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-foreground/80 uppercase tracking-wide">What You'll Learn</h4>
                    <ul className="space-y-2">
                      {selectedAssignment.body.learning_objectives.map((obj: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                          <span className="leading-relaxed">{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>

              {/* Footer Actions - Always visible */}
              <div className="border-t pt-4 -mb-2 flex gap-3">
                <Button
                  onClick={() => {
                    setSelectedAssignment(null);
                    window.open(`/assignment/${selectedAssignment.id}`, '_blank');
                  }}
                  size="lg"
                  className="flex-1 font-semibold"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Review Assignment
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setSelectedAssignment(null)}
                  className="px-6"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Blocked Time Dialog */}
      <BlockedTimeDialog
        open={blockDialogOpen}
        onOpenChange={(open) => {
          setBlockDialogOpen(open);
          if (!open) {
            setSelectedBlock(null);
            setNewBlockSlot(null);
          }
        }}
        block={selectedBlock}
        studentId={studentId}
        onBlockUpdated={() => {
          fetchBlocks();
          fetchScheduledAssignments();
        }}
        slotDate={newBlockSlot?.date}
        slotTime={newBlockSlot?.time}
      />

      {/* Reassign Assignment Dialog */}
      <ReassignAssignmentDialog
        open={reassignDialogOpen}
        onOpenChange={(open) => {
          setReassignDialogOpen(open);
          if (!open) {
            setReassignAssignment(null);
          }
        }}
        assignment={reassignAssignment}
        studentId={studentId}
        onReassigned={() => {
          fetchScheduledAssignments();
        }}
      />

      {/* Schedule Analysis Dialog */}
      <Dialog open={scheduleAnalysisOpen} onOpenChange={setScheduleAnalysisOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Schedule Analysis
            </DialogTitle>
            <DialogDescription>
              AI analysis of your scheduling decisions
            </DialogDescription>
          </DialogHeader>

          {scheduleAnalysis && (
            <div className="space-y-4 py-4">
              {/* Summary */}
              <Alert className="border-primary/20 bg-primary/5">
                <Sparkles className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  {scheduleAnalysis.summary}
                </AlertDescription>
              </Alert>

              {/* Changes Made */}
              {scheduleAnalysis.changes && scheduleAnalysis.changes.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Changes Made
                  </h3>
                  <div className="space-y-2">
                    {scheduleAnalysis.changes.map((change, index) => (
                      <div key={index} className="rounded-lg border bg-muted/30 p-3">
                        <div className="font-medium text-sm mb-1">{change.assignment}</div>
                        <div className="text-xs text-muted-foreground">{change.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {scheduleAnalysis.recommendations && scheduleAnalysis.recommendations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {scheduleAnalysis.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setScheduleAnalysisOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Analysis Dialog */}
      <Dialog open={moveAnalysisOpen} onOpenChange={setMoveAnalysisOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Schedule Change Analysis
            </DialogTitle>
            <DialogDescription>
              AI feedback on your manual scheduling adjustment
            </DialogDescription>
          </DialogHeader>

          <Alert className="border-primary/20 bg-primary/5">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm leading-relaxed">
              {moveAnalysis}
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button onClick={() => setMoveAnalysisOpen(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calendar AI Assistant */}
      <CalendarChatAssistant
        studentId={studentId}
        assignments={assignments}
        blocks={blocks}
        currentWeekStart={getStartOfWeek(selectedDate).toISOString().split('T')[0]}
        currentWeekEnd={getEndOfWeek(selectedDate).toISOString().split('T')[0]}
        dailyWorkloadMinutes={
          assignments.reduce((acc, a) => {
            if (a.day_of_week) {
              acc[a.day_of_week] = (acc[a.day_of_week] || 0) + (a.est_minutes || 0);
            }
            return acc;
          }, {} as Record<string, number>)
        }
        onRefresh={() => {
          fetchScheduledAssignments();
          fetchBlocks();
        }}
      />
    </Card>
  );
};