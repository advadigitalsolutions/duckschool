import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SchedulingBlock {
  id: string;
  block_type: string;
  specific_date: string | null;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  reason: string | null;
}

interface BlockedTimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block: SchedulingBlock | null;
  studentId: string;
  onBlockUpdated: () => void;
  slotDate?: Date;
  slotTime?: string;
}

export const BlockedTimeDialog = ({ 
  open, 
  onOpenChange, 
  block, 
  studentId, 
  onBlockUpdated,
  slotDate,
  slotTime 
}: BlockedTimeDialogProps) => {
  const [blockType, setBlockType] = useState(block?.block_type || 'one_time');
  const [specificDate, setSpecificDate] = useState<Date | undefined>(
    block?.specific_date ? new Date(block.specific_date) : slotDate
  );
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(
    block?.day_of_week ?? (slotDate ? slotDate.getDay() : null)
  );
  const [startTime, setStartTime] = useState(block?.start_time.substring(0, 5) || slotTime || '09:00');
  const [endTime, setEndTime] = useState(block?.end_time.substring(0, 5) || '10:00');
  const [reason, setReason] = useState(block?.reason || '');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!block;

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const blockData = {
        student_id: studentId,
        block_type: blockType,
        specific_date: blockType === 'one_time' ? specificDate?.toISOString().split('T')[0] : null,
        day_of_week: blockType === 'recurring' ? dayOfWeek : null,
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
        reason,
        active: true,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('scheduling_blocks')
          .update(blockData)
          .eq('id', block.id);

        if (error) throw error;
        toast.success('Blocked time updated');
      } else {
        const { error } = await supabase
          .from('scheduling_blocks')
          .insert(blockData);

        if (error) throw error;
        toast.success('Blocked time created');
      }

      onBlockUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving block:', error);
      toast.error('Failed to save blocked time');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!block) return;

    try {
      setIsDeleting(true);

      const { error } = await supabase
        .from('scheduling_blocks')
        .delete()
        .eq('id', block.id);

      if (error) throw error;

      toast.success('Blocked time deleted');
      onBlockUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error deleting block:', error);
      toast.error('Failed to delete blocked time');
    } finally {
      setIsDeleting(false);
    }
  };

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Blocked Time' : 'Add Blocked Time'}
          </DialogTitle>
          <DialogDescription>
            Block out time when learning shouldn't be scheduled
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="block-type">Type</Label>
            <Select value={blockType} onValueChange={setBlockType}>
              <SelectTrigger id="block-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one_time">One-time (Specific Date)</SelectItem>
                <SelectItem value="recurring">Recurring (Weekly)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {blockType === 'one_time' && (
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !specificDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {specificDate ? format(specificDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={specificDate}
                    onSelect={setSpecificDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {blockType === 'recurring' && (
            <div className="space-y-2">
              <Label htmlFor="day-of-week">Day of Week</Label>
              <Select 
                value={dayOfWeek?.toString() || ''} 
                onValueChange={(val) => setDayOfWeek(parseInt(val))}
              >
                <SelectTrigger id="day-of-week">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {weekDays.map((day, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Input
              id="reason"
              placeholder="e.g., Soccer practice, Lunch break"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div>
            {isEditing && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
