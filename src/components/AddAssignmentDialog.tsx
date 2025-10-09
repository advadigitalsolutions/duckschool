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
import { Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddAssignmentDialogProps {
  courses: any[];
  studentId: string;
  onAssignmentAdded: () => void;
}

export function AddAssignmentDialog({ courses, studentId, onAssignmentAdded }: AddAssignmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [topic, setTopic] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) {
      toast.error('Please enter a topic for the assignment');
      return;
    }

    setIsGenerating(true);

    try {
      const selectedCourseData = courses.find(c => c.id === selectedCourse);
      if (!selectedCourseData) throw new Error('Course not found');

      // Get student data for profile context
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      // Generate assignment content with AI
      const { data: generatedContent, error: generateError } = await supabase.functions.invoke(
        'generate-assignment',
        {
          body: {
            courseTitle: selectedCourseData.title,
            courseSubject: selectedCourseData.subject,
            topic: topic,
            gradeLevel: selectedCourseData.grade_level,
            standards: selectedCourseData.standards_scope,
            studentProfile: studentData,
            isInitialAssessment: false
          }
        }
      );

      if (generateError) throw generateError;

      // Create curriculum item with generated content
      const { data: curriculumItem, error: curriculumError } = await supabase
        .from('curriculum_items')
        .insert({
          course_id: selectedCourse,
          title: generatedContent.title,
          type: 'assignment',
          body: generatedContent,
          est_minutes: generatedContent.estimated_minutes || 60
        } as any)
        .select()
        .single();

      if (curriculumError) throw curriculumError;

      // Create the assignment
      const { error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          curriculum_item_id: curriculumItem.id,
          status: 'draft',
          due_at: dueDate || null,
          rubric: generatedContent.rubric || null
        } as any);

      if (assignmentError) throw assignmentError;

      toast.success('AI-generated assignment created successfully!');
      setOpen(false);
      setTopic('');
      setSelectedCourse('');
      setDueDate('');
      onAssignmentAdded();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create assignment');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Assignment with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Powered Assignment Creator
          </DialogTitle>
          <DialogDescription>
            Describe what you want students to learn, and AI will generate a complete assignment with objectives, instructions, rubric, and more.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course">Course</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title} - {course.subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Assignment Topic</Label>
            <Textarea
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Write a persuasive essay about climate change, or Solve quadratic equations using multiple methods"
              required
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Be specific about what you want students to learn and demonstrate
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (Optional)</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isGenerating}>
            {isGenerating ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Generating Assignment...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Assignment
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
