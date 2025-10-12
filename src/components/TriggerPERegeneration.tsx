import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function TriggerPERegeneration() {
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (triggered) return;
    
    const regenerate = async () => {
      console.log('🔄 Regenerating PE course...');
      
      try {
        const { data, error } = await supabase.functions.invoke('regenerate-pe-course', {
          body: { 
            courseId: 'f8f353ab-e85d-4e97-a43b-e568c5643d81'
          }
        });

        if (error) throw error;

        console.log('✅ Success:', data);
        toast.success(`✨ PE course updated! ${data.assignments?.length || 0} new activities created`);
        setTriggered(true);
      } catch (error: any) {
        console.error('❌ Failed:', error);
        toast.error('Failed to regenerate PE course');
      }
    };

    // Run after a short delay to ensure page is loaded
    const timer = setTimeout(regenerate, 1000);
    return () => clearTimeout(timer);
  }, [triggered]);

  return null; // This component doesn't render anything
}
