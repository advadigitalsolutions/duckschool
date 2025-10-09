import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  PlayCircle, 
  Clock, 
  Target,
  TrendingUp,
  Award,
  LogOut,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isBreak, setIsBreak] = useState(false);
  const [completedToday, setCompletedToday] = useState(0);
  const [streak, setStreak] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudentData();
  }, []);

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
        .single();

      setStudent(studentData);

      // Fetch today's assignments
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select(`
          *,
          curriculum_items (
            title,
            type,
            est_minutes,
            body
          )
        `)
        .eq('status', 'assigned')
        .order('due_at', { ascending: true })
        .limit(5);

      setAssignments(assignmentsData || []);

      // Calculate completed today
      const today = new Date().toISOString().split('T')[0];
      const { data: completedData } = await supabase
        .from('submissions')
        .select('id')
        .eq('student_id', studentData?.id)
        .gte('submitted_at', new Date(today).toISOString());

      setCompletedToday(completedData?.length || 0);

      // TODO: Calculate streak from progress_events
      setStreak(3);
    } catch (error: any) {
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {student?.name || 'Student'}!</h1>
            <p className="text-sm text-muted-foreground">Let's make today count 🎯</p>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
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
                        <div>
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

        {/* Micro Goals */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Today's Micro-Goals 🎯</CardTitle>
            <CardDescription>Small steps to keep you on track</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="h-4 w-4" />
                <span className="text-sm">Complete morning math lesson</span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="h-4 w-4" />
                <span className="text-sm">Read 2 chapters of history</span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="h-4 w-4" />
                <span className="text-sm">Write science lab report</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
