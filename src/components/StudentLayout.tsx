import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CustomizableHeader } from '@/components/CustomizableHeader';
import { ConfettiCelebration } from '@/components/ConfettiCelebration';
import { toast } from 'sonner';

interface StudentLayoutProps {
  children: React.ReactNode;
}

export function StudentLayout({ children }: StudentLayoutProps) {
  const [student, setStudent] = useState<any>(null);
  const [headerSettings, setHeaderSettings] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudent();
  }, []);

  const fetchStudent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: studentData, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      setStudent(studentData);
      
      // Load header settings or use defaults
      if (studentData.header_settings) {
        setHeaderSettings(studentData.header_settings);
      } else {
        setHeaderSettings(getDefaultHeaderSettings());
      }
    } catch (error: any) {
      console.error('Error fetching student:', error);
    }
  };

  const getDefaultHeaderSettings = () => ({
    showName: true,
    customName: null,
    showGrade: true,
    customGrade: null,
    greetingType: 'name' as const,
    rotatingDisplay: 'quote' as const,
    rotationFrequency: 'hour' as const,
    funFactTopic: null,
    locations: [],
    showWeather: false,
    weatherZipCode: null,
    customReminders: [],
    countdowns: [],
    pomodoroEnabled: false,
    pomodoroSettings: {
      workMinutes: 25,
      breakMinutes: 5,
      longBreakMinutes: 15,
      sessionsUntilLongBreak: 4,
      visualTimer: true,
      timerColor: 'hsl(var(--primary))',
      numberColor: 'hsl(var(--foreground))',
    },
    celebrateWins: true,
    show8BitStars: false,
    starColor: '#fbbf24',
    headerVisibility: 'sticky' as const,
  });

  const saveHeaderSettings = async (newSettings: any) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ header_settings: newSettings })
        .eq('id', student?.id);

      if (error) throw error;
      setHeaderSettings(newSettings);
      toast.success('Header settings saved!');
    } catch (error: any) {
      toast.error('Failed to save header settings');
    }
  };

  const handleSignOut = async () => {
    // Clear all auth-related storage
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();
    
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <ConfettiCelebration active={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      {headerSettings && student && (
        <CustomizableHeader
          student={student}
          settings={headerSettings}
          onSaveSettings={saveHeaderSettings}
          onSignOut={handleSignOut}
          onDemoCelebration={() => setShowConfetti(true)}
        />
      )}

      {children}
    </div>
  );
}
