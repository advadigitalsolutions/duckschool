import { useEffect, useState } from 'react';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { PomodoroProvider } from '@/contexts/PomodoroContext';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function PomodoroFullscreen() {
  const [studentId, setStudentId] = useState<string | null>(null);
  useEffect(() => {
    const init = async () => {
      // Get student ID if logged in
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

      // Request fullscreen
      const goFullscreen = () => {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        }
      };
      
      // Small delay to ensure page is loaded
      setTimeout(goFullscreen, 100);
    };

    init();
  }, []);

  const handleClose = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    window.close();
  };

  return (
    <PomodoroProvider studentId={studentId || undefined}>
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-8">
        <div className="relative w-full max-w-2xl">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute -top-4 -right-4 z-50 h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm hover:bg-destructive/20"
          >
            <X className="h-6 w-6" />
          </Button>
          
          <PomodoroTimer />
        </div>
      </div>
    </PomodoroProvider>
  );
}
