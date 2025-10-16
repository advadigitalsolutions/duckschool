import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';

export const SetupDemoButton = () => {
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-demo-accounts');
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(data.message);
        // Reload the page to show the new data
        window.location.reload();
      } else {
        toast.error('Failed to set up demo accounts');
      }
    } catch (error: any) {
      console.error('Error setting up demo:', error);
      toast.error('Failed to set up demo accounts: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSetup}
      disabled={loading}
      variant="outline"
      size="sm"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Setting up...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Set Up Demo Data
        </>
      )}
    </Button>
  );
};
