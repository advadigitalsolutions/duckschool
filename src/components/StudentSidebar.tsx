import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Home, BookOpen, Calendar, Trophy, Timer, ChevronDown, GraduationCap, BarChart3, Award, ShoppingBag, Activity, ClipboardList, CalendarDays, ListTodo } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, useSidebar } from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
export function StudentSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    state
  } = useSidebar();
  const [student, setStudent] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch student data
      const {
        data: studentData
      } = await supabase.from('students').select('*').eq('user_id', user.id).single();
      if (studentData) {
        setStudent(studentData);

        // Fetch courses
        const {
          data: coursesData
        } = await supabase.from('courses').select('*').eq('student_id', studentData.id).order('title');
        setCourses(coursesData || []);
      }
    } catch (error) {
      console.error('Error fetching sidebar data:', error);
    }
  };
  const isActive = (path: string) => location.pathname === path;
  return <Sidebar className={state === "collapsed" ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => navigate('/student')} className={isActive('/student') ? 'bg-accent text-accent-foreground' : ''}>
                <Home className="h-4 w-4" />
                {state !== "collapsed" && <span>Dashboard</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* My Courses */}
        <SidebarGroup>
          <Collapsible>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center justify-between group hover:bg-accent/50 rounded-md px-2 py-1.5 transition-colors">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {state !== "collapsed" && <span className="font-medium">My Courses</span>}
                </div>
                {state !== "collapsed" && <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {courses.length > 0 ? <div className="max-h-48 overflow-y-auto space-y-0.5 py-1">
                      {courses.map(course => <SidebarMenuItem key={course.id}>
                          <SidebarMenuButton onClick={() => navigate(`/course/${course.id}`)} className={`
                              transition-all duration-200 
                              ${isActive(`/course/${course.id}`) ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-accent hover:text-accent-foreground'}
                            `}>
                            <GraduationCap className="h-4 w-4 flex-shrink-0" />
                            {state !== "collapsed" && <span className="truncate text-sm">{course.title}</span>}
                          </SidebarMenuButton>
                        </SidebarMenuItem>)}
                    </div> : state !== "collapsed" && <div className="px-3 py-2 text-sm text-muted-foreground italic">
                        No courses yet
                      </div>}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Learning */}
        <SidebarGroup>
          <Collapsible>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center justify-between group hover:bg-accent/50 rounded-md px-2 py-1.5 transition-colors">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {state !== "collapsed" && <span className="font-medium">Learning</span>}
                </div>
                {state !== "collapsed" && <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/student/assignments')} className={isActive('/student/assignments') ? 'bg-accent text-accent-foreground' : ''}>
                      <ClipboardList className="h-4 w-4" />
                      {state !== "collapsed" && <span>Assignments</span>}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/student/agenda')} className={isActive('/student/agenda') ? 'bg-accent text-accent-foreground' : ''}>
                      <ListTodo className="h-4 w-4" />
                      {state !== "collapsed" && <span>Agenda</span>}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/student/calendar')} className={isActive('/student/calendar') ? 'bg-accent text-accent-foreground' : ''}>
                      <CalendarDays className="h-4 w-4" />
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
          <Collapsible>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center justify-between group hover:bg-accent/50 rounded-md px-2 py-1.5 transition-colors">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-[hsl(var(--chart-1))]" />
                  {state !== "collapsed" && <span className="font-medium">XP & Progress</span>}
                </div>
                {state !== "collapsed" && <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/student/xp')} className={isActive('/student/xp') ? 'bg-accent text-accent-foreground' : ''}>
                      <Trophy className="h-4 w-4" />
                      {state !== "collapsed" && <span>My XP</span>}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/student/rewards')} className={isActive('/student/rewards') ? 'bg-accent text-accent-foreground' : ''}>
                      <ShoppingBag className="h-4 w-4" />
                      {state !== "collapsed" && <span>Rewards Shop</span>}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/student/mastery')} className={isActive('/student/mastery') ? 'bg-accent text-accent-foreground' : ''}>
                      <BarChart3 className="h-4 w-4" />
                      {state !== "collapsed" && <span>Progress
                    </span>}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/student/grades')} className={isActive('/student/grades') ? 'bg-accent text-accent-foreground' : ''}>
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
          <Collapsible>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center justify-between group hover:bg-accent/50 rounded-md px-2 py-1.5 transition-colors">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-[hsl(var(--chart-2))]" />
                  {state !== "collapsed" && <span className="font-medium">Focus Tools</span>}
                </div>
                {state !== "collapsed" && <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/focus-tools')} className={isActive('/focus-tools') ? 'bg-accent text-accent-foreground' : ''}>
                      <Timer className="h-4 w-4" />
                      {state !== "collapsed" && <span>Focus Tools</span>}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/student/focus-stats')} className={isActive('/student/focus-stats') ? 'bg-accent text-accent-foreground' : ''}>
                      <Activity className="h-4 w-4" />
                      {state !== "collapsed" && <span>Session Stats</span>}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>;
}