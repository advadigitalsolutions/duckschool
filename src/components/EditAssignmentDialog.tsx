import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';

interface EditAssignmentDialogProps {
  assignment: any;
  onAssignmentUpdated: () => void;
  trigger?: React.ReactNode;
}

export function EditAssignmentDialog({ assignment, onAssignmentUpdated, trigger }: EditAssignmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(assignment.curriculum_items?.body?.title || assignment.curriculum_items?.title || '');
  const [instructions, setInstructions] = useState(assignment.curriculum_items?.body?.instructions || '');
  const [dueDate, setDueDate] = useState(
    assignment.due_at ? new Date(assignment.due_at).toISOString().split('T')[0] : ''
  );
  const [status, setStatus] = useState(assignment.status || 'draft');
  const [maxAttempts, setMaxAttempts] = useState(assignment.max_attempts?.toString() || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update curriculum_items
      const curriculumBody = assignment.curriculum_items?.body || {};
      const { error: curriculumError } = await supabase
        .from('curriculum_items')
        .update({
          title: title,
          body: {
            ...curriculumBody,
            title: title,
            instructions: instructions,
          },
        })
        .eq('id', assignment.curriculum_item_id);

      if (curriculumError) throw curriculumError;

      // Update assignments
      const { error: assignmentError } = await supabase
        .from('assignments')
        .update({
          due_at: dueDate || null,
          status: status,
          max_attempts: maxAttempts ? parseInt(maxAttempts) : null,
        })
        .eq('id', assignment.id);

      if (assignmentError) throw assignmentError;

      toast.success('Assignment updated successfully!');
      setOpen(false);
      onAssignmentUpdated();
    } catch (error: any) {
      toast.error('Failed to update assignment');
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
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>
              Update assignment details and settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Assignment Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter assignment title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Enter assignment instructions"
                rows={4}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxAttempts">Maximum Attempts</Label>
                <Input
                  id="maxAttempts"
                  type="number"
                  min="1"
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(e.target.value)}
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="graded">Graded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Assignment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
