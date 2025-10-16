import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CalendarClock, Plus, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface SchedulingBlock {
  id: string;
  block_type: string;
  specific_date: string | null;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  reason: string | null;
  active: boolean;
}

interface SchedulingBlocksManagerProps {
  studentId: string;
}

// Only need to mark times as "blocked" - everything else is free by default
const BLOCK_TYPE = 'unavailable';

const DAY_NAMES = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export const SchedulingBlocksManager = ({ studentId }: SchedulingBlocksManagerProps) => {
  const [blocks, setBlocks] = useState<SchedulingBlock[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedDay, setSelectedDay] = useState<number>();
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchBlocks();
  }, [studentId]);

  const fetchBlocks = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduling_blocks')
        .select('*')
        .eq('student_id', studentId)
        .eq('active', true)
        .order('specific_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setBlocks(data || []);
    } catch (error: any) {
      console.error('Error fetching blocks:', error);
      toast.error('Failed to load scheduling blocks');
    }
  };

  const handleAddBlock = async () => {
    if (!isRecurring && !selectedDate) {
      toast.error('Please select a date');
      return;
    }
    if (isRecurring && selectedDay === undefined) {
      toast.error('Please select a day of week');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('scheduling_blocks')
        .insert({
          student_id: studentId,
          block_type: BLOCK_TYPE,
          specific_date: isRecurring ? null : format(selectedDate!, 'yyyy-MM-dd'),
          day_of_week: isRecurring ? selectedDay : null,
          start_time: startTime,
          end_time: endTime,
          reason: reason || null,
          active: true,
        });

      if (error) throw error;

      toast.success(isRecurring ? 'Recurring block added' : 'Block added to schedule');
      setIsDialogOpen(false);
      resetForm();
      fetchBlocks();
    } catch (error: any) {
      console.error('Error adding block:', error);
      toast.error('Failed to add block');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    try {
      const { error } = await supabase
        .from('scheduling_blocks')
        .update({ active: false })
        .eq('id', blockId);

      if (error) throw error;

      toast.success('Block removed');
      fetchBlocks();
    } catch (error: any) {
      console.error('Error deleting block:', error);
      toast.error('Failed to remove block');
    }
  };

  const resetForm = () => {
    setIsRecurring(false);
    setSelectedDate(undefined);
    setSelectedDay(undefined);
    setStartTime('09:00');
    setEndTime('10:00');
    setReason('');
  };

  const getBlockTypeLabel = (type: string) => {
    return 'Blocked Time';
  };

  const getDayName = (dayNum: number) => {
    return DAY_NAMES.find(d => d.value === dayNum)?.label || '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Scheduling Blocks</h3>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Block
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Block Time</DialogTitle>
              <DialogDescription>
                Block off time for appointments, activities, or other commitments
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select 
                  value={isRecurring ? 'recurring' : 'one-time'} 
                  onValueChange={(v) => setIsRecurring(v === 'recurring')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-time">One-time event</SelectItem>
                    <SelectItem value="recurring">Recurring weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isRecurring ? (
                <div className="space-y-2">
                  <Label>Day of Week</Label>
                  <Select 
                    value={selectedDay?.toString()} 
                    onValueChange={(v) => setSelectedDay(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAY_NAMES.map(day => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarClock className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input 
                    type="time" 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input 
                    type="time" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Textarea
                  placeholder="e.g., Orthodontist appointment"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddBlock} disabled={loading}>
                Add Block
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {blocks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No scheduling blocks. Add blocks to prevent assignments from being scheduled during specific times.
        </p>
      ) : (
        <div className="space-y-2">
          {blocks.map(block => (
            <div
              key={block.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-card"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{getBlockTypeLabel(block.block_type)}</Badge>
                  {block.day_of_week !== null && (
                    <Badge variant="outline">Every {getDayName(block.day_of_week)}</Badge>
                  )}
                </div>
                <div className="text-sm">
                  {block.specific_date && (
                    <span className="font-medium">
                      {format(new Date(block.specific_date), 'MMM d, yyyy')} • 
                    </span>
                  )}
                  <span className="ml-1">
                    {block.start_time.substring(0, 5)} - {block.end_time.substring(0, 5)}
                  </span>
                </div>
                {block.reason && (
                  <p className="text-sm text-muted-foreground">{block.reason}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteBlock(block.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
