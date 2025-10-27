import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, Calendar, TrendingUp, TrendingDown, Minus, Loader2, Eye, BookOpen, Pencil, Lightbulb, ArrowRight, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { CourseSettingsDialog } from "./CourseSettingsDialog";
import { toast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
      toast({
        title: "Course Found",
        description: `Opening settings for ${matchingCourse.title}`,
      });
    } else {
      toast({
        title: "No Matching Course",
        description: `No active course found for ${assessment.subject}. Would you like to create one?`,
        variant: "default"
      });
    }
  };

  const handleGeneratePractice = async (assessment: any) => {
    const matchingCourse = studentCourses?.find(course => 
      course.subject?.toLowerCase().includes(assessment.subject.toLowerCase())
    );
    
    if (matchingCourse) {
      toast({
        title: "Navigating to Course",
        description: `Opening ${matchingCourse.title} for practice`,
      });
      navigate(`/course/${matchingCourse.id}`);
    } else {
      toast({
        title: "No Matching Course",
        description: `Create a ${assessment.subject} course first to generate practice assignments.`,
        variant: "default"
      });
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

                {/* Enhanced Results Display */}
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      <span className="text-sm font-medium">View Detailed Breakdown</span>
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4">
                    {/* Strengths */}
                    {results?.masteredTopics?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Strengths (Mastered)
                        </p>
                        <div className="space-y-2 pl-6">
                          {results.masteredTopics.map((topic: string) => {
                            const mastery = results.masteryByTopic?.[topic];
                            return (
                              <div key={topic} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium">{topic}</span>
                                  <span className="text-green-600 dark:text-green-400">
                                    {Math.round((mastery?.mastery || 0) * 100)}%
                                  </span>
                                </div>
                                <Progress value={(mastery?.mastery || 0) * 100} className="h-1.5" />
                                <p className="text-xs text-muted-foreground">
                                  {mastery?.attempts || 0} attempts, {mastery?.successes || 0} successful
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Knowledge Boundaries */}
                    {results?.knowledgeBoundaries?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Knowledge Edges Identified
                        </p>
                        <p className="text-xs text-muted-foreground pl-6 mb-2">
                          These are growth frontiers where targeted practice will have maximum impact
                        </p>
                        <div className="space-y-2 pl-6">
                          {results.knowledgeBoundaries.map((topic: string) => {
                            const mastery = results.masteryByTopic?.[topic];
                            return (
                              <div key={topic} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium">{topic}</span>
                                  <Badge variant="outline" className="text-xs">Edge</Badge>
                                </div>
                                <Progress value={(mastery?.mastery || 0) * 100} className="h-1.5" />
                                <p className="text-xs text-muted-foreground">
                                  {Math.round((mastery?.mastery || 0) * 100)}% mastery
                                  {mastery?.prerequisite && ` • Prerequisite: ${mastery.prerequisite}`}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Learning Path */}
                    {results?.learningPath?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Recommended Learning Path
                        </p>
                        <div className="space-y-2 pl-6">
                          {results.learningPath.slice(0, 3).map((item: any, idx: number) => (
                            <div key={idx} className="flex gap-2 text-sm">
                              <span className="font-bold text-purple-600 dark:text-purple-400">
                                {idx + 1}.
                              </span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{item.topic}</span>
                                  <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                                    {item.priority}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {item.reason}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Struggling Topics */}
                    {results?.strugglingTopics?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                          <ArrowRight className="h-4 w-4" />
                          Learning Opportunities
                        </p>
                        <div className="space-y-2 pl-6">
                          {results.strugglingTopics.map((topic: string) => {
                            const mastery = results.masteryByTopic?.[topic];
                            return (
                              <div key={topic} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium">{topic}</span>
                                  <span className="text-amber-600 dark:text-amber-400">
                                    {Math.round((mastery?.mastery || 0) * 100)}%
                                  </span>
                                </div>
                                <Progress value={(mastery?.mastery || 0) * 100} className="h-1.5" />
                                <p className="text-xs text-muted-foreground">
                                  {mastery?.attempts || 0} attempts so far
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>

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
