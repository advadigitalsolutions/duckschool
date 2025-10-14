import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Plus } from 'lucide-react';

interface RequestCourseDialogProps {
  studentId: string;
  onCourseCreated: () => void;
}

const subjects = [
  'Mathematics',
  'Science',
  'English/Language Arts',
  'History',
  'Foreign Language',
  'Art',
  'Music',
  'Physical Education',
  'Computer Science',
  'Board Games',
  'Cooking',
  'Photography',
  'Creative Writing',
  'Game Design',
  'Drawing',
  'Coding',
  'Other'
];

export function RequestCourseDialog({ studentId, onCourseCreated }: RequestCourseDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [learningGoal, setLearningGoal] = useState('');
  const [interest, setInterest] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get student name for notification
      const { data: studentData } = await supabase
        .from('students')
        .select('name')
        .eq('id', studentId)
        .single();

      // Create the course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          student_id: studentId,
          title,
          subject: subject || 'Other',
          description: learningGoal,
          initiated_by: user.id,
          initiated_by_role: 'student',
          initiated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // Generate initial assessment using the existing edge function
      const { error: generateError } = await supabase.functions.invoke('generate-assignment', {
        body: {
          courseId: courseData.id,
          courseTitle: title,
          topic: `${title} - Initial Assessment`,
          studentProfile: {
            learningGoal,
            interest: interest || subject,
            isStudentInitiated: true,
          },
        },
      });

      if (generateError) {
        console.error('Error generating initial assessment:', generateError);
        toast.warning('Course created, but initial assessment generation failed. Your parent can add assignments.');
      }

      toast.success(`Course created! Your parent will see: "${studentData?.name} created a course: ${title}"`);
      setOpen(false);
      setTitle('');
      setSubject('');
      setLearningGoal('');
      setInterest('');
      onCourseCreated();
    } catch (error: any) {
      console.error('Error creating course:', error);
      toast.error(error.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create a Course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Your Own Course</DialogTitle>
          <DialogDescription>
            Tell us what you'd like to learn, and we'll create a personalized course for you!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="title">What do you want to learn?</Label>
            <Input
              id="title"
              placeholder="e.g., Dungeons & Dragons 5th Edition"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="subject">Subject/Interest Category</Label>
            <Select value={subject} onValueChange={setSubject} required>
              <SelectTrigger id="subject">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="learningGoal">What do you want to be able to do?</Label>
            <Textarea
              id="learningGoal"
              placeholder="e.g., I want to learn how to be a Dungeon Master and run my own D&D campaigns"
              value={learningGoal}
              onChange={(e) => setLearningGoal(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="interest">Why are you interested in this? (Optional)</Label>
            <Textarea
              id="interest"
              placeholder="e.g., I've played D&D a few times and love creating stories. I want to learn how to create exciting adventures for my friends."
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Course'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
