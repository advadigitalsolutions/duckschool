import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Info } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const FRAMEWORKS = [
  { value: 'CA-CCSS', label: 'California Common Core' },
  { value: 'CCSS', label: 'Common Core State Standards' },
  { value: 'TX-TEKS', label: 'Texas TEKS' },
  { value: 'FL-BEST', label: 'Florida B.E.S.T.' },
  { value: 'NY-CCLS', label: 'New York CCLS' },
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

const GRADE_LEVELS = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

interface GlobalCourseSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  onUpdate?: () => void;
}

interface CourseMinutes {
  [courseId: string]: number;
}

export function GlobalCourseSettingsDialog({ open, onOpenChange, studentId, onUpdate }: GlobalCourseSettingsDialogProps) {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  
  // Global settings
  const [gradeLevel, setGradeLevel] = useState('');
  const [framework, setFramework] = useState('CA-CCSS');
  const [pedagogy, setPedagogy] = useState('eclectic');
  const [targetCompletionDate, setTargetCompletionDate] = useState<Date | undefined>();
  
  // Weekly minutes settings
  const [useIndividual, setUseIndividual] = useState(false);
  const [totalWeeklyMinutes, setTotalWeeklyMinutes] = useState<number>(300);
  const [courseMinutes, setCourseMinutes] = useState<CourseMinutes>({});

  useEffect(() => {
    if (open && studentId) {
      loadCoursesData();
    }
  }, [open, studentId]);

  const loadCoursesData = async () => {
    setLoading(true);
    try {
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select('*')
        .eq('student_id', studentId)
        .eq('archived', false);

      if (error) throw error;

      setCourses(coursesData || []);

      // Load existing settings from first course (if any have them)
      if (coursesData && coursesData.length > 0) {
        const firstCourse = coursesData[0];
        const pacingConfig = firstCourse.pacing_config as any || {};
        
        if (firstCourse.grade_level) {
          setGradeLevel(firstCourse.grade_level);
        }
        if (firstCourse.standards_scope?.[0]?.framework || pacingConfig.framework) {
          setFramework(firstCourse.standards_scope?.[0]?.framework || pacingConfig.framework);
        }
        if (pacingConfig.pedagogy) {
          setPedagogy(pacingConfig.pedagogy);
        }
        if (pacingConfig.target_completion_date) {
          setTargetCompletionDate(new Date(pacingConfig.target_completion_date));
        }

        // Initialize course minutes
        const minutes: CourseMinutes = {};
        let hasIndividualSettings = false;
        
        coursesData.forEach(course => {
          const config = course.pacing_config as any || {};
          if (config.weekly_minutes) {
            minutes[course.id] = config.weekly_minutes;
            hasIndividualSettings = true;
          } else {
            minutes[course.id] = 300 / coursesData.length; // Default split
          }
        });
        
        setCourseMinutes(minutes);
        setUseIndividual(hasIndividualSettings);
      }
    } catch (error: any) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleTotalMinutesChange = (value: number) => {
    setTotalWeeklyMinutes(value);
    if (!useIndividual && courses.length > 0) {
      // Distribute evenly
      const perCourse = value / courses.length;
      const newMinutes: CourseMinutes = {};
      courses.forEach(course => {
        newMinutes[course.id] = perCourse;
      });
      setCourseMinutes(newMinutes);
    }
  };

  const handleCourseMinutesChange = (courseId: string, value: number) => {
    setCourseMinutes(prev => ({
      ...prev,
      [courseId]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update all courses with the same settings
      const updates = courses.map(course => {
        const pacingConfig = {
          framework,
          pedagogy,
          target_completion_date: targetCompletionDate?.toISOString(),
          weekly_minutes: courseMinutes[course.id] || totalWeeklyMinutes / courses.length,
        };

        // Also update standards_scope to include framework
        const standardsScope = [
          {
            framework,
            subject: course.subject,
            grade_band: gradeLevel,
          }
        ];

        return supabase
          .from('courses')
          .update({
            grade_level: gradeLevel,
            pacing_config: pacingConfig,
            standards_scope: standardsScope,
          })
          .eq('id', course.id);
      });

      const results = await Promise.all(updates);
      
      const hasErrors = results.some(result => result.error);
      if (hasErrors) {
        throw new Error('Failed to update some courses');
      }

      toast.success('All courses updated successfully');
      onUpdate?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const totalIndividualMinutes = Object.values(courseMinutes).reduce((sum, val) => sum + val, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure All Courses</DialogTitle>
          <DialogDescription>
            Apply settings to all {courses.length} course{courses.length !== 1 ? 's' : ''} for this student
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Grade Level */}
          <div className="space-y-2">
            <Label>Grade Level</Label>
            <Select value={gradeLevel} onValueChange={setGradeLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select grade level" />
              </SelectTrigger>
              <SelectContent>
                {GRADE_LEVELS.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Standards Framework */}
          <div className="space-y-2">
            <Label>Standards Framework</Label>
            <Select value={framework} onValueChange={setFramework}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FRAMEWORKS.map(fw => (
                  <SelectItem key={fw.value} value={fw.value}>{fw.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pedagogy */}
          <div className="space-y-2">
            <Label>Educational Pedagogy</Label>
            <Select value={pedagogy} onValueChange={setPedagogy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PEDAGOGIES.map(ped => (
                  <SelectItem key={ped.value} value={ped.value}>{ped.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Influences how AI generates curriculum and assignments
            </p>
          </div>

          {/* Target Completion Date */}
          <div className="space-y-2">
            <Label>Target Completion Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !targetCompletionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {targetCompletionDate ? format(targetCompletionDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={targetCompletionDate}
                  onSelect={setTargetCompletionDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Separator />

          {/* Weekly Study Minutes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Weekly Study Minutes</Label>
                <p className="text-sm text-muted-foreground">Configure time allocation per subject</p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="individual-mode" className="text-sm">Individual</Label>
                <Switch
                  id="individual-mode"
                  checked={useIndividual}
                  onCheckedChange={setUseIndividual}
                />
              </div>
            </div>

            {!useIndividual ? (
              <div className="space-y-2">
                <Label>Total Weekly Minutes (Split Evenly)</Label>
                <Input
                  type="number"
                  min="0"
                  step="30"
                  value={totalWeeklyMinutes}
                  onChange={(e) => handleTotalMinutesChange(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  {courses.length > 0 && `${Math.round(totalWeeklyMinutes / courses.length)} minutes per course`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4" />
                  <span>Set individual weekly minutes for each course</span>
                </div>
                {courses.map(course => (
                  <div key={course.id} className="flex items-center gap-3">
                    <Label className="min-w-[200px] text-sm">{course.title}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="30"
                      value={courseMinutes[course.id] || 0}
                      onChange={(e) => handleCourseMinutesChange(course.id, Number(e.target.value))}
                      className="max-w-[150px]"
                    />
                    <span className="text-sm text-muted-foreground">min/week</span>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium">
                    Total: {Math.round(totalIndividualMinutes)} minutes/week 
                    ({(totalIndividualMinutes / 60).toFixed(1)} hours/week)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !gradeLevel}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
