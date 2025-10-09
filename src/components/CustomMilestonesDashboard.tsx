import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Circle, AlertCircle, Target } from 'lucide-react';

interface Milestone {
  code: string;
  text: string;
  covered: boolean;
  estimatedHours: number;
  curriculumHours: number;
  completedHours: number;
}

interface CustomMilestonesDashboardProps {
  courseId: string;
}

export function CustomMilestonesDashboard({ courseId }: CustomMilestonesDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [allMilestones, setAllMilestones] = useState<Milestone[]>([]);
  const [coveredMilestones, setCoveredMilestones] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadMilestonesCoverage();
  }, [courseId]);

  const loadMilestonesCoverage = async () => {
    setLoading(true);
    try {
      // Get course with custom standards
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('standards_scope, goals')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      const customStandards = course?.standards_scope?.[0]?.custom_standards;
      
      if (!customStandards || customStandards.length === 0) {
        setLoading(false);
        return;
      }

      // Get curriculum items with their standards, estimated minutes, and check completion
      const { data: curriculumData, error: curriculumError } = await supabase
        .from('curriculum_items')
        .select(`
          id,
          standards,
          est_minutes,
          assignments (
            id,
            status,
            submissions (
              id,
              student_id,
              time_spent_seconds
            )
          )
        `)
        .eq('course_id', courseId);

      if (curriculumError) throw curriculumError;

      // Get grades for assignments in this course
      const assignmentIds = curriculumData?.flatMap(item => 
        item.assignments?.map((a: any) => a.id) || []
      ) || [];

      const { data: gradesData } = await supabase
        .from('grades')
        .select('assignment_id, score')
        .in('assignment_id', assignmentIds);

      if (curriculumError) throw curriculumError;

      // Calculate hours per milestone
      const milestonesMap = new Map<string, {
        estimatedHours: number;
        curriculumMinutes: number;
        completedMinutes: number;
        covered: boolean;
      }>();

      // Initialize from custom standards
      customStandards.forEach((s: any) => {
        milestonesMap.set(s.code, {
          estimatedHours: s.metadata?.estimated_hours || 0,
          curriculumMinutes: 0,
          completedMinutes: 0,
          covered: false,
        });
      });

      // Create a map of assignment IDs to grades for quick lookup
      const gradesMap = new Map(
        gradesData?.map(g => [g.assignment_id, g.score]) || []
      );

      // Accumulate curriculum and completion data
      curriculumData?.forEach(item => {
        const standardCodes = Array.isArray(item.standards) 
          ? item.standards 
          : typeof item.standards === 'string'
          ? [item.standards]
          : [];
        
        const hasGradedAssignments = item.assignments?.some(
          (a: any) => gradesMap.has(a.id)
        );

        const itemMinutes = item.est_minutes || 0;
        const completedMinutes = item.assignments?.reduce((sum: number, a: any) => {
          return sum + (a.submissions?.reduce((s: number, sub: any) => 
            s + ((sub.time_spent_seconds || 0) / 60), 0) || 0);
        }, 0) || 0;

        standardCodes.forEach((code: string) => {
          const existing = milestonesMap.get(code);
          if (existing) {
            existing.curriculumMinutes += itemMinutes;
            existing.completedMinutes += completedMinutes;
            if (hasGradedAssignments) {
              existing.covered = true;
            }
          }
        });
      });

      // Map to final format
      const mappedMilestones = customStandards.map((s: any) => {
        const data = milestonesMap.get(s.code) || {
          estimatedHours: 0,
          curriculumMinutes: 0,
          completedMinutes: 0,
          covered: false,
        };
        return {
          code: s.code,
          text: s.text,
          covered: data.covered,
          estimatedHours: data.estimatedHours,
          curriculumHours: data.curriculumMinutes / 60,
          completedHours: data.completedMinutes / 60,
        };
      });

      setAllMilestones(mappedMilestones);
      setCoveredMilestones(new Set(mappedMilestones.filter((m: Milestone) => m.covered).map((m: Milestone) => m.code)));
    } catch (error) {
      console.error('Error loading milestones coverage:', error);
    } finally {
      setLoading(false);
    }
  };

  const coveredCount = coveredMilestones.size;
  const totalCount = allMilestones.length;
  const coveragePercentage = totalCount > 0 ? (coveredCount / totalCount) * 100 : 0;
  const pendingMilestones = allMilestones.filter(m => !m.covered);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (totalCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Learning Milestones Roadmap</CardTitle>
          <CardDescription>AI-generated milestones based on your course goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground p-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No learning milestones generated yet.</p>
            <p className="text-sm mt-2">Click "Edit Settings" and save to generate AI milestones from your course goals.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Learning Milestones Roadmap
        </CardTitle>
        <CardDescription>
          AI-generated learning milestones based on your custom course goals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="font-bold">
              {coveredCount} of {totalCount} milestones ({coveragePercentage.toFixed(1)}%)
            </span>
          </div>
          <Progress value={coveragePercentage} className="h-3" />
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              {coveredCount} Covered
            </span>
            <span className="flex items-center gap-1">
              <Circle className="h-3 w-3 text-muted-foreground" />
              {pendingMilestones.length} Pending
            </span>
          </div>
        </div>

        {/* Milestones Lists */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">
              Pending ({pendingMilestones.length})
            </TabsTrigger>
            <TabsTrigger value="covered">
              Covered ({coveredCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <ScrollArea className="h-[400px] mt-4">
              <div className="space-y-2 pr-4">
                {pendingMilestones.length === 0 ? (
                  <div className="text-center text-muted-foreground p-8">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>All milestones covered! 🎉</p>
                  </div>
                ) : (
                  pendingMilestones.map((milestone) => (
                    <div
                      key={milestone.code}
                      className="p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-start gap-2">
                        <Circle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm font-medium text-primary">
                            {milestone.code}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {milestone.text}
                          </div>
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Required: {milestone.estimatedHours}h</span>
                            <span>Created: {milestone.curriculumHours.toFixed(1)}h</span>
                            {milestone.completedHours > 0 && (
                              <span className="text-primary">Completed: {milestone.completedHours.toFixed(1)}h</span>
                            )}
                          </div>
                          {milestone.curriculumHours === 0 && (
                            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                              ⚠️ No curriculum created yet for this milestone
                            </p>
                          )}
                          {milestone.curriculumHours > 0 && milestone.curriculumHours < milestone.estimatedHours && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              Need {(milestone.estimatedHours - milestone.curriculumHours).toFixed(1)}h more curriculum
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="covered">
            <ScrollArea className="h-[400px] mt-4">
              <div className="space-y-2 pr-4">
                {coveredCount === 0 ? (
                  <div className="text-center text-muted-foreground p-8">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No milestones covered yet</p>
                  </div>
                ) : (
                  allMilestones
                    .filter(m => m.covered)
                    .map((milestone) => (
                      <div
                        key={milestone.code}
                        className="p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-sm font-medium text-primary">
                              {milestone.code}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {milestone.text}
                            </div>
                            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                              <span>Required: {milestone.estimatedHours}h</span>
                              <span>Created: {milestone.curriculumHours.toFixed(1)}h</span>
                              <span className="text-primary">Completed: {milestone.completedHours.toFixed(1)}h</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
