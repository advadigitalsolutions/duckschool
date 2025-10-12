import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

export function RegeneratePEButton({ courseId, onComplete }: { courseId: string; onComplete: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-pe-course', {
        body: { courseId }
      });

      if (error) throw error;

      toast.success(`✨ PE course updated! ${data.assignments.length} new activities/lessons created`);
      onComplete();
    } catch (error: any) {
      toast.error(error.message || 'Failed to regenerate course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleRegenerate} disabled={loading} variant="outline">
      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Regenerating...' : 'Regenerate PE Course'}
    </Button>
  );
}
