import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, RefreshCw, Clock, Loader2, TrendingUp } from 'lucide-react';

interface MasteryData {
  mastered: number;
  activelyMastering: number;
  pending: number;
}

interface UnifiedMasteryDashboardProps {
  studentId: string;
  courseId?: string;
  curriculumMasteryData?: MasteryData;
  showCurriculumView?: boolean;
}

export function UnifiedMasteryDashboard({ 
  studentId, 
  courseId,
  curriculumMasteryData,
  showCurriculumView = true 
}: UnifiedMasteryDashboardProps) {
  const [activeTab, setActiveTab] = useState<'curriculum' | 'standards'>(
    showCurriculumView ? 'curriculum' : 'standards'
  );

  // Fetch standards-based mastery data
  const { data: courseMastery, isLoading: loadingCourses } = useQuery({
    queryKey: ['course-mastery', studentId, courseId],
    queryFn: async () => {
      let query = supabase
        .from('course_mastery_summary')
        .select(`
          *,
          courses(id, title, subject)
        `)
        .eq('student_id', studentId);
      
      if (courseId) {
        query = query.eq('course_id', courseId);
      }
      
      const { data, error } = await query.order('overall_mastery_percentage', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: activeTab === 'standards'
  });

  const { data: weakStandards, isLoading: loadingWeak } = useQuery({
    queryKey: ['weak-standards', studentId, courseId],
    queryFn: async () => {
      let query = supabase
        .from('standard_mastery')
        .select(`
          *,
          courses(id, title, subject)
        `)
        .eq('student_id', studentId)
        .lt('mastery_level', 60);
      
      if (courseId) {
        query = query.eq('course_id', courseId);
      }
      
      const { data, error } = await query
        .order('mastery_level', { ascending: true })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: activeTab === 'standards'
  });

  const overallStandardsMastery = courseMastery?.length 
    ? Math.round(
        courseMastery.reduce((sum, c) => sum + (c.overall_mastery_percentage || 0), 0) / courseMastery.length
      )
    : 0;

  const curriculumItems = curriculumMasteryData ? [
    {
      label: 'Knowledge Mastered',
      value: curriculumMasteryData.mastered,
      color: 'bg-success',
      icon: CheckCircle2,
      description: 'Demonstrated mastery through repeated correct answers'
    },
    {
      label: 'Actively Mastering',
      value: curriculumMasteryData.activelyMastering,
      color: 'bg-warning',
      icon: RefreshCw,
      description: 'Currently learning, some incorrect answers'
    },
    {
      label: 'Pending Mastery',
      value: curriculumMasteryData.pending,
      color: 'bg-muted',
      icon: Clock,
      description: 'Not yet taught or attempted'
    }
  ] : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Knowledge Mastery
        </CardTitle>
        <CardDescription>
          Track understanding through curriculum progress and year-long standards
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'curriculum' | 'standards')}>
          <TabsList className="grid w-full grid-cols-2">
            {showCurriculumView && (
              <TabsTrigger value="curriculum">
                Curriculum Progress
              </TabsTrigger>
            )}
            <TabsTrigger value="standards">
              Standards Mastery
            </TabsTrigger>
          </TabsList>

          {showCurriculumView && (
            <TabsContent value="curriculum" className="space-y-6 mt-6">
              {curriculumMasteryData ? (
                <>
                  {/* Visual progress bar showing all three states */}
                  <div className="relative h-8 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-success transition-all"
                      style={{ width: `${curriculumMasteryData.mastered}%` }}
                    />
                    <div
                      className="absolute top-0 h-full bg-warning transition-all"
                      style={{ 
                        left: `${curriculumMasteryData.mastered}%`,
                        width: `${curriculumMasteryData.activelyMastering}%` 
                      }}
                    />
                    <div
                      className="absolute top-0 h-full bg-muted-foreground/30 transition-all"
                      style={{ 
                        left: `${curriculumMasteryData.mastered + curriculumMasteryData.activelyMastering}%`,
                        width: `${curriculumMasteryData.pending}%` 
                      }}
                    />
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-4">
                    {curriculumItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span className="text-sm font-medium">{item.label}</span>
                            </div>
                            <span className="text-sm font-bold">{item.value.toFixed(1)}%</span>
                          </div>
                          <Progress value={item.value} className="h-2" />
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Curriculum Progress</strong> tracks your performance on assignments you've completed. 
                      This shows immediate, encouraging feedback on your learning journey! 🎯
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No curriculum data available yet. Complete some assignments to see your progress!
                </p>
              )}
            </TabsContent>
          )}

          <TabsContent value="standards" className="space-y-6 mt-6">
            {loadingCourses || loadingWeak ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Overall Standards Mastery */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{overallStandardsMastery}%</span>
                    <Badge variant={overallStandardsMastery >= 80 ? "default" : overallStandardsMastery >= 60 ? "secondary" : "outline"}>
                      {overallStandardsMastery >= 80 ? "Excellent" : overallStandardsMastery >= 60 ? "Good Progress" : "Needs Attention"}
                    </Badge>
                  </div>
                  <Progress value={overallStandardsMastery} className="h-3" />
                </div>

                {/* Course Breakdown */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">Standards Breakdown by Course</h4>
                  {courseMastery?.map((course) => (
                    <div key={course.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{course.courses?.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {course.standards_mastered} mastered • {course.standards_in_progress} in progress • {course.standards_not_started} not started
                          </p>
                        </div>
                        <span className="text-lg font-semibold">{course.overall_mastery_percentage}%</span>
                      </div>
                      <Progress value={course.overall_mastery_percentage || 0} className="h-2" />
                    </div>
                  ))}
                  {!courseMastery?.length && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No standards mastery data yet. Complete some assignments to see your progress!
                    </p>
                  )}
                </div>

                {/* Areas for Growth */}
                {weakStandards && weakStandards.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Areas for Growth</h4>
                    {weakStandards.map((standard) => (
                      <div key={standard.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{standard.standard_code}</p>
                          <p className="text-xs text-muted-foreground">{standard.courses?.title}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={standard.mastery_level || 0} className="h-2 w-24" />
                          <span className="text-sm font-medium w-12 text-right">{standard.mastery_level}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Standards Mastery</strong> tracks progress toward year-long learning goals based on official educational standards. 
                    This shows how you're progressing through the full curriculum framework. 📚
                  </p>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
