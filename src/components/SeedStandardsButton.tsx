import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function SeedStandardsButton() {
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      console.log('🌱 Seeding CA-CCSS standards...');
      
      const { data, error } = await supabase.functions.invoke('seed-ca-ccss-standards', {
        body: {}
      });

      if (error) throw error;

      console.log('✅ Success:', data);
      toast.success(`✨ Standards seeded! ${data.totalInserted} standards added`);
    } catch (error: any) {
      console.error('❌ Failed:', error);
      toast.error('Failed to seed standards: ' + error.message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Button 
      onClick={handleSeed} 
      disabled={isSeeding}
      variant="outline"
      size="sm"
    >
      {isSeeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Seed CA-CCSS Standards
    </Button>
  );
}
