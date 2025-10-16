import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, BookOpen } from 'lucide-react';
import { COURSE_TYPES, getCourseTypesBySubject, getCourseTypeByKey } from '@/types/courseTypes';
import { useAvailableFrameworks } from '@/hooks/useAvailableFrameworks';

interface AddCourseDialogProps {
  studentId: string;
  onCourseAdded: () => void;
}

const PEDAGOGIES = [
  { value: 'eclectic', label: 'Eclectic' },
  { value: 'classical', label: 'Classical' },
  { value: 'montessori', label: 'Montessori' },
  { value: 'charlotte-mason', label: 'Charlotte Mason' },
  { value: 'waldorf', label: 'Waldorf' },
  { value: 'unschooling', label: 'Unschooling' }
];

export const AddCourseDialog = ({ studentId, onCourseAdded }: AddCourseDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'standards' | 'manual'>('standards');
  
  // Common settings
  const [framework, setFramework] = useState('CA-CCSS');
  const [pedagogy, setPedagogy] = useState('eclectic');
  
  // Standards mode
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const { frameworks } = useAvailableFrameworks();
  
  // Manual mode
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedCourseType, setSelectedCourseType] = useState<string>('');
  
  const availableCourseTypes = selectedSubject ? getCourseTypesBySubject(selectedSubject) : [];

  useEffect(() => {
    if (mode === 'standards' && framework && framework !== 'CUSTOM') {
      loadSubjects();
    } else {
      setAvailableSubjects([]);
      setSelectedSubjects([]);
    }
  }, [framework, mode]);

  const loadSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('standards')
        .select('subject')
        .eq('framework', framework)
        .limit(10000);

      if (error) throw error;
      const uniqueSubjects = [...new Set(data.map(s => s.subject).filter(Boolean))];
      setAvailableSubjects(uniqueSubjects);
    } catch (error) {
      console.error('Error loading subjects:', error);
      toast.error('Failed to load available subjects');
    }
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (mode === 'standards') {
        // Create courses from standards
        if (selectedSubjects.length === 0) {
          toast.error('Please select at least one subject');
          setLoading(false);
          return;
        }

        for (const subject of selectedSubjects) {
          const { data, error } = await supabase
            .from('courses')
            .insert({
              student_id: studentId,
              title: subject,
              subject: subject,
              standards_scope: [{
                framework: framework,
                subject: subject
              }],
              pacing_config: {
                framework: framework,
                pedagogy: pedagogy
              },
              initiated_by: user?.id,
              initiated_by_role: 'parent',
              credits: 1.0
            })
            .select()
            .single();

          if (error) throw error;

          // Generate initial assessment
          try {
            const { data: studentData } = await supabase
              .from('students')
              .select('*')
              .eq('id', studentId)
              .single();

            const { data: assessmentData, error: assessmentError } = await supabase.functions.invoke('generate-assignment', {
              body: {
                courseTitle: subject,
                courseSubject: subject,
                topic: 'Initial Course Assessment',
                gradeLevel: studentData?.grade_level || 'K-12',
                standards: [],
                studentProfile: studentData,
                isInitialAssessment: true
              }
            });

            if (!assessmentError && assessmentData) {
              const { data: curriculumItem } = await supabase
                .from('curriculum_items')
                .insert({
                  course_id: data.id,
                  title: 'Initial Course Assessment',
                  type: 'assignment',
                  body: assessmentData,
                  est_minutes: assessmentData.estimated_minutes || 45
                })
                .select()
                .single();

              if (curriculumItem) {
                await supabase.from('assignments').insert({
                  curriculum_item_id: curriculumItem.id,
                  status: 'assigned',
                  max_attempts: 3
                });
              }
            }
          } catch (assessmentError) {
            console.error('Error creating assessment:', assessmentError);
          }
        }

        toast.success(`Created ${selectedSubjects.length} course(s) with initial assessments`);
        setSelectedSubjects([]);
      } else {
        // Manual course creation
        const formData = new FormData(e.target as HTMLFormElement);
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

        const title = customSuffix ? `${courseType.displayName} - ${customSuffix}` : courseType.displayName;
        const defaultGrade = courseType.gradeRange.split('-')[0];

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
            pacing_config: {
              framework: framework,
              pedagogy: pedagogy
            },
            initiated_by: user?.id,
            initiated_by_role: 'parent',
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
          const { data: assessmentData, error: assessmentError } = await supabase.functions.invoke('generate-assignment', {
            body: {
              courseTitle: title,
              courseSubject: subject,
              topic: 'Initial Course Assessment',
              gradeLevel: gradeLevel || defaultGrade,
              standards: [],
              studentProfile: studentData,
              isInitialAssessment: true
            }
          });

          if (!assessmentError && assessmentData) {
            const { data: curriculumItem } = await supabase
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

            if (curriculumItem) {
              await supabase.from('assignments').insert({
                curriculum_item_id: curriculumItem.id,
                status: 'assigned',
                max_attempts: 3
              });
            }
          }
        } catch (assessmentError: any) {
          console.error('Error creating initial assessment:', assessmentError);
        }

        toast.success('Course created with initial assessment!');
        setSelectedSubject('');
        setSelectedCourseType('');
      }

      setOpen(false);
      onCourseAdded();
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Course</DialogTitle>
          <DialogDescription>
            Create courses from standards or manually configure individual courses
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'standards' | 'manual')} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="standards">
              <BookOpen className="h-4 w-4 mr-2" />
              From Standards
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Plus className="h-4 w-4 mr-2" />
              Manual Setup
            </TabsTrigger>
          </TabsList>

          {/* Common Settings */}
          <div className="space-y-4 mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Regional Standards Framework</Label>
                <Select value={framework} onValueChange={setFramework}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {frameworks.map((fw) => (
                      <SelectItem key={fw.value} value={fw.value}>
                        {fw.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Educational Pedagogy</Label>
                <Select value={pedagogy} onValueChange={setPedagogy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PEDAGOGIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <TabsContent value="standards" className="space-y-4">
            <div className="space-y-2">
              <Label>Select Subjects *</Label>
              <p className="text-xs text-muted-foreground">
                A course will be created for each selected subject
              </p>
              {availableSubjects.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-4 border rounded-lg">
                  {availableSubjects.map((subject) => (
                    <Badge
                      key={subject}
                      variant={selectedSubjects.includes(subject) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleSubject(subject)}
                    >
                      {subject}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a framework to see available subjects
                </p>
              )}
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
              <Button 
                onClick={handleSubmit}
                disabled={loading || selectedSubjects.length === 0}
              >
                {loading ? 'Creating...' : `Create ${selectedSubjects.length || 0} Course(s)`}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="manual">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Select 
                  name="subject" 
                  required
                  value={selectedSubject}
                  onValueChange={(value) => {
                    setSelectedSubject(value);
                    setSelectedCourseType('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Mathematics', 'English/Language Arts', 'Science', 'History/Social Studies', 
                      'Physical Education', 'Spanish', 'Computer Science', 'Art', 'Music', 'Other'].map((subject) => (
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
                  placeholder="e.g., Honors, AP, Remedial"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gradeLevel">Grade Level</Label>
                  <Input
                    id="gradeLevel"
                    name="gradeLevel"
                    placeholder={selectedCourseType ? getCourseTypeByKey(selectedCourseType)?.gradeRange : "e.g., 10"}
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
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
                  {loading ? 'Creating...' : 'Create Course'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
