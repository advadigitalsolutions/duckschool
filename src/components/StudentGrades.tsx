import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { TrendingUp, Award, Calendar, FileText } from 'lucide-react';
interface StudentGradesProps {
  studentId: string;
}
interface GradeData {
  id: string;
  assignment_id: string;
  score: number;
  max_score: number;
  graded_at: string;
  notes: string;
  assignment: {
    curriculum_items: {
      title: string;
      body: any;
      courses: {
        title: string;
        subject: string;
        credits: number;
      };
    };
  };
}
export function StudentGrades({
  studentId
}: StudentGradesProps) {
  const [grades, setGrades] = useState<GradeData[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchGrades();
  }, [studentId]);
  const fetchGrades = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('grades').select(`
          *,
          assignment:assignments!inner(
            curriculum_items!inner(
              title,
              body,
              courses!inner(
                title,
                subject,
                credits
              )
            )
          )
        `).eq('student_id', studentId).order('graded_at', {
        ascending: false
      });
      if (error) throw error;
      setGrades(data || []);
    } catch (error) {
      console.error('Error fetching grades:', error);
      toast.error('Failed to load grades');
    } finally {
      setLoading(false);
    }
  };
  const isAssessment = (title: string) => {
    return title.toLowerCase().includes('assessment');
  };
  const calculatePercentage = (score: number, maxScore: number) => {
    return (score / maxScore * 100).toFixed(1);
  };
  const calculateLetterGrade = (percentage: number) => {
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 63) return 'D';
    if (percentage >= 60) return 'D-';
    return 'F';
  };
  const calculateGPA = (percentage: number) => {
    if (percentage >= 93) return 4.0;
    if (percentage >= 90) return 3.7;
    if (percentage >= 87) return 3.3;
    if (percentage >= 83) return 3.0;
    if (percentage >= 80) return 2.7;
    if (percentage >= 77) return 2.3;
    if (percentage >= 73) return 2.0;
    if (percentage >= 70) return 1.7;
    if (percentage >= 67) return 1.3;
    if (percentage >= 63) return 1.0;
    if (percentage >= 60) return 0.7;
    return 0.0;
  };
  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-success';
    if (percentage >= 80) return 'text-primary';
    if (percentage >= 70) return 'text-warning';
    return 'text-destructive';
  };

  // Calculate overall statistics (excluding assessments)
  const gradedAssignments = grades.filter(grade => {
    const assignmentTitle = grade.assignment.curriculum_items.body?.title || grade.assignment.curriculum_items.title;
    return !isAssessment(assignmentTitle);
  });
  const totalGrades = grades.length;
  const totalGradedAssignments = gradedAssignments.length;
  const overallAverage = totalGradedAssignments > 0 ? gradedAssignments.reduce((sum, grade) => {
    const percentage = grade.score / grade.max_score * 100;
    return sum + percentage;
  }, 0) / totalGradedAssignments : 0;
  const overallGPA = totalGradedAssignments > 0 ? gradedAssignments.reduce((sum, grade) => {
    const percentage = grade.score / grade.max_score * 100;
    return sum + calculateGPA(percentage);
  }, 0) / totalGradedAssignments : 0;

  // Group grades by course
  const gradesByCourse = grades.reduce((acc, grade) => {
    const courseTitle = grade.assignment.curriculum_items.courses.title;
    if (!acc[courseTitle]) {
      acc[courseTitle] = [];
    }
    acc[courseTitle].push(grade);
    return acc;
  }, {} as Record<string, GradeData[]>);

  // Count assessments
  const totalAssessments = grades.filter(grade => {
    const assignmentTitle = grade.assignment.curriculum_items.body?.title || grade.assignment.curriculum_items.title;
    return isAssessment(assignmentTitle);
  }).length;
  if (loading) {
    return <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>;
  }
  if (totalGrades === 0) {
    return <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No graded assignments yet</p>
      </div>;
  }
  return <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overall Average
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallAverage.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground mt-1">
              Letter Grade: {calculateLetterGrade(overallAverage)}
            </p>
            <Progress value={overallAverage} className="mt-2" />
            {totalAssessments > 0 && <p className="text-xs text-muted-foreground mt-2">
                ({totalAssessments} assessment{totalAssessments !== 1 ? 's' : ''} excluded)
              </p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Cumulative GPA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallGPA.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              4.0 Scale
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Assignments Graded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalGrades}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Total completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grades by Course */}
      <div className="space-y-4">
        {Object.entries(gradesByCourse).map(([courseTitle, courseGrades]) => {
        // Calculate average excluding assessments
        const gradedCourseAssignments = courseGrades.filter(grade => {
          const assignmentTitle = grade.assignment.curriculum_items.body?.title || grade.assignment.curriculum_items.title;
          return !isAssessment(assignmentTitle);
        });
        const courseAverage = gradedCourseAssignments.length > 0 ? gradedCourseAssignments.reduce((sum, grade) => {
          const percentage = grade.score / grade.max_score * 100;
          return sum + percentage;
        }, 0) / gradedCourseAssignments.length : 0;
        return <Card key={courseTitle}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{courseTitle}</CardTitle>
                    <CardDescription>
                      {courseGrades[0].assignment.curriculum_items.courses.subject}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    {gradedCourseAssignments.length > 0 ? <>
                        <div className="text-2xl font-bold">{courseAverage.toFixed(1)}%</div>
                        <Badge variant="outline">{calculateLetterGrade(courseAverage)}</Badge>
                      </> : <div className="text-sm text-muted-foreground">
                        Assessments only
                      </div>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {courseGrades.map(grade => {
                const percentage = parseFloat(calculatePercentage(grade.score, grade.max_score));
                const assignmentTitle = grade.assignment.curriculum_items.body?.title || grade.assignment.curriculum_items.title;
                const isAssessmentItem = isAssessment(assignmentTitle);
                const isPassed = grade.score > 0; // Pass if they completed it (any score > 0)

                return <div key={grade.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors" onClick={() => window.location.href = `/assignment/${grade.assignment_id}`}>
                        <div className="flex-1">
                          <div className="font-medium">
                            {assignmentTitle}
                            {isAssessmentItem && <Badge variant="secondary" className="ml-2 text-xs">
                                Assessment
                              </Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(grade.graded_at).toLocaleDateString()}
                          </div>
                          {grade.notes && <div className="text-sm text-muted-foreground mt-1">
                              {grade.notes}
                            </div>}
                        </div>
                        {isAssessmentItem ? <div className="text-right ml-4">
                            <Badge variant={isPassed ? "default" : "destructive"} className="text-lg px-4 py-1">
                              {isPassed ? "Pass" : "Incomplete"}
                            </Badge>
                            
                          </div> : <div className="text-right ml-4">
                            <div className={`text-xl font-bold ${getGradeColor(percentage)}`}>
                              {percentage}%
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {grade.score} / {grade.max_score}
                            </div>
                            <Badge variant="outline" className="mt-1">
                              {calculateLetterGrade(percentage)}
                            </Badge>
                          </div>}
                      </div>;
              })}
                </div>
              </CardContent>
            </Card>;
      })}
      </div>
    </div>;
}