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
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { StandardsSelector } from './StandardsSelector';

interface AddAssignmentDialogProps {
  courses: any[];
  studentId: string;
  onAssignmentAdded: () => void;
}

export function AddAssignmentDialog({ courses, studentId, onAssignmentAdded }: AddAssignmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [topic, setTopic] = useState('');
  const [approachOverride, setApproachOverride] = useState('');
  const [assignedDate, setAssignedDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedStandards, setSelectedStandards] = useState<string[]>([]);
  const [enableCrossSubject, setEnableCrossSubject] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleCourse = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) {
      toast.error('Please enter a topic for the assignment');
      return;
    }

    if (selectedCourses.length === 0) {
      toast.error('Please select at least one course');
      return;
    }

    setIsGenerating(true);

    try {
      const selectedCoursesData = courses.filter(c => selectedCourses.includes(c.id));
      if (selectedCoursesData.length === 0) throw new Error('Courses not found');

      // Get student data for profile context
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      // Generate assignment content with AI (multi-course support)
      const { data: generatedContent, error: generateError } = await supabase.functions.invoke(
        'generate-assignment',
        {
          body: {
            courseIds: selectedCourses,
            coursesData: selectedCoursesData.map(c => ({
              id: c.id,
              title: c.title,
              subject: c.subject,
              grade_level: c.grade_level,
              standards_scope: c.standards_scope
            })),
            topic: topic,
            gradeLevel: selectedCoursesData[0].grade_level,
            studentProfile: studentData,
            enableCrossSubject: enableCrossSubject && selectedCourses.length > 1,
            manualStandards: selectedStandards,
            approachOverride,
            isInitialAssessment: false
          }
        }
      );

      if (generateError) throw generateError;

      // Create curriculum items for each course
      const createdAssignments = [];
      for (const courseData of selectedCoursesData) {
        // Determine standards for this course
        let finalStandards = selectedStandards;
        
        // Use AI-detected standards from content if available for this course
        if (generatedContent.standards_alignment_by_course) {
          const courseAlignment = generatedContent.standards_alignment_by_course[courseData.id];
          if (courseAlignment && Array.isArray(courseAlignment)) {
            const alignedCodes = courseAlignment.map((s: any) => s.code);
            finalStandards = [...new Set([...finalStandards, ...alignedCodes])];
          }
        } else if (generatedContent.standards_alignment && Array.isArray(generatedContent.standards_alignment)) {
          // Fallback to general alignment if no course-specific alignment
          const alignedCodes = generatedContent.standards_alignment.map((s: any) => s.code);
          finalStandards = [...new Set([...finalStandards, ...alignedCodes])];
        }

        // Create curriculum item with generated content
        const { data: curriculumItem, error: curriculumError } = await supabase
          .from('curriculum_items')
          .insert({
            course_id: courseData.id,
            title: selectedCourses.length > 1 
              ? `${generatedContent.title} (${courseData.subject})`
              : generatedContent.title,
            type: 'assignment',
            body: generatedContent,
            est_minutes: generatedContent.estimated_minutes || 60,
            standards: finalStandards
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
            assigned_date: assignedDate || null,
            due_at: dueDate || null,
            rubric: generatedContent.rubric || null
          } as any);

        if (assignmentError) throw assignmentError;
        
        createdAssignments.push({ course: courseData.title, id: curriculumItem.id });
      }

      toast.success(
        selectedCourses.length > 1 
          ? `Created ${createdAssignments.length} cross-subject assignments!`
          : 'AI-generated assignment created successfully!'
      );
      setOpen(false);
      setTopic('');
      setApproachOverride('');
      setSelectedCourses([]);
      setAssignedDate('');
      setDueDate('');
      setSelectedStandards([]);
      setEnableCrossSubject(false);
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
            <Label>Select Course(s)</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Select one or multiple courses for this assignment
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
              {courses.map((course) => (
                <div key={course.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={course.id}
                    checked={selectedCourses.includes(course.id)}
                    onCheckedChange={() => toggleCourse(course.id)}
                  />
                  <label
                    htmlFor={course.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {course.title} - {course.subject}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Cross-Subject Integration Toggle */}
          {selectedCourses.length > 1 && (
            <div className="flex items-center justify-between space-x-2 p-3 border rounded-md bg-muted/50">
              <div className="space-y-0.5">
                <Label htmlFor="cross-subject">Enable Cross-Subject Integration</Label>
                <p className="text-xs text-muted-foreground">
                  Incorporate weak areas from one subject into other subjects to maximize learning time
                </p>
              </div>
              <Switch
                id="cross-subject"
                checked={enableCrossSubject}
                onCheckedChange={setEnableCrossSubject}
              />
            </div>
          )}

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
            <Label htmlFor="approach-override">Assignment Approach & Resources (Optional)</Label>
            <Textarea
              id="approach-override"
              value={approachOverride}
              onChange={(e) => setApproachOverride(e.target.value)}
              placeholder="e.g., Use Khan Academy as the main resource, keep it computer-based with no physical materials needed"
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Override learning style suggestions - specify your preferred resources and approach here
            </p>
          </div>

          {/* Standards Selector */}
          {selectedCourses.length > 0 && (() => {
            const selectedCoursesData = courses.filter(c => selectedCourses.includes(c.id));
            const frameworks = [...new Set(selectedCoursesData.map(c => c.standards_scope?.[0]?.framework).filter(Boolean))];
            
            // Only show standards selector for standard frameworks (not custom)
            if (frameworks.length === 0 || frameworks.includes('CUSTOM')) return null;
            
            return (
              <div className="space-y-2">
                <Label>Tagged Standards (Optional)</Label>
                {frameworks.length > 1 && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Multiple frameworks selected. Standards from all frameworks can be tagged.
                  </p>
                )}
                <StandardsSelector
                  selectedStandards={selectedStandards}
                  onChange={setSelectedStandards}
                  framework={frameworks[0]}
                  gradeLevel={selectedCoursesData[0]?.grade_level}
                  subject={selectedCoursesData[0]?.subject}
                />
                <p className="text-xs text-muted-foreground">
                  Select which educational standards this assignment addresses
                </p>
              </div>
            );
          })()}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignedDate">Assigned Date</Label>
              <Input
                id="assignedDate"
                type="date"
                value={assignedDate}
                onChange={(e) => setAssignedDate(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                When should this work appear
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
              <p className="text-xs text-muted-foreground">
                When must it be completed
              </p>
            </div>
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
