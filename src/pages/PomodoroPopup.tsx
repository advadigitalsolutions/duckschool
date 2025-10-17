import { useEffect, useState } from 'react';
import { PomodoroProvider } from '@/contexts/PomodoroContext';
import { SimplePomodoroTimer } from '@/components/SimplePomodoroTimer';
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

  return (
    <PomodoroProvider studentId={studentId || undefined}>
      <div className="h-screen w-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
        <SimplePomodoroTimer studentId={studentId} compact />
      </div>
    </PomodoroProvider>
  );
}
