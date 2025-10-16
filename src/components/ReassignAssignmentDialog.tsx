import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Calendar as CalendarIcon, Clock, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ReassignAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: {
    id: string;
    title: string;
    subject: string;
    day_of_week: string | null;
    auto_scheduled_time: string | null;
    locked_schedule: boolean;
  } | null;
  studentId: string;
  onReassigned: () => void;
}

export const ReassignAssignmentDialog = ({ 
  open, 
  onOpenChange, 
  assignment,
  studentId,
  onReassigned 
}: ReassignAssignmentDialogProps) => {
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [newTime, setNewTime] = useState('09:00');
  const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Update state when assignment changes
  useEffect(() => {
    if (assignment) {
      // Parse existing date if available
      if (assignment.day_of_week) {
        const today = new Date();
        const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
          .indexOf(assignment.day_of_week.toLowerCase());
        const daysUntilTarget = (dayIndex - today.getDay() + 7) % 7;
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysUntilTarget);
        setNewDate(targetDate);
      }
      setNewTime(assignment.auto_scheduled_time?.substring(0, 5) || '09:00');
      setAnalysisResult(null);
    }
  }, [assignment]);

  const runAnalysis = async () => {
    if (!assignment || !newDate) return;

    try {
      setIsAnalyzing(true);
      setAnalysisResult(null);

      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][newDate.getDay()];

      const { data, error } = await supabase.functions.invoke('analyze-schedule-change', {
        body: {
          assignmentId: assignment.id,
          newDay: dayOfWeek,
          newTime,
          studentId
        }
      });

      if (error) throw error;

      setAnalysisResult(data.analysis);
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error('AI analysis failed - you can still proceed manually');
      setAnalysisResult('AI analysis unavailable. Please use your judgment.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!assignment || !newDate) {
      toast.error('Please select a date');
      return;
    }

    if (assignment.locked_schedule) {
      toast.error('Cannot reassign locked assignments');
      return;
    }

    // Run AI analysis if enabled and assignment was previously scheduled by AI
    if (aiAnalysisEnabled && assignment.day_of_week && assignment.auto_scheduled_time && !analysisResult) {
      await runAnalysis();
      return; // Don't save yet, let user review analysis
    }

    try {
      setIsSaving(true);

      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][newDate.getDay()];

      const { error } = await supabase
        .from('assignments')
        .update({
          day_of_week: dayOfWeek,
          auto_scheduled_time: `${newTime}:00`
        })
        .eq('id', assignment.id);

      if (error) {
        console.error('Reassign error:', error);
        throw error;
      }

      toast.success('Assignment reassigned successfully');
      onReassigned();
      onOpenChange(false);
      setAnalysisResult(null);
    } catch (error: any) {
      console.error('Error reassigning assignment:', error);
      toast.error(`Error: ${error?.message || 'Failed to reassign assignment'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!assignment) return null;

  const currentDayLabel = assignment.day_of_week 
    ? assignment.day_of_week.charAt(0).toUpperCase() + assignment.day_of_week.slice(1).toLowerCase()
    : 'Not scheduled';
  const currentTime = assignment.auto_scheduled_time?.substring(0, 5) || '09:00';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Reassign Assignment
          </DialogTitle>
          <DialogDescription>
            Move this assignment to a different day and time
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Assignment Info */}
          <div className="rounded-lg bg-muted p-3 space-y-1">
            <div className="font-semibold text-sm">{assignment.title}</div>
            <div className="text-xs text-muted-foreground">{assignment.subject}</div>
            <div className="text-xs text-primary flex items-center gap-1.5 mt-2">
              <Clock className="h-3 w-3" />
              Currently: {currentDayLabel} at {currentTime}
            </div>
          </div>

          {/* AI Analysis Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <div>
                <Label htmlFor="ai-analysis" className="text-sm font-medium">AI Schedule Analysis</Label>
                <p className="text-xs text-muted-foreground">Get AI feedback before moving</p>
              </div>
            </div>
            <Switch
              id="ai-analysis"
              checked={aiAnalysisEnabled}
              onCheckedChange={setAiAnalysisEnabled}
            />
          </div>

          {/* AI Analysis Result */}
          {analysisResult && (
            <Alert className="border-primary/20 bg-primary/5">
              <Sparkles className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                {analysisResult}
              </AlertDescription>
            </Alert>
          )}

          {/* New Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="new-date">New Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="new-date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !newDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newDate ? format(newDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newDate}
                  onSelect={setNewDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* New Time Selection */}
          <div className="space-y-2">
            <Label htmlFor="new-time">New Time</Label>
            <Input
              id="new-time"
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || isAnalyzing || assignment.locked_schedule || !newDate}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : isSaving ? (
              'Saving...'
            ) : analysisResult ? (
              'Confirm Reassignment'
            ) : (
              aiAnalysisEnabled && assignment?.day_of_week && assignment?.auto_scheduled_time ? 'Analyze & Save' : 'Reassign'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
