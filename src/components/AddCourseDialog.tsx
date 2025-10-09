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

interface AddCourseDialogProps {
  studentId: string;
  onCourseAdded: () => void;
}

const subjects = [
  'Mathematics',
  'English/Language Arts',
  'Science',
  'History/Social Studies',
  'Physical Education',
  'Spanish',
  'Computer Science',
  'Art',
  'Music',
  'Other'
];

export const AddCourseDialog = ({ studentId, onCourseAdded }: AddCourseDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const subject = formData.get('subject') as string;
    const description = formData.get('description') as string;
    const credits = parseFloat(formData.get('credits') as string) || 1.0;
    const gradeLevel = formData.get('gradeLevel') as string;

    try {
      const { error } = await supabase
        .from('courses')
        .insert({
          student_id: studentId,
          title,
          subject,
          description: description || null,
          credits,
          grade_level: gradeLevel,
        });

      if (error) throw error;

      toast.success('Course added successfully!');
      setOpen(false);
      onCourseAdded();
      
      // Reset form
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      console.error('Error adding course:', error);
      toast.error(error.message || 'Failed to add course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Course</DialogTitle>
          <DialogDescription>
            Create a new course for this student
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Course Title *</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Algebra I"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Select name="subject" required>
              <SelectTrigger>
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gradeLevel">Grade Level</Label>
            <Input
              id="gradeLevel"
              name="gradeLevel"
              placeholder="e.g., 10th Grade"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="credits">Credits</Label>
            <Input
              id="credits"
              name="credits"
              type="number"
              step="0.5"
              min="0"
              defaultValue="1.0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Course overview and goals"
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
              {loading ? 'Adding...' : 'Add Course'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
