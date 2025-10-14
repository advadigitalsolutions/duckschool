import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useMasteryAnalysis = () => {
  const queryClient = useQueryClient();

  const analyzeMastery = useMutation({
    mutationFn: async ({ studentId, courseId }: { studentId: string; courseId?: string }) => {
      const { data, error } = await supabase.functions.invoke('analyze-student-mastery', {
        body: { studentId, courseId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-mastery', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['weak-standards', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['standard-mastery', variables.studentId] });
      toast({
        title: "Mastery Analysis Complete",
        description: "Your learning progress has been updated.",
      });
    },
    onError: (error) => {
      console.error('Mastery analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze mastery data. Please try again.",
        variant: "destructive",
      });
    }
  });

  return {
    analyzeMastery: analyzeMastery.mutate,
    isAnalyzing: analyzeMastery.isPending
  };
};
