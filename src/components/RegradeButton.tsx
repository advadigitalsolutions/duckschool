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

      toast.success('Re-grading started! Refresh the page in a moment to see updated results.');
      
      // Wait 3 seconds then trigger the refresh callback
      setTimeout(() => {
        onComplete?.();
      }, 3000);
    } catch (error) {
      console.error('Error re-grading:', error);
      toast.error('Failed to start re-grading');
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
