import { useEffect, useState } from 'react';
import { PomodoroProvider } from '@/contexts/PomodoroContext';
import { SimplePomodoroTimer } from '@/components/SimplePomodoroTimer';
import { supabase } from '@/integrations/supabase/client';

export default function PomodoroPopup() {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const init = async () => {
      try {
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
      } catch (error) {
        console.error('Error loading student:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  return (
    <PomodoroProvider studentId={studentId || undefined}>
      <div className="h-screen w-screen relative overflow-hidden">
        {/* Animated Rippling Background - matches Focus Tools */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(190,70%,15%)] via-[hsl(270,60%,20%)] to-[hsl(190,70%,15%)]">
          <div className="absolute inset-0 opacity-60">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[hsl(180,80%,40%)] rounded-full mix-blend-screen filter blur-3xl animate-[ripple_8s_ease-in-out_infinite]" />
            <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-[hsl(270,70%,50%)] rounded-full mix-blend-screen filter blur-3xl animate-[ripple_10s_ease-in-out_infinite_2s]" />
            <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-[hsl(190,75%,45%)] rounded-full mix-blend-screen filter blur-3xl animate-[ripple_12s_ease-in-out_infinite_4s]" />
          </div>
        </div>
        
        <div className="relative z-10 flex items-center justify-center h-full">
          {loading ? (
            <div className="text-center text-white">
              <div className="text-2xl font-semibold mb-4">Loading timer...</div>
              <div className="animate-spin h-12 w-12 border-4 border-white border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : (
            <SimplePomodoroTimer studentId={studentId} compact />
          )}
        </div>
      </div>
    </PomodoroProvider>
  );
}
