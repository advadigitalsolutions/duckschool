import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format } from "date-fns";

interface DiagnosticAssessmentHistoryProps {
  studentId: string;
}

export function DiagnosticAssessmentHistory({ studentId }: DiagnosticAssessmentHistoryProps) {
  const { data: assessments, isLoading } = useQuery({
    queryKey: ['diagnostic-assessments-history', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diagnostic_assessments')
        .select('*')
        .eq('student_id', studentId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Skills Check-In History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!assessments || assessments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Skills Check-In History
          </CardTitle>
          <CardDescription>
            No diagnostic assessments completed yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Skills check-ins help understand your student's knowledge and create personalized learning paths.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by subject
  const assessmentsBySubject = assessments.reduce((acc, assessment) => {
    const subject = assessment.subject || 'Other';
    if (!acc[subject]) {
      acc[subject] = [];
    }
    acc[subject].push(assessment);
    return acc;
  }, {} as Record<string, typeof assessments>);

  const getMasteryColor = (level: number) => {
    if (level >= 80) return "text-green-600 dark:text-green-400";
    if (level >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getMasteryIcon = (level: number) => {
    if (level >= 80) return <TrendingUp className="h-4 w-4" />;
    if (level >= 60) return <Minus className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Skills Check-In History
        </CardTitle>
        <CardDescription>
          Diagnostic assessments completed by student
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(assessmentsBySubject).map(([subject, subjectAssessments]) => {
          const latestAssessment = subjectAssessments[0];
          const results = latestAssessment.results as any;
          const masteryEstimates = latestAssessment.mastery_estimates as any;

          return (
            <div key={subject} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{subject}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Last assessed: {format(new Date(latestAssessment.completed_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="gap-1">
                  {results?.totalQuestions || 0} questions
                </Badge>
              </div>

              {/* Overall Stats */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                  <p className="text-2xl font-bold">
                    {results?.accuracyRate != null ? `${Math.round(results.accuracyRate * 100)}%` : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Questions</p>
                  <p className="text-2xl font-bold">
                    {results?.correctAnswers || 0}/{results?.totalQuestions || 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Avg Mastery</p>
                  <p className="text-2xl font-bold">
                    {results?.averageMastery != null ? `${Math.round(results.averageMastery * 100)}%` : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Mastery by Topic */}
              {results?.topicBreakdown && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Topic Mastery</h4>
                  <div className="space-y-3">
                    {/* Strengths */}
                    {results.topicBreakdown.strengths?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Strengths (≥80%)
                        </p>
                        <div className="space-y-2 pl-4">
                          {results.topicBreakdown.strengths.map((topic: any, idx: number) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{topic.topic}</span>
                                <span className="font-medium text-green-600 dark:text-green-400">
                                  {Math.round(topic.mastery)}%
                                </span>
                              </div>
                              <Progress value={topic.mastery} className="h-1.5" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Growing */}
                    {results.topicBreakdown.growing?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                          <Minus className="h-3 w-3" />
                          Growing (60-79%)
                        </p>
                        <div className="space-y-2 pl-4">
                          {results.topicBreakdown.growing.map((topic: any, idx: number) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{topic.topic}</span>
                                <span className="font-medium text-yellow-600 dark:text-yellow-400">
                                  {Math.round(topic.mastery)}%
                                </span>
                              </div>
                              <Progress value={topic.mastery} className="h-1.5" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Focus Areas */}
                    {results.topicBreakdown.needsWork?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                          <TrendingDown className="h-3 w-3" />
                          Focus Areas (&lt;60%)
                        </p>
                        <div className="space-y-2 pl-4">
                          {results.topicBreakdown.needsWork.map((topic: any, idx: number) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{topic.topic}</span>
                                <span className="font-medium text-red-600 dark:text-red-400">
                                  {Math.round(topic.mastery)}%
                                </span>
                              </div>
                              <Progress value={topic.mastery} className="h-1.5" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Previous Assessments */}
              {subjectAssessments.length > 1 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    View {subjectAssessments.length - 1} previous assessment{subjectAssessments.length > 2 ? 's' : ''}
                  </summary>
                  <div className="mt-3 space-y-2 pl-4 border-l-2">
                    {subjectAssessments.slice(1).map((assessment, idx) => {
                      const prevResults = assessment.results as any;
                      return (
                        <div key={idx} className="text-xs text-muted-foreground">
                          <div className="flex items-center justify-between">
                            <span>{format(new Date(assessment.completed_at), 'MMM d, yyyy')}</span>
                            <span>
                              {prevResults?.correctAnswers || 0}/{prevResults?.totalQuestions || 0} ({prevResults?.accuracyRate != null ? Math.round(prevResults.accuracyRate * 100) : 0}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
