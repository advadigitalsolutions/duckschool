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
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface AddStudentDialogProps {
  onStudentAdded: () => void;
}

export const AddStudentDialog = ({ onStudentAdded }: AddStudentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const dob = formData.get('dob') as string;
    const gradeLevel = formData.get('gradeLevel') as string;
    const accommodationsText = formData.get('accommodations') as string;
    const goalsText = formData.get('goals') as string;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Parse accommodations and goals
      const accommodations = accommodationsText 
        ? { notes: accommodationsText }
        : {};
      const goals = goalsText 
        ? { notes: goalsText }
        : {};

      const { error } = await supabase
        .from('students')
        .insert({
          name,
          dob: dob || null,
          grade_level: gradeLevel,
          parent_id: user.id,
          accommodations,
          goals,
        });

      if (error) throw error;

      toast.success('Student added successfully!');
      setOpen(false);
      onStudentAdded();
      
      // Reset form
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      console.error('Error adding student:', error);
      toast.error(error.message || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Create a student profile to start managing their homeschool curriculum
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Student Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Isaiah"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              name="dob"
              type="date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gradeLevel">Grade Level *</Label>
            <Input
              id="gradeLevel"
              name="gradeLevel"
              placeholder="10th Grade"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accommodations">ADHD Accommodations</Label>
            <Textarea
              id="accommodations"
              name="accommodations"
              placeholder="e.g., Extended time, frequent breaks, visual progress indicators"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goals">Learning Goals</Label>
            <Textarea
              id="goals"
              name="goals"
              placeholder="e.g., Complete 10th grade curriculum, prepare for GED"
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
              {loading ? 'Adding...' : 'Add Student'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
