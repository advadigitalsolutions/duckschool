import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, TrendingUp, TrendingDown, Minus, AlertTriangle, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { useCoursePacing } from '@/hooks/useCoursePacing';
import { CourseMasteryChart } from './CourseMasteryChart';
import { CourseProgressCharts } from './CourseProgressCharts';
import { CourseConfigurationPrompt } from './CourseConfigurationPrompt';
import { CourseSettingsDialog } from './CourseSettingsDialog';
import { StandardsCoverageDashboard } from './StandardsCoverageDashboard';
import { cn } from '@/lib/utils';

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
  const { loading, metrics, timeBySubject, standardsCoverage, refreshMetrics } = useCoursePacing(
    courseId,
    targetDate
  );

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
      if (framework === 'CA-CCSS') return 'California Common Core State Standards';
      if (framework === 'CCSS') return 'Common Core State Standards';
      if (framework === 'TX-TEKS') return 'Texas Essential Knowledge and Skills';
      if (framework === 'FL-BEST') return 'Florida B.E.S.T. Standards';
      if (framework === 'NY-CCLS') return 'New York Common Core Learning Standards';
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
        <Button variant="outline" onClick={() => setSettingsOpen(true)}>
          <Settings className="mr-2 h-4 w-4" />
          Edit Settings
        </Button>
      </div>

      {/* Configuration Prompt if needed */}
      {metrics.needsConfiguration && (
        <CourseConfigurationPrompt
          missingData={metrics.missingData}
          courseId={courseId}
          studentId={studentId}
          gradeLevel={gradeLevel}
          subject={courseSubject}
          onUpdate={refreshMetrics}
        />
      )}

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
                <span className="font-medium">Work Completed (Standards-Based)</span>
                <span className="font-bold">{metrics.progressPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.progressPercentage} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{hoursCompleted}h {minutesCompleted}m completed</span>
                <span>{totalHours}h {totalMinutes}m required</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Curriculum Created</span>
                <span className="font-bold">{((metrics as any).curriculumCoveragePercentage || 0).toFixed(1)}%</span>
              </div>
              <Progress value={(metrics as any).curriculumCoveragePercentage || 0} className="h-3 opacity-60" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{curriculumHours}h {curriculumMinutes}m created</span>
                {(metrics as any).needsMoreCurriculum && (
                  <span className="text-amber-600 dark:text-amber-500">⚠️ Need more curriculum</span>
                )}
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground mb-1">Average Pace</div>
              <div className="text-2xl font-bold">
                {metrics.averageMinutesPerDay > 0 
                  ? `${Math.round(metrics.averageMinutesPerDay)} min/day`
                  : '—'
                }
              </div>
              {metrics.averageMinutesPerDay === 0 && !metrics.needsConfiguration && (
                <div className="text-xs text-muted-foreground mt-1">No activity yet</div>
              )}
            </div>
            
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground mb-1">Projected Completion</div>
              <div className="text-2xl font-bold">
                {metrics.projectedCompletionDate 
                  ? format(metrics.projectedCompletionDate, 'MMM dd, yyyy')
                  : 'Unknown'
                }
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground mb-1">Days Remaining</div>
              <div className="text-2xl font-bold">
                {metrics.daysRemaining !== null ? metrics.daysRemaining : '—'}
              </div>
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
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={targetDate}
                  onSelect={setTargetDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
            
            {targetDate && (
              <Button variant="ghost" onClick={() => setTargetDate(undefined)}>
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

      {/* Standards Coverage Dashboard */}
      {!metrics?.needsConfiguration && metrics?.framework && (
        <StandardsCoverageDashboard
          courseId={courseId}
          framework={metrics.framework}
          gradeLevel={gradeLevel || '10'}
          subject={courseSubject}
        />
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
    </div>
  );
}
