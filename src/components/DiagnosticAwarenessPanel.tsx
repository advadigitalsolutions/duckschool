import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Target, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DiagnosticAwarenessPanelProps {
  studentId: string;
  courseSubject: string;
}

export function DiagnosticAwarenessPanel({ studentId, courseSubject }: DiagnosticAwarenessPanelProps) {
  const { data: diagnostics } = useQuery({
    queryKey: ['diagnostic-awareness', studentId, courseSubject],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diagnostic_assessments')
        .select('*')
        .eq('student_id', studentId)
        .eq('subject', courseSubject)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  if (!diagnostics) return null;

  const results = diagnostics.results as any;
  const knowledgeBoundaries = results?.knowledgeBoundaries || [];
  const strugglingTopics = results?.strugglingTopics || [];

  if (knowledgeBoundaries.length === 0 && strugglingTopics.length === 0) {
    return null;
  }

  return (
    <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
      <Target className="h-4 w-4 text-blue-600" />
      <AlertDescription>
        <div className="space-y-3">
          <div>
            <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Diagnostic Insights for {courseSubject}
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Recent diagnostic identified areas where this student needs additional support.
            </p>
          </div>

          {knowledgeBoundaries.length > 0 && (
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Knowledge Boundaries ({knowledgeBoundaries.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {knowledgeBoundaries.slice(0, 5).map((b: any, idx: number) => {
                  const topic = typeof b === 'string' ? b : b.topic;
                  return (
                    <Badge key={idx} variant="outline" className="text-xs bg-white/50 dark:bg-black/20">
                      {topic}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {strugglingTopics.length > 0 && (
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Struggling Topics ({strugglingTopics.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {strugglingTopics.slice(0, 5).map((topic: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs bg-white/50 dark:bg-black/20">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-blue-700 dark:text-blue-300 italic">
            💡 New assignments will automatically include scaffolding for these areas
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
