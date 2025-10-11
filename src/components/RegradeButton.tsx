import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface RegradeButtonProps {
  submissionId: string;
  onComplete?: () => void;
}

export function RegradeButton({ submissionId, onComplete }: RegradeButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleRegrade = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('regrade-submission', {
        body: { submissionId }
      });

      if (error) throw error;

      toast.success(`Re-graded! New score: ${data.totalScore}/${data.maxScore}`);
      onComplete?.();
    } catch (error) {
      console.error('Error re-grading:', error);
      toast.error('Failed to re-grade submission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRegrade}
      disabled={loading}
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
      Re-grade with AI
    </Button>
  );
}
