import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to fetch comprehensive knowledge profile for a student
 * Used to provide context for AI assignment generation
 */
export function useKnowledgeProfile(studentId: string | null) {
  return useQuery({
    queryKey: ['knowledge-profile', studentId],
    queryFn: async () => {
      if (!studentId) return null;

      // Get mastery data
      const { data: mastery } = await supabase
        .from('standard_mastery')
        .select('*')
        .eq('student_id', studentId);

      // Get course summaries
      const { data: courseSummaries } = await supabase
        .from('course_mastery_summary')
        .select('*, courses(id, title, subject)')
        .eq('student_id', studentId);

      // Get weak areas
      const { data: weakAreas } = await supabase
        .from('progress_gaps')
        .select('*, courses(subject)')
        .eq('student_id', studentId)
        .is('addressed_at', null)
        .order('confidence_score', { ascending: true })
        .limit(10);

      // Get priority queue
      const { data: priorities } = await supabase
        .from('standards_priority_queue')
        .select('*')
        .eq('student_id', studentId)
        .order('priority_score', { ascending: false })
        .limit(10);

      return {
        mastery: mastery || [],
        courseSummaries: courseSummaries || [],
        weakAreas: weakAreas || [],
        priorities: priorities || [],
        lastUpdated: new Date().toISOString()
      };
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
  });
}
