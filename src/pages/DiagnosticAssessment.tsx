import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DiagnosticWarmupPhase } from "@/components/DiagnosticWarmupPhase";
import { DiagnosticDeepDivePhase } from "@/components/DiagnosticDeepDivePhase";
import { DiagnosticResultsDashboard } from "@/components/DiagnosticResultsDashboard";
import { DiagnosticDetailedReport } from "@/components/DiagnosticDetailedReport";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DiagnosticAssessment() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const [isSubmittingWarmup, setIsSubmittingWarmup] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const { data: assessment, isLoading, refetch } = useQuery({
    queryKey: ['diagnostic-assessment', assessmentId],
    queryFn: async () => {
      if (!assessmentId) throw new Error('No assessment ID');
      
      const { data, error } = await supabase
        .from('diagnostic_assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!assessmentId
  });

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

  const handleWarmupComplete = async (responses: Record<string, string>) => {
    if (!assessmentId) return;
    
    setIsSubmittingWarmup(true);
    try {
      const { error } = await supabase.functions.invoke('submit-warmup-response', {
        body: {
          assessmentId,
          warmupResponses: responses
        }
      });

      if (error) throw error;

      toast({
        title: "Great Start!",
        description: "Now let's see what you can do!"
      });

      // Refetch assessment to get updated phase
      await refetch();
    } catch (error) {
      console.error('Error submitting warmup:', error);
      toast({
        title: "Error",
        description: "Could not save your responses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingWarmup(false);
    }
  };

  const handleDeepDiveComplete = async () => {
    if (!assessmentId) return;
    
    setIsFinalizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('finalize-diagnostic-assessment', {
        body: { assessmentId }
      });

      if (error) throw error;

      toast({
        title: "Assessment Complete!",
        description: "Let's see what you've accomplished!"
      });

      // Refetch assessment to get results
      await refetch();
    } catch (error) {
      console.error('Error finalizing assessment:', error);
      toast({
        title: "Error",
        description: "Could not complete assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  if (isLoading || !assessment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6">
      <div className="max-w-6xl mx-auto py-8">
        {assessment.current_phase === 'warmup' && !isSubmittingWarmup && (
          <DiagnosticWarmupPhase
            assessmentId={assessment.id}
            subject={assessment.subject}
            onComplete={handleWarmupComplete}
          />
        )}

        {assessment.current_phase === 'deep_dive' && !isFinalizing && (
          <DiagnosticDeepDivePhase
            assessmentId={assessment.id}
            studentId={currentUser.id}
            onComplete={handleDeepDiveComplete}
          />
        )}

        {assessment.current_phase === 'completed' && assessment.results && (
          <Tabs defaultValue="summary" className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Report</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary">
              <DiagnosticResultsDashboard
                assessmentId={assessment.id}
                results={assessment.results as any}
                subject={assessment.subject}
                studentId={currentUser.id}
              />
            </TabsContent>
            
            <TabsContent value="detailed">
              <DiagnosticDetailedReport
                assessmentId={assessment.id}
                results={assessment.results as any}
                subject={assessment.subject}
                completedAt={assessment.completed_at || assessment.updated_at}
                framework={assessment.framework}
                gradeLevel={assessment.grade_level}
              />
            </TabsContent>
          </Tabs>
        )}

        {(isSubmittingWarmup || isFinalizing) && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-muted-foreground">
                {isSubmittingWarmup ? "Processing your responses..." : "Analyzing your results..."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}