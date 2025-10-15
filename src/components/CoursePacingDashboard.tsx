import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, TrendingUp, TrendingDown, Minus, AlertTriangle, Settings, Sparkles, Info } from 'lucide-react';
import { format } from 'date-fns';
import { useCoursePacing } from '@/hooks/useCoursePacing';
import { CourseMasteryChart } from './CourseMasteryChart';
import { CourseProgressCharts } from './CourseProgressCharts';
import { CourseSettingsDialog } from './CourseSettingsDialog';
import { CurriculumGenerationDialog } from './CurriculumGenerationDialog';
import { StandardsCoverageDashboard } from './StandardsCoverageDashboard';
import { CustomMilestonesDashboard } from './CustomMilestonesDashboard';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getFrameworkDisplayName } from '@/hooks/useAvailableFrameworks';

interface CoursePacingDashboardProps {
  courseId: string;
  courseTitle: string;
  courseSubject: string;
  studentId: string;
  gradeLevel?: string;
}

export function CoursePacingDashboard({ courseId, courseTitle, courseSubject, studentId, gradeLevel }: CoursePacingDashboardProps) {
  const [targetDate, setTargetDate] = useState<Date | undefined>();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [generationOpen, setGenerationOpen] = useState(false);
  const { loading, metrics, timeBySubject, standardsCoverage, refreshMetrics } = useCoursePacing(
    courseId,
    targetDate
  );

  // Load persisted target date from pacing_config.target_completion_date
  useEffect(() => {
    const loadTargetDate = async () => {
      const { data } = await supabase
        .from('courses')
        .select('pacing_config')
        .eq('id', courseId)
        .single();
      
      if (data?.pacing_config && typeof data.pacing_config === 'object' && 'target_completion_date' in data.pacing_config) {
        const targetDateStr = (data.pacing_config as any).target_completion_date;
        if (targetDateStr) {
          setTargetDate(new Date(targetDateStr));
        }
      }
    };
    loadTargetDate();
  }, [courseId]);

  // Save target date to pacing_config when it changes
  const handleTargetDateChange = async (date: Date | undefined) => {
    setTargetDate(date);
    
    // Get current pacing_config
    const { data: courseData } = await supabase
      .from('courses')
      .select('pacing_config')
      .eq('id', courseId)
      .single();
    
    const currentConfig = (courseData?.pacing_config as any) || {};
    const updatedConfig = {
      ...currentConfig,
      target_completion_date: date ? format(date, 'yyyy-MM-dd') : null
    };
    
    const { error } = await supabase
      .from('courses')
      .update({ pacing_config: updatedConfig })
      .eq('id', courseId);
    
    if (error) {
      toast.error('Failed to save target date');
      console.error('Error saving target date:', error);
    } else {
      toast.success('Target date saved');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center text-muted-foreground p-8">
        Unable to load pacing data
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (metrics.onTrackStatus) {
      case 'ahead':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'behind':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      case 'on-track':
        return <Minus className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'ahead': 'default',
      'on-track': 'secondary',
      'behind': 'destructive',
      'unknown': 'outline'
    };
    return (
      <Badge variant={variants[metrics.onTrackStatus]}>
        {metrics.onTrackStatus === 'ahead' && 'Ahead of Schedule'}
        {metrics.onTrackStatus === 'on-track' && 'On Track'}
        {metrics.onTrackStatus === 'behind' && 'Behind Schedule'}
        {metrics.onTrackStatus === 'unknown' && 'Unknown'}
      </Badge>
    );
  };

  const hoursCompleted = Math.floor(metrics.completedMinutes / 60);
  const minutesCompleted = Math.round(metrics.completedMinutes % 60);
  const totalHours = Math.floor((metrics as any).totalMinutes / 60);
  const totalMinutes = Math.round((metrics as any).totalMinutes % 60);
  
  const curriculumHours = Math.floor(((metrics as any).curriculumCreatedMinutes || 0) / 60);
  const curriculumMinutes = Math.round(((metrics as any).curriculumCreatedMinutes || 0) % 60);

  const getFrameworkName = () => {
    if (!metrics?.needsConfiguration && metrics) {
      const framework = (metrics as any).framework;
      return getFrameworkDisplayName(framework);
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{courseTitle}</h1>
          <p className="text-muted-foreground">{courseSubject} - Course Progress Dashboard</p>
          {getFrameworkName() && (
            <p className="text-sm text-muted-foreground mt-1">
              Framework: {getFrameworkName()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setGenerationOpen(true)}>
            <Sparkles className="mr-2 h-4 w-4" />
            AI Generate
          </Button>
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Edit Settings
          </Button>
        </div>
      </div>

      {/* Configuration Warning - Only show if truly broken */}
      {metrics.needsConfiguration && metrics.missingData.length > 0 && (
        <Card className="border-amber-500 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-amber-700 dark:text-amber-500">Configuration Incomplete</CardTitle>
            <CardDescription>
              Some settings need to be configured for accurate progress tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.missingData.map((item, index) => (
              <p key={index} className="text-sm text-muted-foreground">• {item}</p>
            ))}
            <Button variant="outline" onClick={() => setSettingsOpen(true)} className="mt-4">
              <Settings className="mr-2 h-4 w-4" />
              Configure Settings
            </Button>
          </CardContent>
        </Card>
      )}

      {/* How Calculations Work */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4" />
            How Progress is Calculated
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <span className="font-semibold">Total Required Hours:</span>{' '}
            <span className="text-muted-foreground">
              {(metrics as any)?.framework === 'CUSTOM' 
                ? 'Based on learning milestones from your course goals. Each milestone has an estimated time requirement.'
                : `Based on ${getFrameworkName()} official standards for ${courseSubject} at grade ${gradeLevel}. Each standard has an estimated time requirement.`
              }
            </span>
          </div>
          <div>
            <span className="font-semibold">Work Completed:</span>{' '}
            <span className="text-muted-foreground">
              Actual time spent on assignments (from student submissions), divided by total required hours.
            </span>
          </div>
          <div>
            <span className="font-semibold">Curriculum Built:</span>{' '}
            <span className="text-muted-foreground">
              Hours of curriculum you've created so far, divided by total required hours.
            </span>
          </div>
          <div>
            <span className="font-semibold">Average/Expected Pace:</span>{' '}
            <span className="text-muted-foreground">
              If student has worked: calculated from activity over the last 30 days. 
              If no work yet: shows your configured pacing goal from weekly minutes setting.
            </span>
          </div>
          <div>
            <span className="font-semibold">Recommended Daily Minutes:</span>{' '}
            <span className="text-muted-foreground">
              Remaining work divided by days until your target date. Updates as target date changes.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Overall Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Course Progress</CardTitle>
              <CardDescription>Overall completion and pacing</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              {getStatusBadge()}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bars */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">
                  {(metrics as any)?.framework === 'CUSTOM' ? 'Work Completed (Milestone-Based)' : 'Work Completed (Standards-Based)'}
                </span>
                <span className="font-bold">{metrics.progressPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.progressPercentage} variant="success" className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{hoursCompleted}h {minutesCompleted}m completed</span>
                <span>{totalHours}h {totalMinutes}m total required</span>
              </div>
              {(metrics as any)?.framework === 'CUSTOM' && (metrics as any).trackingMode === 'custom-milestones' && (
                <div className="text-xs text-muted-foreground mt-1">
                  💡 Based on AI-generated milestones
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Curriculum Built</span>
                <span className="font-bold">{((metrics as any).curriculumCoveragePercentage || 0).toFixed(1)}%</span>
              </div>
              <Progress value={(metrics as any).curriculumCoveragePercentage || 0} variant="success" className="h-3 opacity-60" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{curriculumHours}h {curriculumMinutes}m built so far</span>
                <span>{totalHours}h {totalMinutes}m total needed</span>
              </div>
              {((metrics as any).curriculumCoveragePercentage || 0) < 100 && totalHours > 0 && (
                <div className="text-xs text-amber-600 dark:text-amber-500 mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Build {(totalHours - curriculumHours).toFixed(0)}h more curriculum to cover all {(metrics as any)?.framework === 'CUSTOM' ? 'milestones' : 'standards'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground mb-1">
                {metrics.averageMinutesPerDay > 0 && (metrics as any).isConfiguredPace 
                  ? 'Expected Pace (Configured)'
                  : 'Average Pace (Last 30 Days)'
                }
              </div>
              <div className="text-2xl font-bold">
                {metrics.averageMinutesPerDay > 0 
                  ? `${Math.round(metrics.averageMinutesPerDay)} min/day`
                  : '—'
                }
              </div>
              {metrics.averageMinutesPerDay === 0 && !metrics.needsConfiguration && (
                <div className="text-xs text-muted-foreground mt-1">No activity yet</div>
              )}
              {(metrics as any).isConfiguredPace && (
                <div className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                  Based on your pacing goal. Actual student pace not yet available.
                </div>
              )}
            </div>
            
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground mb-1">
                Existing Work Est. Completion
              </div>
              <div className="text-2xl font-bold">
                {metrics.projectedCompletionDate 
                  ? format(metrics.projectedCompletionDate, 'MMM dd, yyyy')
                  : 'Unknown'
                }
              </div>
              {curriculumHours > 0 && curriculumHours < totalHours && (
                <div className="text-xs text-muted-foreground mt-1">
                  At current {Math.round(metrics.averageMinutesPerDay)} min/day pace
                </div>
              )}
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground mb-1">
                {targetDate ? 'Days Until Target' : 'Days to Complete'}
              </div>
              <div className="text-2xl font-bold">
                {metrics.daysRemaining !== null ? metrics.daysRemaining : '—'}
              </div>
              {targetDate && metrics.daysRemaining && (
                <div className="text-xs text-muted-foreground mt-1">
                  Target: {format(targetDate, 'MMM dd, yyyy')}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target Date & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Pacing Recommendations</CardTitle>
          <CardDescription>Adjust your target date to see recommended daily effort</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !targetDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {targetDate ? format(targetDate, "PPP") : <span>Pick a target date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={targetDate}
                  onSelect={handleTargetDateChange}
                  initialFocus
                  disabled={(date) => date < new Date()}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            
            {targetDate && (
              <Button variant="ghost" onClick={() => handleTargetDateChange(undefined)}>
                Clear
              </Button>
            )}
          </div>

          {targetDate && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="font-semibold">
                To complete by {format(targetDate, 'MMM dd, yyyy')}:
              </div>
              <div className="text-2xl font-bold text-primary">
                {Math.round(metrics.recommendedDailyMinutes)} minutes per day
              </div>
              <div className="text-sm text-muted-foreground">
                ({(metrics.recommendedDailyMinutes / 60).toFixed(1)} hours per day)
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mastery Chart */}
      <CourseMasteryChart masteryData={metrics.masteryData} />

      {/* Progress Charts */}
      <CourseProgressCharts 
        timeBySubject={timeBySubject}
        standardsCoverage={standardsCoverage}
      />

      {/* Standards/Milestones Dashboard */}
      {!metrics?.needsConfiguration && metrics?.framework && (
        <>
          {metrics.framework === 'CUSTOM' ? (
            <CustomMilestonesDashboard courseId={courseId} />
          ) : (
            <StandardsCoverageDashboard
              courseId={courseId}
              framework={metrics.framework}
              gradeLevel={gradeLevel || '10'}
              subject={courseSubject}
            />
          )}
        </>
      )}

      {/* Settings Dialog */}
      <CourseSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        courseId={courseId}
        currentGradeLevel={gradeLevel}
        currentSubject={courseSubject}
        onUpdate={refreshMetrics}
      />

      {/* Curriculum Generation Dialog */}
      <CurriculumGenerationDialog
        open={generationOpen}
        onOpenChange={setGenerationOpen}
        courseId={courseId}
        courseTitle={courseTitle}
        studentId={studentId}
        onGenerated={refreshMetrics}
      />
    </div>
  );
}
