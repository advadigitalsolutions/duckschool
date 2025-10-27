import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, Calendar, TrendingUp, TrendingDown, Minus, Loader2, Eye, BookOpen, Pencil } from "lucide-react";
import { format } from "date-fns";
import { CourseSettingsDialog } from "./CourseSettingsDialog";

interface DiagnosticAssessmentHistoryProps {
  studentId: string;
}

export function DiagnosticAssessmentHistory({ studentId }: DiagnosticAssessmentHistoryProps) {
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  
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

  const { data: studentCourses } = useQuery({
    queryKey: ['student-courses', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('student_id', studentId)
        .is('archived_at', null);
      
      if (error) throw error;
      return data;
    }
  });

  const handleApplyToCourse = (assessment: any) => {
    const matchingCourse = studentCourses?.find(course => 
      course.subject?.toLowerCase().includes(assessment.subject.toLowerCase())
    );
    
    if (matchingCourse) {
      setSelectedCourse(matchingCourse.id);
    }
  };

  const handleGeneratePractice = async (assessment: any) => {
    const matchingCourse = studentCourses?.find(course => 
      course.subject?.toLowerCase().includes(assessment.subject.toLowerCase())
    );
    
    if (matchingCourse) {
      navigate(`/course/${matchingCourse.id}`);
    }
  };

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
            <Loader2 className="h-6 w-6 animate-spin" />
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

  return (
    <>
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

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/diagnostic/${latestAssessment.id}`)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleApplyToCourse(latestAssessment)}
                  >
                    <BookOpen className="h-3 w-3 mr-1" />
                    Apply to Course
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleGeneratePractice(latestAssessment)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Practice
                  </Button>
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
                          <div key={idx} className="flex items-center justify-between text-xs text-muted-foreground">
                            <div>
                              <div>{format(new Date(assessment.completed_at), 'MMM d, yyyy')}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>
                                {prevResults?.correctAnswers || 0}/{prevResults?.totalQuestions || 0} ({prevResults?.accuracyRate != null ? Math.round(prevResults.accuracyRate * 100) : 0}%)
                              </span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => navigate(`/diagnostic/${assessment.id}`)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
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
      
      {selectedCourse && (
        <CourseSettingsDialog
          courseId={selectedCourse}
          open={!!selectedCourse}
          onOpenChange={(open) => !open && setSelectedCourse(null)}
          onUpdate={() => {}}
        />
      )}
    </>
  );
}
