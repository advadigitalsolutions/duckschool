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
    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('regrade-submission', {
        body: { submissionId }
      });

      if (error) throw error;

      toast.success('Re-grading in progress! Feel free to navigate away. Refresh in 30 seconds to see results.');
      setLoading(false);
      
      // Auto-refresh after 30 seconds
      setTimeout(() => {
        onComplete?.();
      }, 30000);
    } catch (error) {
      console.error('Error re-grading:', error);
      toast.error('Failed to start re-grading');
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
