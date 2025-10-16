import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  onReassigned: () => void;
}

export const ReassignAssignmentDialog = ({ 
  open, 
  onOpenChange, 
  assignment,
  onReassigned 
}: ReassignAssignmentDialogProps) => {
  const [newDay, setNewDay] = useState('monday');
  const [newTime, setNewTime] = useState('09:00');
  const [isSaving, setIsSaving] = useState(false);

  // Update state when assignment changes
  useEffect(() => {
    if (assignment) {
      setNewDay(assignment.day_of_week || 'monday');
      setNewTime(assignment.auto_scheduled_time?.substring(0, 5) || '09:00');
    }
  }, [assignment]);

  const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const weekDayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const handleSave = async () => {
    if (!assignment) return;

    if (assignment.locked_schedule) {
      toast.error('Cannot reassign locked assignments');
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('assignments')
        .update({
          day_of_week: newDay,
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
    } catch (error: any) {
      console.error('Error reassigning assignment:', error);
      toast.error(`Error: ${error?.message || 'Failed to reassign assignment'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!assignment) return null;

  const currentDayLabel = weekDayLabels[weekDays.indexOf(assignment.day_of_week?.toLowerCase() || 'monday')];
  const currentTime = assignment.auto_scheduled_time?.substring(0, 5) || '09:00';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
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

          {/* New Day Selection */}
          <div className="space-y-2">
            <Label htmlFor="new-day">New Day</Label>
            <Select value={newDay} onValueChange={setNewDay}>
              <SelectTrigger id="new-day">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {weekDays.map((day, index) => (
                  <SelectItem key={day} value={day}>
                    {weekDayLabels[index]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Button onClick={handleSave} disabled={isSaving || assignment.locked_schedule}>
            {isSaving ? 'Saving...' : 'Reassign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
