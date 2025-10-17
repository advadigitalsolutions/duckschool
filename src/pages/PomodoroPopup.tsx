import { useEffect, useState } from 'react';
import { PomodoroProvider } from '@/contexts/PomodoroContext';
import { SimplePomodoroTimer } from '@/components/SimplePomodoroTimer';
import { Button } from '@/components/ui/button';
import { Settings2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function PomodoroPopup() {
  const [studentId, setStudentId] = useState<string | null>(null);
  
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (studentData) {
          setStudentId(studentData.id);
        }
      }
    };

    init();
  }, []);

  const handleOpenSettings = () => {
    window.open('/focus-tools', '_blank');
  };

  const handleClose = () => {
    window.close();
  };

  return (
    <PomodoroProvider studentId={studentId || undefined}>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <div className="relative">
          {/* Header with controls */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenSettings}
              className="gap-2"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Timer */}
          <SimplePomodoroTimer studentId={studentId} compact />
        </div>
      </div>
    </PomodoroProvider>
  );
}
