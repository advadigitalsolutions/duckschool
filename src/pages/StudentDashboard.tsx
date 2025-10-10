import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  PlayCircle, 
  Clock, 
  Target,
  TrendingUp,
  Award,
  LogOut,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { XPDisplay } from '@/components/XPDisplay';
import { RewardsShop } from '@/components/RewardsShop';
import { StudentGrades } from '@/components/StudentGrades';
import { WeeklyView } from '@/components/WeeklyView';
import { OverdueWorkTab } from '@/components/OverdueWorkTab';
import { CustomizableHeader } from '@/components/CustomizableHeader';
import { ConfettiCelebration } from '@/components/ConfettiCelebration';
import { PomodoroProvider } from '@/contexts/PomodoroContext';

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [studentDbId, setStudentDbId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isBreak, setIsBreak] = useState(false);
  const [completedToday, setCompletedToday] = useState(0);
  const [streak, setStreak] = useState(0);
  const [dailyQuote, setDailyQuote] = useState('');
  const [dailyGoals, setDailyGoals] = useState<any[]>([]);
  const [newGoalText, setNewGoalText] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [headerSettings, setHeaderSettings] = useState<any>(null);
  const navigate = useNavigate();

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
      timerBackgroundColor: 'hsl(var(--muted))',
    },
    celebrateWins: true,
    show8BitStars: false,
    starColor: '#fbbf24',
    showClouds: false,
    cloudColor: 'rgba(255, 255, 255, 0.15)',
    headerVisibility: 'sticky' as const,
  });

  const saveHeaderSettings = async (newSettings: any) => {
    try {
      // Serialize countdowns for database storage
      const settingsToSave = {
        ...newSettings,
        countdowns: newSettings.countdowns?.map((countdown: any) => ({
          ...countdown,
          date: countdown.date instanceof Date ? countdown.date.toISOString() : countdown.date
        })) || []
      };

      const { error } = await supabase
        .from('students')
        .update({ header_settings: settingsToSave })
        .eq('id', student?.id);

      if (error) throw error;
      setHeaderSettings(newSettings);
      toast.success('Header settings saved!');
    } catch (error: any) {
      toast.error('Failed to save header settings');
    }
  };


  const motivationalQuotes = [
    "Your potential is endless. Go do what you were created to do.",
    "Success is the sum of small efforts repeated day in and day out.",
    "Don't watch the clock; do what it does. Keep going.",
    "The expert in anything was once a beginner.",
    "You are capable of amazing things.",
    "Believe you can and you're halfway there.",
    "Start where you are. Use what you have. Do what you can.",
    "The only way to do great work is to love what you do.",
    "Your limitation—it's only your imagination.",
    "Push yourself, because no one else is going to do it for you.",
    "Great things never come from comfort zones.",
    "Dream it. Wish it. Do it.",
    "Success doesn't just find you. You have to go out and get it.",
    "The harder you work for something, the greater you'll feel when you achieve it.",
    "Dream bigger. Do bigger.",
    "Don't stop when you're tired. Stop when you're done.",
    "Wake up with determination. Go to bed with satisfaction.",
    "Do something today that your future self will thank you for.",
    "Little things make big days.",
    "It's going to be hard, but hard does not mean impossible.",
    "Don't wait for opportunity. Create it.",
    "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
    "The key to success is to focus on goals, not obstacles.",
    "Dream it. Believe it. Build it.",
    "You don't have to be great to start, but you have to start to be great.",
    "Education is the most powerful weapon you can use to change the world.",
    "The beautiful thing about learning is that no one can take it away from you.",
    "Learning is not attained by chance; it must be sought for with ardor.",
    "Every accomplishment starts with the decision to try.",
    "Mistakes are proof that you are trying.",
    "The more that you read, the more things you will know.",
    "Don't let what you cannot do interfere with what you can do.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "You are braver than you believe, stronger than you seem, and smarter than you think.",
    "It always seems impossible until it's done.",
    "Keep your face always toward the sunshine—and shadows will fall behind you.",
    "The future belongs to those who believe in the beauty of their dreams.",
    "Believe in yourself and all that you are.",
    "You get what you work for, not what you wish for.",
    "Your attitude determines your direction.",
    "Fall seven times, stand up eight.",
    "The secret of getting ahead is getting started.",
    "It's not about perfect. It's about effort.",
    "Stay positive, work hard, make it happen.",
    "You are capable of more than you know.",
    "Do what you can, with what you have, where you are.",
    "Champions keep playing until they get it right.",
    "If you can dream it, you can do it.",
    "The only person you should try to be better than is the person you were yesterday.",
    "Learning never exhausts the mind.",
    "An investment in knowledge pays the best interest.",
    "The expert at anything was once a beginner.",
    "You don't learn to walk by following rules. You learn by doing, and by falling over.",
    "Study while others are sleeping; work while others are loafing.",
    "I have not failed. I've just found 10,000 ways that won't work.",
    "You miss 100% of the shots you don't take.",
    "Whether you think you can or you think you can't, you're right.",
    "The only impossible journey is the one you never begin.",
    "Try not to become a person of success, but rather try to become a person of value.",
    "Strive not to be a success, but rather to be of value.",
    "Two roads diverged in a wood, and I—I took the one less traveled by.",
    "I attribute my success to this: I never gave or took any excuse.",
    "You may be disappointed if you fail, but you are doomed if you don't try.",
    "It is during our darkest moments that we must focus to see the light.",
    "Whoever is happy will make others happy too.",
    "Do not go where the path may lead, go instead where there is no path and leave a trail.",
    "You will face many defeats in life, but never let yourself be defeated.",
    "In the middle of difficulty lies opportunity.",
    "Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.",
    "Life is 10% what happens to you and 90% how you react to it.",
    "Change your thoughts and you change your world.",
    "All our dreams can come true, if we have the courage to pursue them.",
    "The only limit to our realization of tomorrow will be our doubts of today.",
    "It is never too late to be what you might have been.",
    "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
    "You are never too old to set another goal or to dream a new dream.",
    "Everything you've ever wanted is on the other side of fear.",
    "Believe and act as if it were impossible to fail.",
    "The way to get started is to quit talking and begin doing.",
    "Don't be afraid to give up the good to go for the great.",
    "I find that the harder I work, the more luck I seem to have.",
    "Concentrate all your thoughts upon the work in hand. The sun's rays do not burn until brought to a focus.",
    "Either you run the day or the day runs you.",
    "I'm a greater believer in luck, and I find the harder I work the more I have of it.",
    "When something is important enough, you do it even if the odds are not in your favor.",
    "If you are not willing to risk the usual, you will have to settle for the ordinary.",
    "The people who are crazy enough to think they can change the world are the ones who do.",
    "Do one thing every day that scares you.",
    "All progress takes place outside the comfort zone.",
    "People who are crazy enough to think they can change the world, are the ones who do.",
    "Knowing is not enough; we must apply. Willing is not enough; we must do.",
    "We may encounter many defeats but we must not be defeated.",
    "Challenges are what make life interesting. Overcoming them is what makes life meaningful.",
    "If you want to lift yourself up, lift up someone else.",
    "I have learned over the years that when one's mind is made up, this diminishes fear.",
    "Courage doesn't always roar. Sometimes courage is the quiet voice saying 'I will try again tomorrow.'",
    "The only way of discovering the limits of the possible is to venture a little way past them into the impossible.",
    "You are enough just as you are.",
    "Everything is hard before it is easy.",
    "Small progress is still progress.",
  ];

  useEffect(() => {
    // Set a random quote on mount
    setDailyQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  }, []);

  useEffect(() => {
    checkRoleAndFetch();
  }, []);

  const checkRoleAndFetch = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData?.role === 'parent') {
        // Redirect to parent dashboard if they're a parent
        navigate('/parent');
        return;
      }

      fetchStudentData();
    } catch (error) {
      console.error('Error checking role:', error);
      fetchStudentData();
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  const fetchStudentData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch student profile
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (studentData) {
        setStudent(studentData);
        // Ensure header_settings has proper defaults
        const loadedSettings = (studentData.header_settings && typeof studentData.header_settings === 'object' && !Array.isArray(studentData.header_settings))
          ? studentData.header_settings as any
          : getDefaultHeaderSettings();
        // Ensure all arrays exist and deserialize dates
        setHeaderSettings({
          ...getDefaultHeaderSettings(),
          ...loadedSettings,
          locations: Array.isArray(loadedSettings.locations) ? loadedSettings.locations : [],
          customReminders: Array.isArray(loadedSettings.customReminders) ? loadedSettings.customReminders : [],
          countdowns: Array.isArray(loadedSettings.countdowns) 
            ? loadedSettings.countdowns.map((countdown: any) => ({
                ...countdown,
                date: typeof countdown.date === 'string' ? new Date(countdown.date) : countdown.date
              }))
            : [],
        });
      }

      // Fetch today's assignments
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select(`
          *,
          curriculum_items (
            title,
            type,
            est_minutes,
            body,
            course_id,
            courses (
              title
            )
          )
        `)
        .eq('status', 'assigned')
        .order('due_at', { ascending: true })
        .limit(5);

      setAssignments(assignmentsData || []);

      // Fetch courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('student_id', studentData?.id)
        .eq('archived', false)
        .order('created_at', { ascending: false });

      setCourses(coursesData || []);

      // Calculate completed today
      const today = new Date().toISOString().split('T')[0];
      const { data: completedData } = await supabase
        .from('submissions')
        .select('id')
        .eq('student_id', studentData?.id)
        .gte('submitted_at', new Date(today).toISOString());

      setCompletedToday(completedData?.length || 0);

      // Calculate streak from submissions
      await calculateStreak(studentData?.id);

      // Fetch today's goals
      await fetchDailyGoals(studentData?.id);
    } catch (error: any) {
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = async (studentId: string) => {
    try {
      // Get all submissions ordered by date
      const { data: submissions } = await supabase
        .from('submissions')
        .select('submitted_at')
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false });

      if (!submissions || submissions.length === 0) {
        setStreak(0);
        return;
      }

      // Group submissions by date
      const submissionDates = new Set(
        submissions.map(s => new Date(s.submitted_at).toISOString().split('T')[0])
      );

      // Calculate consecutive days
      let currentStreak = 0;
      let checkDate = new Date();
      
      // Check if there's a submission today or yesterday to start counting
      const today = checkDate.toISOString().split('T')[0];
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterday = checkDate.toISOString().split('T')[0];
      
      if (!submissionDates.has(today) && !submissionDates.has(yesterday)) {
        setStreak(0);
        return;
      }

      // Start from today and go backwards
      checkDate = new Date();
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (submissionDates.has(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (currentStreak === 0 && dateStr === today) {
          // If no submission today, check yesterday
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
      const { data, error } = await supabase
        .from('daily_goals')
        .select('*')
        .eq('student_id', studentId)
        .eq('date', today)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setDailyGoals(data || []);
    } catch (error) {
      console.error('Error fetching daily goals:', error);
    }
  };

  const addDailyGoal = async () => {
    if (!newGoalText.trim()) return;
    
    try {
      const { error } = await supabase
        .from('daily_goals')
        .insert({
          student_id: student.id,
          goal_text: newGoalText.trim(),
          date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;
      
      setNewGoalText('');
      await fetchDailyGoals(student.id);
      toast.success('Goal added!');
    } catch (error) {
      console.error('Error adding goal:', error);
      toast.error('Failed to add goal');
    }
  };

  const toggleGoalComplete = async (goalId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('daily_goals')
        .update({ completed })
        .eq('id', goalId);

      if (error) throw error;
      
      await fetchDailyGoals(student.id);
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Failed to update goal');
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('daily_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;
      
      await fetchDailyGoals(student.id);
      toast.success('Goal deleted');
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleTimerComplete = () => {
    setTimerRunning(false);
    if (isBreak) {
      toast.success('Break time is over! Ready to continue?');
      setTimeLeft(25 * 60);
      setIsBreak(false);
    } else {
      toast.success('Great work! Time for a break!');
      setTimeLeft(5 * 60);
      setIsBreak(true);
    }
  };

  const toggleTimer = () => {
    setTimerRunning(!timerRunning);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimeLeft(isBreak ? 5 * 60 : 25 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <PomodoroProvider studentId={studentDbId || undefined}>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <ConfettiCelebration active={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      {headerSettings && (
        <CustomizableHeader
          student={student}
          settings={headerSettings}
          onSaveSettings={saveHeaderSettings}
          onSignOut={handleSignOut}
          onDemoCelebration={() => setShowConfetti(true)}
        />
      )}

      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        {/* Weekly Progress Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Weekly Progress</CardTitle>
            <CardDescription>Your progress for this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Weekly Completion</span>
              <span className="text-2xl font-bold">{completedToday}/5 days</span>
            </div>
            <Progress value={(completedToday / 5) * 100} className="h-2" />
          </CardContent>
        </Card>

        {/* Overdue Work Alert */}
        {student?.id && <OverdueWorkTab studentId={student.id} />}

        {/* Today's Work */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Today's Work</CardTitle>
            <CardDescription>Assignments for today</CardDescription>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No assignments for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <Card 
                    key={assignment.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => navigate(`/assignment/${assignment.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">
                            {assignment.curriculum_items?.title}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{assignment.curriculum_items?.est_minutes || 30} min</span>
                            <span>•</span>
                            <span>{assignment.curriculum_items?.courses?.title}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Start</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* This Week's View */}
        {student?.id && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>This Week's Schedule</CardTitle>
              <CardDescription>Your assignments for the week</CardDescription>
            </CardHeader>
            <CardContent>
              <WeeklyView studentId={student.id} />
            </CardContent>
          </Card>
        )}

        {/* Pomodoro Timer Card */}
        <Card className="mb-8 border-2 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>
              {isBreak ? '☕ Break Time' : '📚 Focus Time'}
            </CardTitle>
            <CardDescription>
              {isBreak ? 'Rest and recharge' : 'Stay focused on your task'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-6xl font-bold mb-4">
                {formatTime(timeLeft)}
              </div>
              <Progress 
                value={(timeLeft / (isBreak ? 5 * 60 : 25 * 60)) * 100} 
                className="h-3"
              />
            </div>
            <div className="flex justify-center space-x-4">
              <Button
                size="lg"
                onClick={toggleTimer}
                className="min-w-32"
              >
                {timerRunning ? (
                  <>
                    <Pause className="mr-2 h-5 w-5" />
                    Pause
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Start
                  </>
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={resetTimer}
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Progress</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedToday}</div>
              <p className="text-xs text-muted-foreground">
                Tasks completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <TrendingUp className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{streak} days</div>
              <p className="text-xs text-muted-foreground">
                Keep it going!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">XP Earned</CardTitle>
              <Award className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedToday * 50}</div>
              <p className="text-xs text-muted-foreground">
                This week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Tasks</CardTitle>
            <CardDescription>Your assignments for today</CardDescription>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <div className="text-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No tasks assigned yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Check back later or ask your teacher
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <Card key={assignment.id} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {assignment.curriculum_items?.courses?.title && (
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              {assignment.curriculum_items.courses.title}
                            </div>
                          )}
                          <CardTitle className="text-base">
                            {assignment.curriculum_items?.title || 'Untitled Assignment'}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            <Clock className="inline h-3 w-3 mr-1" />
                            {assignment.curriculum_items?.est_minutes || 30} minutes
                          </CardDescription>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => navigate(`/assignment/${assignment.id}`)}
                        >
                          Start
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Courses */}
        {courses.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>My Courses 📚</CardTitle>
              <CardDescription>Track your progress in each subject</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {courses.map((course) => (
                  <Card key={course.id} className="border-2 hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <CardTitle className="text-base">{course.title}</CardTitle>
                      <CardDescription>{course.subject}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        className="w-full"
                        onClick={() => navigate(`/course/${course.id}`)}
                      >
                        View Progress Dashboard
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Micro Goals */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Today's Micro-Goals 🎯</CardTitle>
            <CardDescription>Small steps to keep you on track</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Add new goal */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a new goal..."
                  value={newGoalText}
                  onChange={(e) => setNewGoalText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addDailyGoal()}
                />
                <Button onClick={addDailyGoal} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Goals list */}
              <div className="space-y-2">
                {dailyGoals.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No goals yet. Add one above to get started!
                  </p>
                ) : (
                  dailyGoals.map((goal) => (
                    <div key={goal.id} className="flex items-center gap-2 group">
                      <Checkbox
                        checked={goal.completed}
                        onCheckedChange={(checked) => toggleGoalComplete(goal.id, checked as boolean)}
                      />
                      <span className={`text-sm flex-1 ${goal.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {goal.goal_text}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteGoal(goal.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Grades */}
        {student?.id && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>My Grades 📊</CardTitle>
              <CardDescription>Track your academic performance</CardDescription>
            </CardHeader>
            <CardContent>
              <StudentGrades studentId={student.id} />
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </PomodoroProvider>
  );
}
