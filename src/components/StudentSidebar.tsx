import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Home,
  BookOpen,
  Calendar,
  Trophy,
  Target,
  Timer,
  Settings,
  ChevronDown,
  Plus,
  GraduationCap,
  BarChart3,
  Award,
  ShoppingBag,
  Activity
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

export function StudentSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const [student, setStudent] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch student data
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (studentData) {
        setStudent(studentData);

        // Fetch courses
        const { data: coursesData } = await supabase
          .from('courses')
          .select('*')
          .eq('student_id', studentData.id)
          .order('title');
        setCourses(coursesData || []);

        // Fetch overdue count
        const now = new Date().toISOString();
        const { data: overdueData } = await supabase
          .from('assignments')
          .select('id, curriculum_items!inner(courses!inner(student_id))')
          .eq('curriculum_items.courses.student_id', studentData.id)
          .eq('status', 'assigned')
          .lt('due_at', now);
        setOverdueCount(overdueData?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching sidebar data:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    localStorage.clear();
    sessionStorage.clear();
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/student')}
                className={isActive('/student') ? 'bg-accent text-accent-foreground' : ''}
              >
                <Home className="h-4 w-4" />
                {state !== "collapsed" && <span>Dashboard</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* My Courses */}
        <SidebarGroup>
          <Collapsible defaultOpen>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {state !== "collapsed" && <span>My Courses</span>}
                </div>
                {state !== "collapsed" && <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {courses.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {courses.map((course) => (
                        <SidebarMenuItem key={course.id}>
                          <SidebarMenuButton
                            onClick={() => navigate(`/course/${course.id}`)}
                            className={isActive(`/course/${course.id}`) ? 'bg-accent text-accent-foreground' : ''}
                          >
                            <GraduationCap className="h-4 w-4" />
                            {state !== "collapsed" && <span className="truncate">{course.title}</span>}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </div>
                  ) : (
                    state !== "collapsed" && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No courses yet
                      </div>
                    )
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Assignments */}
        <SidebarGroup>
          <Collapsible defaultOpen>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {state !== "collapsed" && <span>Assignments</span>}
                </div>
                {state !== "collapsed" && overdueCount > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {overdueCount}
                  </Badge>
                )}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/student')}>
                      {state !== "collapsed" && <span>This Week</span>}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/student')}>
                      {state !== "collapsed" && <span>Calendar</span>}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* XP & Progress */}
        <SidebarGroup>
          <Collapsible defaultOpen>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-[hsl(var(--chart-1))]" />
                  {state !== "collapsed" && <span>XP & Progress</span>}
                </div>
                {state !== "collapsed" && <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      onClick={() => navigate('/student/xp')}
                      className={isActive('/student/xp') ? 'bg-accent text-accent-foreground' : ''}
                    >
                      <Trophy className="h-4 w-4" />
                      {state !== "collapsed" && <span>My XP</span>}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      onClick={() => navigate('/student/rewards')}
                      className={isActive('/student/rewards') ? 'bg-accent text-accent-foreground' : ''}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      {state !== "collapsed" && <span>Rewards Shop</span>}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      onClick={() => navigate('/student/mastery')}
                      className={isActive('/student/mastery') ? 'bg-accent text-accent-foreground' : ''}
                    >
                      <BarChart3 className="h-4 w-4" />
                      {state !== "collapsed" && <span>Mastery Dashboard</span>}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      onClick={() => navigate('/student/grades')}
                      className={isActive('/student/grades') ? 'bg-accent text-accent-foreground' : ''}
                    >
                      <Award className="h-4 w-4" />
                      {state !== "collapsed" && <span>Grades</span>}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Focus Tools */}
        <SidebarGroup>
          <Collapsible defaultOpen>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-[hsl(var(--chart-2))]" />
                  {state !== "collapsed" && <span>Focus Tools</span>}
                </div>
                {state !== "collapsed" && <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/pomodoro-fullscreen')}>
                      <Timer className="h-4 w-4" />
                      {state !== "collapsed" && <span>Pomodoro Timer</span>}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      onClick={() => navigate('/student/focus-stats')}
                      className={isActive('/student/focus-stats') ? 'bg-accent text-accent-foreground' : ''}
                    >
                      <Activity className="h-4 w-4" />
                      {state !== "collapsed" && <span>Session Stats</span>}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup>
          <Collapsible>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {state !== "collapsed" && <span>Settings</span>}
                </div>
                {state !== "collapsed" && <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      onClick={() => navigate('/student/profile')}
                      className={isActive('/student/profile') ? 'bg-accent text-accent-foreground' : ''}
                    >
                      {state !== "collapsed" && <span>Profile</span>}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* User Profile at Bottom */}
        {student && (
          <div className="mt-auto border-t pt-4 px-3">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={student.avatar_url} />
                <AvatarFallback>{student.name?.[0]}</AvatarFallback>
              </Avatar>
              {state !== "collapsed" && (
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate">{student.display_name || student.name}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="flex-1"
              >
                {state !== "collapsed" && <span>Sign Out</span>}
              </Button>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
