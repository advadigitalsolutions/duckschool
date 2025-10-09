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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pencil, Trash2, User } from 'lucide-react';

export default function ParentDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [deletingStudent, setDeletingStudent] = useState<any>(null);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

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

      if (roleData?.role === 'student') {
        // Redirect to student dashboard if they're a student
        navigate('/student');
        return;
      }

      fetchDashboardData();
    } catch (error) {
      console.error('Error checking role:', error);
      fetchDashboardData();
    }
  };

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user profile for name
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single();

      setUserName(profileData?.name || 'Educator');
      setUserAvatar(profileData?.avatar_url || '');

      // Fetch students
      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .eq('parent_id', user.id);

      setStudents(studentsData || []);

      // Fetch today's attendance for this parent's students only
      const today = new Date().toISOString().split('T')[0];
      const studentIds = studentsData?.map(s => s.id) || [];
      
      if (studentIds.length > 0) {
        const { data: attendanceData } = await supabase
          .from('attendance_logs')
          .select('minutes')
          .eq('date', today)
          .in('student_id', studentIds);

        const totalMinutes = attendanceData?.reduce((sum, log) => sum + (log.minutes || 0), 0) || 0;
        setTodayMinutes(totalMinutes);
      } else {
        setTodayMinutes(0);
      }

      // Fetch completed assignments today
      const { data: completedData } = await supabase
        .from('assignments')
        .select('id')
        .eq('status', 'graded')
        .gte('created_at', new Date(today).toISOString());

      setCompletedToday(completedData?.length || 0);

      // Fetch overdue assignments
      const { data: overdueData } = await supabase
        .from('assignments')
        .select('id')
        .eq('status', 'assigned')
        .lt('due_at', new Date().toISOString());

      setOverdueCount(overdueData?.length || 0);
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/parent/profile')}>
              <AvatarImage src={userAvatar} />
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">Parent Dashboard</h1>
              <p className="text-sm text-muted-foreground">{getGreeting()} {userName}!</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Button variant="outline" size="icon" onClick={() => navigate('/parent/profile')}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-8">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayMinutes} min</div>
              <p className="text-xs text-muted-foreground">
                Goal: 60 min/day
              </p>
              <Progress value={(todayMinutes / 60) * 100} className="mt-2" />
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
                Assignments graded
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
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
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
                    <p className="text-muted-foreground">Activity feed coming soon...</p>
                  )}
                </div>
              </CardContent>
            </Card>
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

          <TabsContent value="curriculum" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Curriculum Management</CardTitle>
                <CardDescription>Create and manage lesson plans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">AI curriculum planner coming soon</p>
                  <p className="text-sm text-muted-foreground">
                    Upload materials, set standards, and let AI create personalized lesson plans
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
    </div>
  );
}
