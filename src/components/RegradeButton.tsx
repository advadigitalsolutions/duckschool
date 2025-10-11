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
    toast.info('Re-grading in progress... Please stay on this page. This may take 30-60 seconds.', {
      duration: 5000
    });
    
    try {
      const { error } = await supabase.functions.invoke('regrade-submission', {
        body: { submissionId }
      });

      if (error) throw error;

      toast.success('Re-grading complete! Refreshing results...');
      setTimeout(() => {
        onComplete?.();
      }, 1000);
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
