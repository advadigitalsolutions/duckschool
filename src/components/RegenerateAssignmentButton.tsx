import { useState } from 'react';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RegenerateAssignmentButtonProps {
  assignmentId: string;
  onComplete: () => void;
}

export function RegenerateAssignmentButton({ assignmentId, onComplete }: RegenerateAssignmentButtonProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-assignment-with-passage', {
        body: { assignmentId }
      });

      if (error) throw error;

      toast.success('Assignment regenerated successfully with improved formatting!');
      onComplete();
    } catch (error: any) {
      console.error('Error regenerating assignment:', error);
      toast.error('Failed to regenerate assignment');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Button
      onClick={handleRegenerate}
      disabled={isRegenerating}
      variant="outline"
      size="sm"
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
      {isRegenerating ? 'Regenerating...' : 'Fix Formatting'}
    </Button>
  );
}
