import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CourseSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  currentGradeLevel?: string;
  currentSubject?: string;
  onUpdate: () => void;
}

const FRAMEWORKS = [
  { value: 'CA-CCSS', label: 'California Common Core State Standards' },
  { value: 'CCSS', label: 'Common Core State Standards' },
  { value: 'TX-TEKS', label: 'Texas Essential Knowledge and Skills' },
  { value: 'FL-BEST', label: 'Florida B.E.S.T. Standards' },
  { value: 'NY-CCLS', label: 'New York Common Core Learning Standards' },
];

const GRADE_LEVELS = [
  'Pre-K', 'Kindergarten', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
];

export function CourseSettingsDialog({
  open,
  onOpenChange,
  courseId,
  currentGradeLevel,
  currentSubject,
  onUpdate
}: CourseSettingsDialogProps) {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gradeLevel, setGradeLevel] = useState(currentGradeLevel || '');
  const [framework, setFramework] = useState('');
  const [targetCompletionDate, setTargetCompletionDate] = useState('');
  const [weeklyMinutes, setWeeklyMinutes] = useState('');

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
        .select('grade_level, standards_scope, pacing_config')
        .eq('id', courseId)
        .single();

      if (error) throw error;

      if (course) {
        setGradeLevel(course.grade_level || currentGradeLevel || '');
        
        // Extract framework from standards_scope or pacing_config
        const pacingConfig = course.pacing_config as any;
        let extractedFramework = '';
        
        if (Array.isArray(course.standards_scope) && course.standards_scope.length > 0) {
          const scopeItem = course.standards_scope[0];
          if (typeof scopeItem === 'object' && scopeItem !== null && 'framework' in scopeItem) {
            const scopeFramework = (scopeItem as any).framework;
            if (typeof scopeFramework === 'string') {
              extractedFramework = scopeFramework;
            }
          }
        }
        
        // Fallback to pacing_config if not in standards_scope
        if (!extractedFramework && pacingConfig?.framework) {
          extractedFramework = pacingConfig.framework;
        }
        
        setFramework(extractedFramework || 'CA-CCSS');

        // Extract pacing config
        if (pacingConfig) {
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

    setSaving(true);
    try {
      const updates: any = {
        grade_level: gradeLevel,
        standards_scope: [{ 
          framework,
          subject: currentSubject,
          grade_band: gradeLevel
        }],
      };

      // Always update pacing_config with framework
      updates.pacing_config = {
        framework,
        ...(targetCompletionDate && { target_completion_date: targetCompletionDate }),
        ...(weeklyMinutes && { weekly_minutes: parseInt(weeklyMinutes) }),
      };

      const { error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', courseId);

      if (error) throw error;

      toast.success('Course settings updated successfully');
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configure Course Settings</DialogTitle>
          <DialogDescription>
            Set the regional standards and pacing requirements for this course. This information helps provide accurate progress tracking.
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

          <div className="space-y-2">
            <Label htmlFor="framework">Regional Framework *</Label>
            <Select value={framework} onValueChange={setFramework}>
              <SelectTrigger id="framework">
                <SelectValue placeholder="Select regional standards" />
              </SelectTrigger>
              <SelectContent>
                {FRAMEWORKS.map((fw) => (
                  <SelectItem key={fw.value} value={fw.value}>
                    {fw.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
