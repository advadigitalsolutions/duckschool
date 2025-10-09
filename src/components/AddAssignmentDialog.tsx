import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface AddAssignmentDialogProps {
  courses: any[];
  studentId: string;
  onAssignmentAdded: () => void;
}

export const AddAssignmentDialog = ({ courses, studentId, onAssignmentAdded }: AddAssignmentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const courseId = formData.get('courseId') as string;
    const title = formData.get('title') as string;
    const type = formData.get('type') as string;
    const description = formData.get('description') as string;
    const estMinutes = parseInt(formData.get('estMinutes') as string) || 30;
    const dueAt = formData.get('dueAt') as string;

    try {
      // First create curriculum item
      const { data: curriculumItem, error: itemError } = await supabase
        .from('curriculum_items')
        .insert({
          course_id: courseId,
          title,
          type,
          body: { description },
          est_minutes: estMinutes,
        } as any)
        .select()
        .single();

      if (itemError) throw itemError;

      // Then create assignment
      const { error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          curriculum_item_id: curriculumItem.id,
          due_at: dueAt ? new Date(dueAt).toISOString() : null,
          status: 'assigned',
        });

      if (assignmentError) throw assignmentError;

      toast.success('Assignment created successfully!');
      setOpen(false);
      onAssignmentAdded();
      
      // Reset form
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      toast.error(error.message || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Assignment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Assignment</DialogTitle>
          <DialogDescription>
            Add a new assignment for the student
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="courseId">Course *</Label>
            <Select name="courseId" required>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title} ({course.subject})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Assignment Title *</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Chapter 3 Quiz"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select name="type" required defaultValue="lesson">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lesson">Lesson</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="reading">Reading</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estMinutes">Est. Time (minutes)</Label>
            <Input
              id="estMinutes"
              name="estMinutes"
              type="number"
              min="5"
              defaultValue="30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueAt">Due Date</Label>
            <Input
              id="dueAt"
              name="dueAt"
              type="datetime-local"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Assignment instructions"
              rows={3}
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
              {loading ? 'Creating...' : 'Create Assignment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
