import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Calendar } from 'lucide-react';

interface EditAssignmentDatesDialogProps {
  assignment: any;
  onAssignmentUpdated: () => void;
  trigger?: React.ReactNode;
}

export function EditAssignmentDatesDialog({ 
  assignment, 
  onAssignmentUpdated, 
  trigger 
}: EditAssignmentDatesDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Convert ISO dates to YYYY-MM-DD format for input
  const formatDateForInput = (isoDate: string | null) => {
    if (!isoDate) return '';
    return new Date(isoDate).toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const assignedDate = formData.get('assignedDate') as string;
    const dueDate = formData.get('dueDate') as string;

    try {
      const { error } = await supabase
        .from('assignments')
        .update({
          assigned_date: assignedDate || null,
          due_at: dueDate ? new Date(dueDate).toISOString() : null,
        })
        .eq('id', assignment.id);

      if (error) throw error;

      toast.success('Assignment dates updated successfully');
      setOpen(false);
      onAssignmentUpdated();
    } catch (error: any) {
      toast.error(`Failed to update dates: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Edit Dates
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Assignment Dates</DialogTitle>
          <DialogDescription>
            Update the assigned and due dates for this assignment
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assignedDate">Assigned Date</Label>
            <Input
              id="assignedDate"
              name="assignedDate"
              type="date"
              defaultValue={formatDateForInput(assignment.assigned_date)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              defaultValue={formatDateForInput(assignment.due_at)}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Dates'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
