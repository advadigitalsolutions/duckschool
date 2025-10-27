import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';
import { useAvailableFrameworks } from '@/hooks/useAvailableFrameworks';
import { DeleteCourseDialog } from '@/components/DeleteCourseDialog';
import { Separator } from '@/components/ui/separator';

interface CourseSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  currentGradeLevel?: string;
  currentSubject?: string;
  userRole?: 'parent' | 'student';
  onUpdate: () => void;
  onDelete?: () => void;
}

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

const GRADE_LEVELS = [
  'Preschool',
  'Pre-K',
  'Kindergarten',
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
  'Graduate School',
  'Post Graduate',
  'Rogue Brainiac',
  'Educator'
];

export function CourseSettingsDialog({
  open,
  onOpenChange,
  courseId,
  currentGradeLevel,
  currentSubject,
  userRole,
  onUpdate,
  onDelete
}: CourseSettingsDialogProps) {
  const { frameworks, loading: frameworksLoading } = useAvailableFrameworks();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gradeLevel, setGradeLevel] = useState(currentGradeLevel || '');
  const [framework, setFramework] = useState('');
  const [originalFramework, setOriginalFramework] = useState('');
  const [pedagogy, setPedagogy] = useState('eclectic');
  const [targetCompletionDate, setTargetCompletionDate] = useState('');
  const [weeklyMinutes, setWeeklyMinutes] = useState('');
  const [goals, setGoals] = useState('');
  const [customFrameworkName, setCustomFrameworkName] = useState('');
  const [approachOverride, setApproachOverride] = useState('');
  const [showFrameworkWarning, setShowFrameworkWarning] = useState(false);
  const [existingCurriculumCount, setExistingCurriculumCount] = useState(0);
  const [remapping, setRemapping] = useState(false);
  const [bridgeMode, setBridgeMode] = useState(false);
  const [diagnosticBaseline, setDiagnosticBaseline] = useState('');
  const [prerequisiteBands, setPrerequisiteBands] = useState<string[]>([]);
  const [courseData, setCourseData] = useState<any>(null);

  // Load existing course data when dialog opens
  useEffect(() => {
    if (open && courseId) {
      loadCourseData();
    }
  }, [open, courseId]);

  const loadCourseData = async () => {
    setLoading(true);
    try {
      const { data: course, error } = await supabase
        .from('courses')
        .select('grade_level, standards_scope, pacing_config, goals, description')
        .eq('id', courseId)
        .single();

      if (error) throw error;

      if (course) {
        setCourseData(course);
        setGradeLevel(course.grade_level || currentGradeLevel || '');
        setGoals(course.goals || '');
        
        // Extract approach override from description field
        const description = course.description || '';
        if (description.startsWith('APPROACH_OVERRIDE:')) {
          const override = description.replace('APPROACH_OVERRIDE:', '').trim();
          setApproachOverride(override);
        }
        
        // Extract framework and bridge mode settings from standards_scope or pacing_config
        const pacingConfig = course.pacing_config as any;
        let extractedFramework = '';
        
        if (Array.isArray(course.standards_scope) && course.standards_scope.length > 0) {
          const scopeItem = course.standards_scope[0];
          if (typeof scopeItem === 'object' && scopeItem !== null && 'framework' in scopeItem) {
            const scopeFramework = (scopeItem as any).framework;
            if (typeof scopeFramework === 'string') {
              extractedFramework = scopeFramework;
            }
            
            // Extract bridge mode settings
            if ((scopeItem as any).bridge_mode === true) {
              setBridgeMode(true);
              setPrerequisiteBands((scopeItem as any).prerequisite_bands || []);
              setDiagnosticBaseline((scopeItem as any).diagnostic_baseline || '');
            }
          }
        }
        
        // Fallback to pacing_config if not in standards_scope
        if (!extractedFramework && pacingConfig?.framework) {
          extractedFramework = pacingConfig.framework;
        }
        
        setFramework(extractedFramework || 'CA-CCSS');
        setOriginalFramework(extractedFramework || 'CA-CCSS');

        // Extract pacing config
        if (pacingConfig) {
          if (pacingConfig.pedagogy) {
            setPedagogy(pacingConfig.pedagogy);
          }
          if (pacingConfig.target_completion_date) {
            setTargetCompletionDate(pacingConfig.target_completion_date);
          }
          if (pacingConfig.weekly_minutes) {
            setWeeklyMinutes(pacingConfig.weekly_minutes.toString());
          }
        }
      }
    } catch (error) {
      console.error('Error loading course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!gradeLevel || !framework) {
      toast.error('Please select both grade level and regional framework');
      return;
    }

    if (framework === 'CUSTOM' && !goals) {
      toast.error('Please provide course goals for custom framework');
      return;
    }

    try {
      // Check if framework changed and there's existing curriculum
      const frameworkChanged = framework !== originalFramework;
      
      if (frameworkChanged) {
        const { data: existingCurriculum } = await supabase
          .from('curriculum_items')
          .select('id, standards')
          .eq('course_id', courseId)
          .not('standards', 'is', null);
        
        if (existingCurriculum && existingCurriculum.length > 0) {
          setExistingCurriculumCount(existingCurriculum.length);
          setShowFrameworkWarning(true);
          return;
        }
      }
      
      // Proceed with save if no framework change or no existing curriculum
      await performSave();
    } catch (error: any) {
      console.error('Error in handleSave:', error);
      toast.error('Failed to save settings');
    }
  };

  const performSave = async () => {
    setSaving(true);
    try {
      // If switching to CUSTOM framework, generate milestones first
      if (framework === 'CUSTOM' && goals) {
        toast.info('🤖 AI is generating custom learning milestones...');
        
        const { data: generateResult, error: generateError } = await supabase.functions.invoke(
          'generate-course-standards',
          {
            body: {
              courseId,
              goals,
              subject: currentSubject,
              gradeLevel
            }
          }
        );
        
        if (generateError) {
          console.error('Error generating standards:', generateError);
          toast.error('Failed to generate learning milestones');
          setSaving(false);
          return;
        }
        
        toast.success(`✨ Generated ${generateResult.count} learning milestones`);
        // The edge function already updated standards_scope, so we don't need to include it here
      }

      const updates: any = {
        grade_level: gradeLevel,
        goals: goals || null,
        description: approachOverride ? `APPROACH_OVERRIDE:${approachOverride}` : null,
      };

      // Only set standards_scope if NOT custom (custom was handled by edge function)
      if (framework !== 'CUSTOM') {
        const scopeConfig: any = { 
          framework,
          subject: currentSubject,
          grade_band: gradeLevel
        };
        
        // Include bridge mode settings if enabled
        if (bridgeMode) {
          scopeConfig.bridge_mode = true;
          scopeConfig.prerequisite_bands = prerequisiteBands;
          scopeConfig.diagnostic_baseline = diagnosticBaseline;
        }
        
        updates.standards_scope = [scopeConfig];
      }

      // Always update pacing_config with framework
      updates.pacing_config = {
        framework,
        pedagogy,
        ...(targetCompletionDate && { target_completion_date: targetCompletionDate }),
        ...(weeklyMinutes && { weekly_minutes: parseInt(weeklyMinutes) }),
      };

      const { error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', courseId);

      if (error) throw error;

      toast.success('Course settings updated successfully');
      setOriginalFramework(framework);

      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course settings');
    } finally {
      setSaving(false);
    }
  };

  const handleRemapAndSwitch = async () => {
    try {
      setShowFrameworkWarning(false);
      setRemapping(true);
      toast.info('🤖 AI is analyzing and remapping your curriculum to the new framework...');
      
      // Fetch full curriculum data
      const { data: curriculumItems, error: fetchError } = await supabase
        .from('curriculum_items')
        .select('id, title, body, standards')
        .eq('course_id', courseId);
      
      if (fetchError) throw fetchError;
      
      // Call remap edge function
      const { data: remapResult, error: remapError } = await supabase.functions.invoke(
        'remap-curriculum-standards',
        {
          body: {
            courseId,
            oldFramework: originalFramework,
            newFramework: framework,
            curriculumItems: curriculumItems || []
          }
        }
      );
      
      if (remapError) {
        console.error('Remapping error:', remapError);
        toast.error('AI remapping failed. Framework not changed.');
        setRemapping(false);
        return;
      }
      
      toast.success(`✨ Remapped ${remapResult.remappedCount} of ${remapResult.total} lessons to new framework`);
      
      if (remapResult.failedCount > 0) {
        toast.warning(`⚠️ ${remapResult.failedCount} lessons could not be remapped automatically`);
      }
      
      // Reset progress tracking
      await resetProgressTracking();
      
      // Now proceed with framework update
      await performSave();
    } catch (error: any) {
      console.error('Error in remap and switch:', error);
      toast.error('Failed to remap curriculum');
    } finally {
      setRemapping(false);
    }
  };

  const handleSwitchOnly = async () => {
    try {
      setShowFrameworkWarning(false);
      toast.info('Switching framework without remapping...');
      
      // Reset progress tracking
      await resetProgressTracking();
      
      // Proceed with framework update
      await performSave();
    } catch (error: any) {
      console.error('Error in switch only:', error);
      toast.error('Failed to switch framework');
    }
  };

  const resetProgressTracking = async () => {
    try {
      // First get curriculum items for this course
      const { data: curriculumItems } = await supabase
        .from('curriculum_items')
        .select('id')
        .eq('course_id', courseId);
      
      if (curriculumItems && curriculumItems.length > 0) {
        const curriculumItemIds = curriculumItems.map(ci => ci.id);
        
        // Then get assignments for these curriculum items
        const { data: assignments } = await supabase
          .from('assignments')
          .select('id')
          .in('curriculum_item_id', curriculumItemIds);
        
        // Delete progress events for these assignments
        if (assignments && assignments.length > 0) {
          const assignmentIds = assignments.map(a => a.id);
          await supabase
            .from('progress_events')
            .delete()
            .in('assignment_id', assignmentIds);
        }
      }
      
      // Delete progress gaps
      await supabase
        .from('progress_gaps')
        .delete()
        .eq('course_id', courseId);
      
      console.log('Progress tracking reset completed');
    } catch (error) {
      console.error('Error resetting progress tracking:', error);
      // Don't throw - this is not critical
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configure Course Settings</DialogTitle>
            <DialogDescription>
              Set the regional standards and pacing requirements for this course. For custom frameworks, AI will generate personalized learning milestones from your course goals.
            </DialogDescription>
          </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="grade-level">Grade Level *</Label>
            <Select value={gradeLevel} onValueChange={setGradeLevel}>
              <SelectTrigger id="grade-level">
                <SelectValue placeholder="Select grade level" />
              </SelectTrigger>
              <SelectContent>
                {GRADE_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {bridgeMode && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                <div className="mt-0.5">🎯</div>
                <div className="flex-1 space-y-1">
                  <p className="font-semibold text-sm text-amber-900 dark:text-amber-100">
                    Prerequisite Bridge Mode Active
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Based on diagnostic results, this course will start with foundational topics from grades {prerequisiteBands.join(', ')} before progressing to {gradeLevel} content.
                  </p>
                  <div className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                    <strong>Diagnostic baseline:</strong> Grade {diagnosticBaseline}<br />
                    <strong>Target level:</strong> Grade {gradeLevel}<br />
                    <strong>Strategy:</strong> Master prerequisites → bridge to course content
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="pedagogy">Educational Pedagogy</Label>
            <Select value={pedagogy} onValueChange={setPedagogy}>
              <SelectTrigger id="pedagogy">
                <SelectValue placeholder="Select pedagogy" />
              </SelectTrigger>
              <SelectContent>
                {PEDAGOGIES.map((ped) => (
                  <SelectItem key={ped.value} value={ped.value}>
                    {ped.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Influences how AI generates curriculum and assignments
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goals">
              Course Goals {framework === 'CUSTOM' ? '(Required for Custom Framework)' : '(Optional)'}
            </Label>
            <textarea
              id="goals"
              className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="e.g., Achieve B2 fluency in Spanish, Master AP Calculus concepts, Develop strong essay writing skills"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              {framework === 'CUSTOM' 
                ? '🤖 AI will automatically generate trackable learning milestones from your goals'
                : 'Used for AI curriculum generation when regional standards aren\'t available'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="approach-override">Assignment Style Preference (Optional)</Label>
            <textarea
              id="approach-override"
              className="w-full min-h-[60px] px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="e.g., Use Khan Academy as the main resource, keep assignments computer-based with no physical materials"
              value={approachOverride}
              onChange={(e) => setApproachOverride(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              🎯 Override AI's learning style suggestions. Specify your preferred resources and approach (e.g., "use Khan Academy", "computer-based only", "no props or costumes"). This will take priority over all other learning style directives for this course.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="framework">Regional Framework *</Label>
            <Select value={framework} onValueChange={setFramework} disabled={frameworksLoading}>
              <SelectTrigger id="framework">
                <SelectValue placeholder={frameworksLoading ? "Loading frameworks..." : "Select regional standards"} />
              </SelectTrigger>
              <SelectContent>
                {frameworks.map((fw) => (
                  <SelectItem key={fw.value} value={fw.value}>
                    {fw.label}
                    {fw.standardCount > 0 && ` (${fw.standardCount} standards)`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {framework === 'CUSTOM' && (
              <div className="p-3 mt-2 bg-primary/5 border border-primary/20 rounded-md">
                <p className="text-sm font-medium mb-1">✨ Custom Framework Features:</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>AI generates 12-20 learning milestones from your goals</li>
                  <li>Full progress tracking against milestones</li>
                  <li>Target date compliance monitoring</li>
                  <li>AI curriculum generation targets uncovered milestones</li>
                </ul>
              </div>
            )}
          </div>

          {framework === 'CUSTOM' && (
            <div className="space-y-2">
              <Label htmlFor="custom-framework-name">Custom Framework Name (Optional)</Label>
              <Input
                id="custom-framework-name"
                placeholder={`Custom ${currentSubject} Framework`}
                value={customFrameworkName}
                onChange={(e) => setCustomFrameworkName(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Give your custom framework a memorable name
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="target-date">Target Completion Date (Optional)</Label>
            <Input
              id="target-date"
              type="date"
              value={targetCompletionDate}
              onChange={(e) => setTargetCompletionDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weekly-minutes">Weekly Study Minutes (Optional)</Label>
            <Input
              id="weekly-minutes"
              type="number"
              min="0"
              placeholder="e.g., 300"
              value={weeklyMinutes}
              onChange={(e) => setWeeklyMinutes(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Helps calculate recommended daily study time
            </p>
          </div>
        </div>
        )}

        <div className="flex justify-between items-center gap-2">
          <div>
            {courseData && userRole === 'student' && (
              <AlertDialog>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" asChild>
                  <AlertDialogTrigger>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Course
                  </AlertDialogTrigger>
                </Button>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Educator Permission Required</AlertDialogTitle>
                    <AlertDialogDescription>
                      Only educators can delete courses. Please ask your educator to delete this course for you.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogAction>OK</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {courseData && userRole !== 'student' && (
              <DeleteCourseDialog
                course={courseData}
                onCourseDeleted={() => {
                  onOpenChange(false);
                  setTimeout(() => {
                    onDelete?.();
                  }, 300);
                }}
                trigger={
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Course
                  </Button>
                }
              />
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showFrameworkWarning} onOpenChange={setShowFrameworkWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>⚠️ Switch Framework & Standards?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div>
              <p className="font-medium">You're changing from:</p>
              <p className="text-sm">• {originalFramework} → {framework}</p>
            </div>
            
            <div>
              <p className="font-medium">This will affect:</p>
              <p className="text-sm">• {existingCurriculumCount} lesson{existingCurriculumCount !== 1 ? 's' : ''} with standards references</p>
              <p className="text-sm">• All progress tracking data</p>
            </div>
            
            <div className="bg-muted p-3 rounded-md">
              <p className="font-medium text-sm mb-1">⚙️ AI Remapping (Recommended)</p>
              <p className="text-sm">Let AI analyze your lessons and map them to equivalent standards in the new framework. Takes 1-2 minutes.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="outline" onClick={handleSwitchOnly} disabled={remapping}>
            Switch Only
          </Button>
          <AlertDialogAction onClick={handleRemapAndSwitch} disabled={remapping}>
            {remapping ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Remapping...
              </>
            ) : (
              'Switch & Remap with AI'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
