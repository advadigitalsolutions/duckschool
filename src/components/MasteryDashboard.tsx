import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface MasteryDashboardProps {
  studentId: string;
}

export const MasteryDashboard = ({ studentId }: MasteryDashboardProps) => {
  const { data: courseMastery, isLoading: loadingCourses } = useQuery({
    queryKey: ['course-mastery', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_mastery_summary')
        .select(`
          *,
          courses(id, title, subject)
        `)
        .eq('student_id', studentId)
        .order('overall_mastery_percentage', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: weakStandards, isLoading: loadingWeak } = useQuery({
    queryKey: ['weak-standards', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('standard_mastery')
        .select(`
          *,
          courses(id, title, subject)
        `)
        .eq('student_id', studentId)
        .lt('mastery_level', 60)
        .order('mastery_level', { ascending: true })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  if (loadingCourses || loadingWeak) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const overallMastery = courseMastery?.length 
    ? Math.round(
        courseMastery.reduce((sum, c) => sum + (c.overall_mastery_percentage || 0), 0) / courseMastery.length
      )
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Overall Mastery</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{overallMastery}%</span>
              <Badge variant={overallMastery >= 80 ? "default" : overallMastery >= 60 ? "secondary" : "outline"}>
                {overallMastery >= 80 ? "Excellent" : overallMastery >= 60 ? "Good Progress" : "Needs Attention"}
              </Badge>
            </div>
            <Progress value={overallMastery} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Course Mastery Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
                No mastery data yet. Complete some assignments to see your progress!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Areas for Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weakStandards?.map((standard) => (
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
            {!weakStandards?.length && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Great job! No weak areas identified yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
