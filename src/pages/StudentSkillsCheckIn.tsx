import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DiagnosticAssessmentLauncher } from "@/components/DiagnosticAssessmentLauncher";
import { DiagnosticAssessmentHistory } from "@/components/DiagnosticAssessmentHistory";
import { BridgeModeStatusPanel } from "@/components/BridgeModeStatusPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function StudentSkillsCheckIn() {
  const navigate = useNavigate();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      return student;
    }
  });

  const { data: activeAssessment, isLoading: loadingActive } = useQuery({
    queryKey: ['active-diagnostic', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      
      const { data, error } = await supabase
        .from('diagnostic_assessments')
        .select('*')
        .eq('student_id', currentUser.id)
        .in('current_phase', ['warmup', 'deep_dive'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentUser?.id,
    refetchInterval: 2000, // Auto-refresh every 2 seconds to catch state changes
    staleTime: 1000
  });

  const { data: bridgeCourses, isLoading: loadingBridge } = useQuery({
    queryKey: ['bridge-courses', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('student_id', currentUser.id)
        .not('archived_at', 'is', null);
      
      if (error) throw error;
      
      // Filter courses with bridge_mode enabled
      return data?.filter(course => {
        const scope = course.standards_scope as any;
        return scope?.[0]?.bridge_mode === true;
      }) || [];
    },
    enabled: !!currentUser?.id
  });

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Please log in to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Skills Check-In</h1>
        <p className="text-muted-foreground">
          Track your skill level, take diagnostic assessments, and see how they shape your learning path
        </p>
      </div>

      {/* Active Assessment Card - only show if assessment exists */}
      {!loadingActive && activeAssessment && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Assessment in Progress</CardTitle>
            <CardDescription>
              You have an active {activeAssessment.subject} diagnostic assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Phase: <span className="font-medium capitalize">{activeAssessment.current_phase.replace('_', ' ')}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Started: {new Date(activeAssessment.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button onClick={() => navigate(`/diagnostic/${activeAssessment.id}`)}>
                Continue Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bridge Mode Status - only show if courses exist */}
      {!loadingBridge && bridgeCourses && bridgeCourses.length > 0 && (
        <BridgeModeStatusPanel courses={bridgeCourses} studentId={currentUser.id} />
      )}

      {/* Start New Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Begin New Assessment</CardTitle>
          <CardDescription>
            Ready to check in on your skills? Take a diagnostic to help personalize your learning.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Choose your subject</li>
              <li>• Auto-detects appropriate standards</li>
              <li>• Takes approximately 15-20 minutes</li>
            </ul>
            <DiagnosticAssessmentLauncher 
              studentId={currentUser.id}
              buttonText="Begin Skills Check-In"
              variant="default"
            />
          </div>
        </CardContent>
      </Card>

      {/* Assessment History */}
      <DiagnosticAssessmentHistory studentId={currentUser.id} />
    </div>
  );
}
