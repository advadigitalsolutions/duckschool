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
import { COURSE_TYPES, getCourseTypesBySubject, getCourseTypeByKey } from '@/types/courseTypes';

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

const PEDAGOGIES = [
  { value: 'montessori', label: 'Montessori' },
  { value: 'classical', label: 'Classical Education' },
  { value: 'charlotte-mason', label: 'Charlotte Mason' },
  { value: 'unschooling', label: 'Unschooling' },
  { value: 'traditional', label: 'Traditional' },
  { value: 'project-based', label: 'Project-Based Learning' },
  { value: 'waldorf', label: 'Waldorf' },
  { value: 'eclectic', label: 'Eclectic' },
];

export const AddCourseDialog = ({ studentId, onCourseAdded }: AddCourseDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedCourseType, setSelectedCourseType] = useState<string>('');
  const [pedagogy, setPedagogy] = useState<string>('eclectic');
  const [framework, setFramework] = useState<string>('CA-CCSS');
  
  const availableCourseTypes = selectedSubject ? getCourseTypesBySubject(selectedSubject) : [];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const courseTypeKey = formData.get('courseType') as string;
    const customSuffix = formData.get('customSuffix') as string;
    const subject = formData.get('subject') as string;
    const description = formData.get('description') as string;
    const credits = parseFloat(formData.get('credits') as string) || 1.0;
    const gradeLevel = formData.get('gradeLevel') as string;

    const courseType = getCourseTypeByKey(courseTypeKey);
    if (!courseType) {
      toast.error('Invalid course type selected');
      setLoading(false);
      return;
    }

    // Build display title from course type + optional suffix
    const title = customSuffix ? `${courseType.displayName} - ${customSuffix}` : courseType.displayName;

    // Extract a single grade from the grade range for standards lookup
    // e.g., "6-8" -> "6", "9-10" -> "9", "11-12" -> "11"
    const defaultGrade = courseType.gradeRange.includes('-') 
      ? courseType.gradeRange.split('-')[0] 
      : courseType.gradeRange;

    try {
      // Get current user to set as course creator
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('courses')
        .insert({
          student_id: studentId,
          title,
          subject,
          course_type: courseTypeKey,
          description: description || null,
          credits,
          grade_level: gradeLevel || defaultGrade,
          initiated_by: user?.id,
          initiated_by_role: 'student',
          pacing_config: {
            pedagogy: pedagogy,
            framework: framework
          }
        })
        .select();

      if (error) throw error;

      // Get student data for profile context
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      // Create initial assessment assignment
      try {
        toast.info('Generating initial course assessment...');
        
        const { data: assessmentData, error: assessmentError } = await supabase.functions.invoke('generate-assignment', {
          body: {
            courseTitle: title,
            courseSubject: subject,
            topic: 'Initial Course Assessment',
            gradeLevel: gradeLevel || 'K-12',
            standards: [],
            studentProfile: studentData,
            isInitialAssessment: true
          }
        });

        if (assessmentError) throw assessmentError;

        // Create curriculum item for the assessment
        const { data: curriculumItem, error: ciError } = await supabase
          .from('curriculum_items')
          .insert({
            course_id: data[0].id,
            title: 'Initial Course Assessment',
            type: 'assignment',
            body: assessmentData,
            est_minutes: assessmentData.estimated_minutes || 45
          })
          .select()
          .single();

        if (ciError) throw ciError;

        // Create the assignment
        const { error: assignmentError } = await supabase
          .from('assignments')
          .insert({
            curriculum_item_id: curriculumItem.id,
            status: 'assigned',
            max_attempts: 3
          });

        if (assignmentError) throw assignmentError;

        toast.success('Course created with initial assessment!');
      } catch (assessmentError: any) {
        console.error('Error creating initial assessment:', assessmentError);
        toast.warning('Course created, but initial assessment generation failed');
      }

      setOpen(false);
      onCourseAdded();
      
      // Reset form and state
      (e.target as HTMLFormElement).reset();
      setSelectedSubject('');
      setSelectedCourseType('');
      setPedagogy('eclectic');
      setFramework('CA-CCSS');
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
            <Label htmlFor="subject">Subject *</Label>
            <Select 
              name="subject" 
              required
              value={selectedSubject}
              onValueChange={(value) => {
                setSelectedSubject(value);
                setSelectedCourseType(''); // Reset course type when subject changes
              }}
            >
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
            <Label htmlFor="courseType">Course Type *</Label>
            <Select 
              name="courseType" 
              required
              value={selectedCourseType}
              onValueChange={setSelectedCourseType}
              disabled={!selectedSubject}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedSubject ? "Select a course type" : "Select subject first"} />
              </SelectTrigger>
              <SelectContent>
                {availableCourseTypes.map((courseType) => (
                  <SelectItem key={courseType.key} value={courseType.key}>
                    {courseType.displayName}
                    {courseType.description && (
                      <span className="text-muted-foreground text-xs ml-2">
                        ({courseType.description})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customSuffix">Custom Title Suffix (Optional)</Label>
            <Input
              id="customSuffix"
              name="customSuffix"
              placeholder="e.g., Refresher, Accelerated, Honors"
            />
            <p className="text-xs text-muted-foreground">
              {selectedCourseType && getCourseTypeByKey(selectedCourseType) && (
                <>Display name: {getCourseTypeByKey(selectedCourseType)!.displayName}</>
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pedagogy">Educational Pedagogy *</Label>
            <Select 
              name="pedagogy" 
              required
              value={pedagogy}
              onValueChange={setPedagogy}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PEDAGOGIES.map((ped) => (
                  <SelectItem key={ped.value} value={ped.value}>
                    {ped.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Influences how AI generates curriculum and assignments
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="framework">Regional Standards Framework *</Label>
            <Select 
              name="framework" 
              required
              value={framework}
              onValueChange={setFramework}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CA-CCSS">California Common Core State Standards</SelectItem>
                <SelectItem value="CUSTOM">Custom Framework (Goals-Based)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Used for AI curriculum generation when regional standards aren't available
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gradeLevel">Grade Level (Optional)</Label>
            <Input
              id="gradeLevel"
              name="gradeLevel"
              placeholder={
                selectedCourseType && getCourseTypeByKey(selectedCourseType)
                  ? `Suggested: ${getCourseTypeByKey(selectedCourseType)!.gradeRange}`
                  : "e.g., 6, 7, 8th Grade"
              }
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to use default for this course type
            </p>
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
