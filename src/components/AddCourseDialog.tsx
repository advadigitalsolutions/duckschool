import { useState, useEffect } from 'react';
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { Plus, ChevronDown } from 'lucide-react';
import { getCourseTypeByKey, getCoursesGroupedBySubject } from '@/types/courseTypes';
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
  const [selectedCourseTypeKey, setSelectedCourseTypeKey] = useState<string>('');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Configuration options
  const [framework, setFramework] = useState('CA-CCSS');
  const [pedagogy, setPedagogy] = useState('eclectic');
  const [gradeLevel, setGradeLevel] = useState('');
  const [credits, setCredits] = useState('1.0');
  const [description, setDescription] = useState('');
  const [customSuffix, setCustomSuffix] = useState('');
  
  const { frameworks } = useAvailableFrameworks();
  const groupedCourses = getCoursesGroupedBySubject();
  
  const selectedCourseType = selectedCourseTypeKey ? getCourseTypeByKey(selectedCourseTypeKey) : null;
  const isCustomCourse = selectedCourseTypeKey === 'custom';

  // Auto-populate fields when course type is selected
  useEffect(() => {
    if (selectedCourseType && !isCustomCourse) {
      const defaultGrade = selectedCourseType.gradeRange.split('-')[0];
      setGradeLevel(defaultGrade);
    }
  }, [selectedCourseType, isCustomCourse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCourseTypeKey) {
      toast.error('Please select a course type');
      return;
    }

    if (isCustomCourse && (!customSubject || !customTitle)) {
      toast.error('Please provide subject and title for custom course');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Determine final course details
      let finalTitle: string;
      let finalSubject: string;
      let courseTypeKey: string | null = null;

      if (isCustomCourse) {
        finalTitle = customSuffix ? `${customTitle} - ${customSuffix}` : customTitle;
        finalSubject = customSubject;
      } else {
        if (!selectedCourseType) return;
        finalTitle = customSuffix ? `${selectedCourseType.displayName} - ${customSuffix}` : selectedCourseType.displayName;
        finalSubject = selectedCourseType.subject;
        courseTypeKey = selectedCourseTypeKey;
      }

      // Create the fully configured course
      const { data, error } = await supabase
        .from('courses')
        .insert({
          student_id: studentId,
          title: finalTitle,
          subject: finalSubject,
          course_type: courseTypeKey,
          description: description || null,
          credits: parseFloat(credits) || 1.0,
          grade_level: gradeLevel || null,
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
            courseTitle: finalTitle,
            courseSubject: finalSubject,
            topic: 'Initial Course Assessment',
            gradeLevel: gradeLevel || studentData?.grade_level || 'K-12',
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
      } catch (assessmentError) {
        console.error('Error creating initial assessment:', assessmentError);
      }

      toast.success('Course fully configured and created!');
      
      // Reset form
      setSelectedCourseTypeKey('');
      setCustomSubject('');
      setCustomTitle('');
      setGradeLevel('');
      setCredits('1.0');
      setDescription('');
      setCustomSuffix('');
      
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
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Course</DialogTitle>
          <DialogDescription>
            Select a course type and configure all settings in one place
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Primary Course Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="courseType">Course Type *</Label>
            <Select 
              value={selectedCourseTypeKey}
              onValueChange={setSelectedCourseTypeKey}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a course type..." />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                {Object.entries(groupedCourses).map(([subject, courses]) => (
                  <SelectGroup key={subject}>
                    <SelectLabel className="font-semibold">{subject}</SelectLabel>
                    {courses.map((course) => (
                      <SelectItem key={course.key} value={course.key}>
                        {course.displayName} <span className="text-muted-foreground text-xs ml-1">(Grades {course.gradeRange})</span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
                <SelectGroup>
                  <SelectLabel className="font-semibold">Other</SelectLabel>
                  <SelectItem value="custom">Custom Course</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Course Fields */}
          {isCustomCourse && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="customSubject">Subject *</Label>
                <Input
                  id="customSubject"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="e.g., Philosophy, Engineering"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customTitle">Course Title *</Label>
                <Input
                  id="customTitle"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g., Introduction to Philosophy"
                  required
                />
              </div>
            </div>
          )}

          {/* Auto-populated Subject Display */}
          {selectedCourseType && !isCustomCourse && (
            <div className="p-3 bg-muted/30 rounded-lg border border-muted">
              <div className="text-sm">
                <span className="text-muted-foreground">Subject:</span>{' '}
                <span className="font-medium">{selectedCourseType.subject}</span>
              </div>
              {selectedCourseType.description && (
                <div className="text-xs text-muted-foreground mt-1">
                  {selectedCourseType.description}
                </div>
              )}
            </div>
          )}

          {/* Custom Title Suffix */}
          <div className="space-y-2">
            <Label htmlFor="customSuffix">Custom Title Suffix (Optional)</Label>
            <Input
              id="customSuffix"
              value={customSuffix}
              onChange={(e) => setCustomSuffix(e.target.value)}
              placeholder="e.g., Honors, AP, Remedial"
            />
          </div>

          {/* Core Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gradeLevel">Grade Level</Label>
              <Input
                id="gradeLevel"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                placeholder={selectedCourseType ? `e.g., ${selectedCourseType.gradeRange.split('-')[0]}` : "e.g., 10"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="credits">Credits</Label>
              <Input
                id="credits"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                type="number"
                step="0.5"
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Course overview and goals"
              rows={3}
            />
          </div>

          {/* Advanced Settings Collapsible */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="w-full justify-between">
                <span>Advanced Settings</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4 p-4 border rounded-lg bg-muted/30">
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
            </CollapsibleContent>
          </Collapsible>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedCourseTypeKey}>
              {loading ? 'Creating...' : 'Create Course'}
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
