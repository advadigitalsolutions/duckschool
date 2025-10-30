import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Target, TrendingUp, Award, Plus, Trash2, ListChecks, CheckCircle2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { CustomizableHeader } from '@/components/CustomizableHeader';
import { ConfettiCelebration } from '@/components/ConfettiCelebration';
import { PomodoroProvider } from '@/contexts/PomodoroContext';
import { DemoWizard } from '@/components/DemoWizard';
import { ProfileSettingsModal } from '@/components/ProfileSettingsModal';
import { useAutoXPRewards } from '@/hooks/useAutoXPRewards';
import { ExcitingAgendaButton } from '@/components/ExcitingAgendaButton';
import { DuckCatchingGame } from '@/components/DuckCatchingGame';
export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [studentDbId, setStudentDbId] = useState<string | null>(null);
  const [completedToday, setCompletedToday] = useState(0);
  const [streak, setStreak] = useState(0);
  const [dailyGoals, setDailyGoals] = useState<any[]>([]);
  const [newGoalText, setNewGoalText] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [headerSettings, setHeaderSettings] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'profile' | 'accessibility' | 'assessment'>('profile');
  const [todaysChores, setTodaysChores] = useState<any[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Enable automatic XP rewards
  useAutoXPRewards({
    studentId: studentDbId,
    enabled: true
  });
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
      showTimeText: true,
      timerColor: 'hsl(var(--primary))',
      numberColor: 'hsl(var(--foreground))',
      showMinutesInside: true,
      timerStyle: 'doughnut' as const,
      soundEffect: 'beep' as const,
      timerForegroundColor: 'hsl(var(--primary))',
      timerBackgroundColor: 'hsl(var(--muted))'
    },
    celebrateWins: true,
    show8BitStars: false,
    starColor: '#fbbf24',
    showClouds: false,
    cloudColor: 'rgba(255, 255, 255, 0.15)',
    headerVisibility: 'sticky' as const
  });
  const saveHeaderSettings = async (newSettings: any) => {
    if (!studentDbId) return;
    try {
      const settingsToSave = {
        ...newSettings,
        countdowns: newSettings.countdowns?.map((countdown: any) => ({
          ...countdown,
          date: countdown.date instanceof Date ? countdown.date.toISOString() : countdown.date
        })) || []
      };
      const {
        error
      } = await supabase.from('students').update({
        header_settings: settingsToSave
      }).eq('id', studentDbId);
      if (error) throw error;
      setHeaderSettings(newSettings);
      toast.success('Header settings saved!');
    } catch (error: any) {
      toast.error('Failed to save header settings');
    }
  };
  useEffect(() => {
    // Listen for profile modal open events
    const handleOpenProfileModal = (event: any) => {
      const tab = event.detail?.tab || 'profile';
      setProfileModalTab(tab);
      setShowProfileModal(true);
    };
    window.addEventListener('openProfileModal', handleOpenProfileModal);
    return () => window.removeEventListener('openProfileModal', handleOpenProfileModal);
  }, []);
  useEffect(() => {
    checkRoleAndFetch();
  }, []);

  // Handle diagnostic completion
  useEffect(() => {
    const state = location.state as any;
    if (state?.diagnosticComplete && studentDbId) {
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
      
      toast.success('Diagnostic complete! You can now view your results in your profile.', {
        description: 'Create a course from the Parent Dashboard to start learning.',
        duration: 5000
      });
    }
  }, [location.state, studentDbId]);
  const checkRoleAndFetch = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        return;
      }
      const {
        data: roleData
      } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
      
      // Check if user has parent role - redirect if so
      if (roleData && roleData.some(r => r.role === 'parent')) {
        navigate('/parent', {
          replace: true
        });
        return;
      }
      fetchStudentData();
    } catch (error) {
      console.error('Error checking role:', error);
      fetchStudentData();
    }
  };
  const fetchStudentData = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data: studentData,
        error: studentError
      } = await supabase.from('students').select('*').eq('user_id', user.id).maybeSingle();
      if (studentData) {
        setStudent(studentData);
        setStudentDbId(studentData.id);
        const loadedSettings = studentData.header_settings && typeof studentData.header_settings === 'object' && !Array.isArray(studentData.header_settings) ? studentData.header_settings as any : getDefaultHeaderSettings();
        const finalSettings = {
          ...getDefaultHeaderSettings(),
          ...loadedSettings,
          locations: Array.isArray(loadedSettings.locations) ? loadedSettings.locations : [],
          customReminders: Array.isArray(loadedSettings.customReminders) ? loadedSettings.customReminders : [],
          countdowns: Array.isArray(loadedSettings.countdowns) ? loadedSettings.countdowns.map((countdown: any) => ({
            ...countdown,
            date: typeof countdown.date === 'string' ? new Date(countdown.date) : countdown.date
          })) : []
        };
        setHeaderSettings(finalSettings);
      } else {
        navigate('/parent', {
          replace: true
        });
        return;
      }

      // Calculate completed today
      const today = new Date().toISOString().split('T')[0];
      const {
        data: completedData
      } = await supabase.from('submissions').select('id').eq('student_id', studentData?.id).gte('submitted_at', new Date(today).toISOString());
      setCompletedToday(completedData?.length || 0);

      // Calculate streak
      await calculateStreak(studentData?.id);

      // Fetch daily goals
      await fetchDailyGoals(studentData?.id);

      // Fetch today's chores
      await fetchTodaysChores(studentData?.id);
    } catch (error: any) {
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };
  const fetchTodaysChores = async (studentId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const {
        data,
        error
      } = await supabase.from('chore_assignments').select(`
          *,
          chores (*)
        `).eq('student_id', studentId).eq('assigned_date', today).eq('status', 'pending');
      if (error) throw error;
      setTodaysChores(data || []);
    } catch (error) {
      console.error('Error fetching todays chores:', error);
    }
  };
  const calculateStreak = async (studentId: string) => {
    try {
      const {
        data: submissions
      } = await supabase.from('submissions').select('submitted_at').eq('student_id', studentId).order('submitted_at', {
        ascending: false
      });
      if (!submissions || submissions.length === 0) {
        setStreak(0);
        return;
      }
      const submissionDates = new Set(submissions.map(s => new Date(s.submitted_at).toISOString().split('T')[0]));
      let currentStreak = 0;
      let checkDate = new Date();
      const today = checkDate.toISOString().split('T')[0];
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterday = checkDate.toISOString().split('T')[0];
      if (!submissionDates.has(today) && !submissionDates.has(yesterday)) {
        setStreak(0);
        return;
      }
      checkDate = new Date();
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (submissionDates.has(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (currentStreak === 0 && dateStr === today) {
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      setStreak(currentStreak);
    } catch (error) {
      console.error('Error calculating streak:', error);
      setStreak(0);
    }
  };
  const fetchDailyGoals = async (studentId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const {
        data,
        error
      } = await supabase.from('daily_goals').select('*').eq('student_id', studentId).eq('date', today).order('created_at', {
        ascending: true
      });
      if (error) throw error;
      setDailyGoals(data || []);
    } catch (error) {
      console.error('Error fetching daily goals:', error);
    }
  };
  const addDailyGoal = async () => {
    if (!newGoalText.trim() || !studentDbId) return;
    try {
      const {
        error
      } = await supabase.from('daily_goals').insert({
        student_id: studentDbId,
        goal_text: newGoalText.trim(),
        date: new Date().toISOString().split('T')[0]
      });
      if (error) throw error;
      setNewGoalText('');
      setIsEditMode(false);
      await fetchDailyGoals(studentDbId);
      toast.success('Goal added!');
    } catch (error) {
      console.error('Error adding goal:', error);
      toast.error('Failed to add goal');
    }
  };
  const toggleGoalComplete = async (goalId: string, completed: boolean) => {
    if (!studentDbId) return;
    try {
      const {
        error
      } = await supabase.from('daily_goals').update({
        completed
      }).eq('id', goalId);
      if (error) throw error;
      await fetchDailyGoals(studentDbId);
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Failed to update goal');
    }
  };
  const deleteGoal = async (goalId: string) => {
    if (!studentDbId) return;
    try {
      const {
        error
      } = await supabase.from('daily_goals').delete().eq('id', goalId);
      if (error) throw error;
      await fetchDailyGoals(studentDbId);
      toast.success('Goal deleted');
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
    }
  };
  const handleSignOut = async () => {
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();
    await supabase.auth.signOut();
    navigate('/auth');
  };
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>;
  }
  const isDemoUser = localStorage.getItem('isDemoUser') === 'true';
  const demoRole = localStorage.getItem('demoRole');
  return <PomodoroProvider studentId={studentDbId || undefined}>
      {isDemoUser && demoRole === 'student' && <DemoWizard role="student" />}
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 pb-20 md:pb-8">
        <ConfettiCelebration active={showConfetti} onComplete={() => setShowConfetti(false)} />

        <div className="container mx-auto p-3 sm:p-4 md:p-8 max-w-4xl">
          {/* Stats Grid */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-4 sm:mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Today's Progress</CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <div className="text-xl sm:text-2xl font-bold">{completedToday}</div>
                <p className="text-xs text-muted-foreground">Tasks completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Current Streak</CardTitle>
                <TrendingUp className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <div className="text-xl sm:text-2xl font-bold">{streak} days</div>
                <p className="text-xs text-muted-foreground">Keep it going!</p>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2 md:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">XP Earned</CardTitle>
                <Award className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <div className="text-xl sm:text-2xl font-bold">{completedToday * 50}</div>
                <p className="text-xs text-muted-foreground">This week</p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Goals */}
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Today's Micro-Goals 🎯</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Quick wins to keep you motivated</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2 sm:space-y-3">
                {dailyGoals.map(goal => <div key={goal.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <Checkbox checked={goal.completed} onCheckedChange={checked => toggleGoalComplete(goal.id, checked as boolean)} />
                    <span className={`flex-1 text-sm sm:text-base ${goal.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {goal.goal_text}
                    </span>
                    {isEditMode && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => deleteGoal(goal.id)}>
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    )}
                  </div>)}
                <div className="flex gap-2 mt-3 sm:mt-4">
                  <Input 
                    placeholder="Add a new goal..." 
                    value={newGoalText} 
                    onChange={e => setNewGoalText(e.target.value)} 
                    onFocus={() => setIsEditMode(true)}
                    onBlur={() => setTimeout(() => setIsEditMode(false), 150)}
                    onKeyPress={e => e.key === 'Enter' && addDailyGoal()}
                    className="text-sm sm:text-base"
                  />
                  <Button onClick={addDailyGoal} disabled={!newGoalText.trim()} className="h-10 w-10 sm:h-auto sm:w-auto sm:px-4">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Chores */}
          {todaysChores.length > 0}

          {/* Exciting Agenda Button */}
          <div className="mb-4 sm:mb-6">
            <ExcitingAgendaButton />
          </div>
        </div>

        {/* Duck Catching Game - Hidden for now */}
        {/* {studentDbId && <DuckCatchingGame studentId={studentDbId} />} */}
      </div>
      
      <ProfileSettingsModal open={showProfileModal} onOpenChange={setShowProfileModal} student={student} onProfileUpdate={fetchStudentData} initialTab={profileModalTab} />
    </PomodoroProvider>;
}