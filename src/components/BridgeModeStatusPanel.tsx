import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Settings } from "lucide-react";
import { CourseSettingsDialog } from "./CourseSettingsDialog";
import { useState } from "react";

interface BridgeModeStatusPanelProps {
  courses: any[];
  studentId: string;
}

export function BridgeModeStatusPanel({ courses, studentId }: BridgeModeStatusPanelProps) {
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const { data: masteryData } = useQuery({
    queryKey: ['bridge-mastery', studentId, courses.map(c => c.id)],
    queryFn: async () => {
      const results = await Promise.all(
        courses.map(async (course) => {
          const { data, error } = await supabase
            .from('standard_mastery')
            .select('*')
            .eq('student_id', studentId)
            .eq('course_id', course.id);
          
          if (error) throw error;
          
          const scope = course.standards_scope?.[0];
          const prerequisiteBands = scope?.prerequisite_bands || [];
          
          // Calculate prerequisite vs course-level progress
          const prerequisiteStandards = data?.filter(m => 
            prerequisiteBands.some((band: string) => m.standard_code?.includes(`Grade ${band}`))
          ) || [];
          
          const courseLevelStandards = data?.filter(m =>
            m.standard_code?.includes(`Grade ${scope?.grade_band}`)
          ) || [];
          
          const prerequisiteProgress = prerequisiteStandards.length > 0
            ? Math.round(prerequisiteStandards.reduce((sum, s) => sum + (s.mastery_level || 0), 0) / prerequisiteStandards.length)
            : 0;
          
          const courseLevelProgress = courseLevelStandards.length > 0
            ? Math.round(courseLevelStandards.reduce((sum, s) => sum + (s.mastery_level || 0), 0) / courseLevelStandards.length)
            : 0;
          
          return {
            courseId: course.id,
            prerequisiteProgress,
            courseLevelProgress,
            prerequisiteCount: prerequisiteStandards.length,
            courseLevelCount: courseLevelStandards.length
          };
        })
      );
      
      return results.reduce((acc, result) => {
        acc[result.courseId] = result;
        return acc;
      }, {} as Record<string, any>);
    }
  });

  return (
    <>
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌉</span>
            <div className="flex-1">
              <CardTitle>Prerequisite Bridge Mode Active</CardTitle>
              <CardDescription>
                Building foundation skills before advancing to course-level content
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {courses.map((course) => {
            const scope = course.standards_scope?.[0];
            const baseline = scope?.diagnostic_baseline || 'Unknown';
            const target = scope?.grade_band || 'Unknown';
            const bands = scope?.prerequisite_bands || [];
            const mastery = masteryData?.[course.id];

            return (
              <div key={course.id} className="space-y-3 p-4 rounded-lg border bg-card">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{course.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">Baseline: Grade {baseline}</Badge>
                      <ArrowRight className="h-3 w-3" />
                      <Badge variant="outline">Target: Grade {target}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Covering prerequisites: Grades {bands.join(', ')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCourse(course)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Adjust
                  </Button>
                </div>

                {mastery && (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Foundation Progress</span>
                        <span className="font-medium">{mastery.prerequisiteProgress}%</span>
                      </div>
                      <Progress value={mastery.prerequisiteProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {mastery.prerequisiteCount} prerequisite standards tracked
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Course Content Progress</span>
                        <span className="font-medium">{mastery.courseLevelProgress}%</span>
                      </div>
                      <Progress value={mastery.courseLevelProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {mastery.courseLevelCount} course standards tracked
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {selectedCourse && (
        <CourseSettingsDialog
          courseId={selectedCourse.id}
          open={!!selectedCourse}
          onOpenChange={(open) => !open && setSelectedCourse(null)}
          onUpdate={() => {}}
        />
      )}
    </>
  );
}
