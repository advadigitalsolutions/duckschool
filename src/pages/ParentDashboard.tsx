import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp,
  FileText,
  Settings,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { XPConfigDialog } from '@/components/XPConfigDialog';
import { RewardsManagement } from '@/components/RewardsManagement';
import { RedemptionApprovals } from '@/components/RedemptionApprovals';
import { AddStudentDialog } from '@/components/AddStudentDialog';
import { EditStudentDialog } from '@/components/EditStudentDialog';
import { DeleteStudentDialog } from '@/components/DeleteStudentDialog';
import { CurriculumPlanningDialog } from '@/components/CurriculumPlanningDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pencil, Trash2, User, Sparkles } from 'lucide-react';
import { ActivityFeed } from '@/components/ActivityFeed';
import { WeeklyView } from '@/components/WeeklyView';
import { ParentPomodoroControls } from '@/components/ParentPomodoroControls';
import { CustomizableHeader } from '@/components/CustomizableHeader';
import { ConfettiCelebration } from '@/components/ConfettiCelebration';
import { PomodoroProvider } from '@/contexts/PomodoroContext';

export default function ParentDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [weekMinutes, setWeekMinutes] = useState(0);
  const [allTimeMinutes, setAllTimeMinutes] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [deletingStudent, setDeletingStudent] = useState<any>(null);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [showPlanningDialog, setShowPlanningDialog] = useState(false);
  const [planningSessions, setPlanningSessions] = useState<any[]>([]);
  const [resumingSessionId, setResumingSessionId] = useState<string | undefined>();
  const [headerSettings, setHeaderSettings] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  const getDefaultHeaderSettings = () => ({
    showName: true,
    customName: null,
    showGrade: false,
    customGrade: null,
    greetingType: 'time-based' as const,
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
      soundEffect: 'chime' as const,
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

  useEffect(() => {
    checkRoleAndFetch();
  }, []);

  const checkRoleAndFetch = async () => {
    console.log('[ParentDashboard] Checking role...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[ParentDashboard] No user, redirecting to auth');
        navigate('/auth', { replace: true });
        return;
      }

      console.log('[ParentDashboard] User ID:', user.id);

      // Check user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      console.log('[ParentDashboard] Role data:', roleData);

      if (roleData?.role === 'student') {
        // Redirect to student dashboard if they're a student
        console.log('[ParentDashboard] User is student, redirecting to /student');
        navigate('/student', { replace: true });
        return;
      }

      console.log('[ParentDashboard] Fetching dashboard data...');
      fetchDashboardData();
    } catch (error) {
      console.error('[ParentDashboard] Error checking role:', error);
      // On error, still try to check if user is student by checking students table
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        console.log('[ParentDashboard] Student check result:', studentData);
        
        if (studentData) {
          console.log('[ParentDashboard] Found student record, redirecting to /student');
          navigate('/student', { replace: true });
          return;
        }
      }
      fetchDashboardData();
    }
  };

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user profile for name and settings
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setUserName(profileData?.name || 'Educator');
      setUserAvatar(profileData?.avatar_url || '');
      setProfile(profileData);

      // Load header settings from profile or use defaults
      const loadedSettings = profileData?.header_settings && typeof profileData.header_settings === 'object' 
        ? profileData.header_settings as any 
        : {};
      
      const finalSettings = {
        ...getDefaultHeaderSettings(),
        ...loadedSettings,
        locations: Array.isArray(loadedSettings.locations) ? loadedSettings.locations : [],
        customReminders: Array.isArray(loadedSettings.customReminders) ? loadedSettings.customReminders : [],
        countdowns: Array.isArray(loadedSettings.countdowns) 
          ? loadedSettings.countdowns.map((countdown: any) => ({
              ...countdown,
              date: typeof countdown.date === 'string' ? new Date(countdown.date) : countdown.date
            })) 
          : []
      };
      
      setHeaderSettings(finalSettings);

      // Fetch students
      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .eq('parent_id', user.id);

      setStudents(studentsData || []);

      // Fetch attendance data for this parent's students
      const today = new Date().toISOString().split('T')[0];
      const studentIds = studentsData?.map(s => s.id) || [];
      
      if (studentIds.length > 0) {
        // Today's time
        const { data: todayAttendance, error: todayError } = await supabase
          .from('attendance_logs')
          .select('minutes')
          .eq('date', today)
          .in('student_id', studentIds);

        if (todayError) {
          console.error('[ParentDashboard] Error fetching today attendance:', todayError);
        }
        console.log('[ParentDashboard] Today attendance data:', todayAttendance);

        const todayTotal = todayAttendance?.reduce((sum, log) => sum + (log.minutes || 0), 0) || 0;
        setTodayMinutes(todayTotal);

        // This week's time (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];

        const { data: weekAttendance, error: weekError } = await supabase
          .from('attendance_logs')
          .select('minutes')
          .gte('date', weekAgoStr)
          .in('student_id', studentIds);

        if (weekError) {
          console.error('[ParentDashboard] Error fetching week attendance:', weekError);
        }
        console.log('[ParentDashboard] Week attendance data:', weekAttendance);

        const weekTotal = weekAttendance?.reduce((sum, log) => sum + (log.minutes || 0), 0) || 0;
        setWeekMinutes(weekTotal);

        // All time
        const { data: allTimeAttendance, error: allTimeError } = await supabase
          .from('attendance_logs')
          .select('minutes')
          .in('student_id', studentIds);

        if (allTimeError) {
          console.error('[ParentDashboard] Error fetching all time attendance:', allTimeError);
        }
        console.log('[ParentDashboard] All time attendance data:', allTimeAttendance);

        const allTimeTotal = allTimeAttendance?.reduce((sum, log) => sum + (log.minutes || 0), 0) || 0;
        setAllTimeMinutes(allTimeTotal);
      } else {
        setTodayMinutes(0);
        setWeekMinutes(0);
        setAllTimeMinutes(0);
      }

      // Fetch completed submissions today
      if (studentIds.length > 0) {
        const { data: completedData } = await supabase
          .from('submissions')
          .select('id')
          .gte('submitted_at', new Date(today).toISOString())
          .in('student_id', studentIds);

        setCompletedToday(completedData?.length || 0);
      } else {
        setCompletedToday(0);
      }

      // Fetch overdue assignments for this parent's students
      if (studentIds.length > 0) {
        const { data: overdueData, error: overdueError } = await supabase
          .from('assignments')
          .select('id, curriculum_item_id, curriculum_items!inner(course_id, courses!inner(student_id))')
          .eq('status', 'assigned')
          .lt('due_at', new Date().toISOString())
          .in('curriculum_items.courses.student_id', studentIds);

        if (overdueError) {
          console.error('[ParentDashboard] Error fetching overdue assignments:', overdueError);
        }
        console.log('[ParentDashboard] Overdue assignments data:', overdueData);

        setOverdueCount(overdueData?.length || 0);
      } else {
        setOverdueCount(0);
      }

      // Fetch in-progress curriculum planning sessions
      const { data: sessionsData } = await supabase
        .from('curriculum_planning_sessions')
        .select('*')
        .eq('parent_id', user.id)
        .eq('status', 'in_progress')
        .order('updated_at', { ascending: false });

      setPlanningSessions(sessionsData || []);
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const saveHeaderSettings = async (newSettings: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Serialize countdowns for database storage
      const settingsToSave = {
        ...newSettings,
        countdowns: newSettings.countdowns?.map((countdown: any) => ({
          ...countdown,
          date: countdown.date instanceof Date ? countdown.date.toISOString() : countdown.date
        })) || []
      };

      const { error } = await supabase
        .from('profiles')
        .update({ header_settings: settingsToSave })
        .eq('id', user.id);

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Create a mock student object for the header to use parent profile data
  const mockStudentForHeader = profile ? {
    id: profile.id,
    name: profile.name || 'Educator',
    display_name: profile.name || 'Educator',
    avatar_url: profile.avatar_url,
    grade_level: null,
    pronouns: profile.pronouns
  } : null;

  return (
    <PomodoroProvider>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <ConfettiCelebration active={showConfetti} onComplete={() => setShowConfetti(false)} />
        
        {headerSettings && mockStudentForHeader && (
          <CustomizableHeader
            student={mockStudentForHeader}
            settings={headerSettings}
            onSaveSettings={saveHeaderSettings}
            onSignOut={handleSignOut}
            onDemoCelebration={() => setShowConfetti(true)}
          />
        )}

      <div className="container mx-auto p-4 md:p-8">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayMinutes} min</div>
              <p className="text-xs text-muted-foreground">
                Across all students
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time This Week</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weekMinutes} min</div>
              <p className="text-xs text-muted-foreground">
                Last 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">All Time</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(allTimeMinutes / 60)} hrs</div>
              <p className="text-xs text-muted-foreground">
                Total logged
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedToday}</div>
              <p className="text-xs text-muted-foreground">
                Submissions completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overdueCount}</div>
              <p className="text-xs text-muted-foreground">
                Needs attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="pomodoro">Pomodoro Timers</TabsTrigger>
            <TabsTrigger value="weekly-plans">Weekly Plans</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum Planning</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="todo">To Do List</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates from your students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {students.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No students added yet</p>
                    <AddStudentDialog onStudentAdded={fetchDashboardData} />
                  </div>
                  ) : (
                    <ActivityFeed studentIds={students.map(s => s.id)} />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pomodoro" className="space-y-4">
            <ParentPomodoroControls />
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Students</CardTitle>
                  <CardDescription>Manage your homeschool students</CardDescription>
                </div>
                <AddStudentDialog onStudentAdded={fetchDashboardData} />
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No students yet. Click "Add Student" above to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {students.map((student) => (
                      <Card 
                        key={student.id} 
                        className="hover:border-primary transition-colors"
                      >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                          <div 
                            className="flex items-center gap-4 flex-1 cursor-pointer"
                            onClick={() => navigate(`/student/${student.id}`)}
                          >
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={student.avatar_url || ''} />
                              <AvatarFallback>
                                <User className="h-6 w-6" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{student.name}</CardTitle>
                              <CardDescription>Grade {student.grade_level || 'N/A'}</CardDescription>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingStudent(student);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingStudent(student);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly-plans" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>AI Weekly Curriculum</CardTitle>
                    <CardDescription>Automated personalized learning plans for your students</CardDescription>
                  </div>
                  <Button onClick={() => navigate('/weekly-curriculum')}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Manage Weekly Curriculum
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {students.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Add students to start generating weekly curriculum</p>
                  </div>
                ) : (
                  students.map((student) => (
                    <Card key={student.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={student.avatar_url || ''} />
                              <AvatarFallback>
                                <User className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{student.name}</CardTitle>
                              <CardDescription>This week's learning plan</CardDescription>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/student/${student.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <WeeklyView studentId={student.id} />
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="curriculum" className="space-y-4">
            {planningSessions.length > 0 && (
              <Card className="border-orange-500/50 bg-orange-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    Resume Planning Sessions
                  </CardTitle>
                  <CardDescription>
                    You have {planningSessions.length} curriculum planning session{planningSessions.length > 1 ? 's' : ''} in progress
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {planningSessions.map((session) => {
                    const data = (session.collected_data as unknown as any) || {};
                    return (
                      <Card key={session.id} className="bg-background">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="font-medium">
                                {data.studentName ? `Planning for ${data.studentName}` : 'Curriculum Planning'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Last updated: {new Date(session.updated_at).toLocaleDateString()}
                              </p>
                              {data.gradeLevel && (
                                <p className="text-xs text-muted-foreground">
                                  Grade: {data.gradeLevel}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => {
                                  setResumingSessionId(session.id);
                                  setShowPlanningDialog(true);
                                }}
                                variant="outline"
                              >
                                Resume
                              </Button>
                              <Button
                                onClick={async () => {
                                  try {
                                    const { error } = await supabase
                                      .from('curriculum_planning_sessions')
                                      .delete()
                                      .eq('id', session.id);
                                    
                                    if (error) throw error;
                                    
                                    setPlanningSessions(planningSessions.filter(s => s.id !== session.id));
                                    toast.success('Planning session deleted');
                                  } catch (error: any) {
                                    toast.error('Failed to delete session');
                                  }
                                }}
                                variant="ghost"
                                size="icon"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-primary/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <CardTitle>AI Curriculum Planning</CardTitle>
                  </div>
                  <CardDescription>
                    Create personalized, standards-aligned curriculum plans through conversation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Our AI assistant will guide you through creating a complete curriculum plan tailored to your student's needs, learning style, and educational goals.
                  </p>
                  <Button 
                    onClick={() => {
                      setResumingSessionId(undefined);
                      setShowPlanningDialog(true);
                    }} 
                    className="w-full"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Start New Planning Session
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Add Student</CardTitle>
                  <CardDescription>
                    Manually add a student profile without AI assistance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Use this option if you prefer to set up courses and curriculum yourself, or if you're adding additional students.
                  </p>
                  <AddStudentDialog onStudentAdded={fetchDashboardData} />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Course Templates</CardTitle>
                <CardDescription>Browse pre-built curriculum plans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Template library coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reports & Transcripts</CardTitle>
                <CardDescription>California-compliant documentation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Attendance Log
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Grade Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Transcript
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="todo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Implementation To Do List</CardTitle>
                <CardDescription>Areas requiring your input</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 rounded-lg border p-3">
                    <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium">Add Student Profile</p>
                      <p className="text-sm text-muted-foreground">Create Isaiah's student profile with grade level and accommodations</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 rounded-lg border p-3">
                    <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium">California Standards Data</p>
                      <p className="text-sm text-muted-foreground">Seed CA Common Core, NGSS, HSS, PE, and Spanish standards</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 rounded-lg border p-3">
                    <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium">Upload Initial Curriculum Materials</p>
                      <p className="text-sm text-muted-foreground">Upload PDFs, links to Khan Academy, YouTube videos, or notes about learning goals</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 rounded-lg border p-3">
                    <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium">AI Plan Builder Configuration</p>
                      <p className="text-sm text-muted-foreground">Configure AI chatbot for lesson planning and curriculum generation</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 rounded-lg border p-3">
                    <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium">OCR Integration Setup</p>
                      <p className="text-sm text-muted-foreground">Enable handwriting and worksheet scanning for work samples</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 rounded-lg border p-3">
                    <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium">Grading Rubrics</p>
                      <p className="text-sm text-muted-foreground">Define 4-point standards-based rubrics for assessments</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 rounded-lg border p-3">
                    <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium">Spanish Curriculum Specifics</p>
                      <p className="text-sm text-muted-foreground">Define Spanish language learning goals and resources</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 rounded-lg border p-3">
                    <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium">PE Activity Tracking</p>
                      <p className="text-sm text-muted-foreground">Define how to track and document physical education activities</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="xp" className="space-y-4">
            <div className="flex items-center justify-end mb-4">
              <XPConfigDialog />
            </div>
            <RedemptionApprovals />
            <RewardsManagement />
          </TabsContent>
        </Tabs>
      </div>

      <EditStudentDialog
        student={editingStudent}
        open={!!editingStudent}
        onOpenChange={(open) => !open && setEditingStudent(null)}
        onStudentUpdated={fetchDashboardData}
      />

      <DeleteStudentDialog
        student={deletingStudent}
        open={!!deletingStudent}
        onOpenChange={(open) => !open && setDeletingStudent(null)}
        onStudentDeleted={fetchDashboardData}
      />

        <CurriculumPlanningDialog
          open={showPlanningDialog}
          onOpenChange={(open) => {
            setShowPlanningDialog(open);
            if (!open) {
              setResumingSessionId(undefined);
            }
          }}
          onComplete={fetchDashboardData}
          existingSessionId={resumingSessionId}
        />
      </div>
    </PomodoroProvider>
  );
}
