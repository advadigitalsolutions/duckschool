import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Home, BookOpen, Calendar, Trophy, Timer, ChevronDown, GraduationCap, BarChart3, Award, ShoppingBag, Activity, ClipboardList, CalendarDays, ListTodo, Sparkles, ListChecks } from 'lucide-react';
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
  const isCollapsed = state === "collapsed";
  return <Sidebar className={isCollapsed ? "w-16" : "w-60"} collapsible="icon">
      <SidebarContent>
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => navigate('/student')} className={isActive('/student') ? 'bg-accent text-accent-foreground' : ''}>
                <Home className="h-5 w-5" />
                {!isCollapsed && <span>Dashboard</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* My Courses */}
        <SidebarGroup>
          <Collapsible defaultOpen={false}>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center justify-between group hover:bg-accent/50 rounded-md px-2 py-1.5 transition-colors">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {!isCollapsed && <span className="font-medium">My Courses</span>}
                </div>
                {!isCollapsed && <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            {!isCollapsed && <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {courses.length > 0 ? <div className="relative rounded-lg border-2 border-primary/30 bg-background/50 backdrop-blur-sm p-2 transition-all duration-300 group-data-[state=open]:border-primary/50 group-data-[state=open]:shadow-lg group-data-[state=open]:shadow-primary/20">
                        <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
                          {courses.map(course => <SidebarMenuItem key={course.id}>
                              <SidebarMenuButton onClick={() => navigate(`/course/${course.id}`)} className={`
                                  transition-all duration-200 
                                  ${isActive(`/course/${course.id}`) ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-accent hover:text-accent-foreground'}
                                `}>
                                <GraduationCap className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate text-sm">{course.title}</span>
                              </SidebarMenuButton>
                            </SidebarMenuItem>)}
                        </div>
                      </div> : <div className="px-3 py-2 text-sm text-muted-foreground italic">
                          No courses yet
                        </div>}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>}
          </Collapsible>
        </SidebarGroup>

        {/* Learning */}
        <SidebarGroup>
          <Collapsible defaultOpen={false}>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center justify-between group hover:bg-accent/50 rounded-md px-2 py-1.5 transition-colors">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {!isCollapsed && <span className="font-medium">My Work</span>}
                </div>
                {!isCollapsed && <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            {!isCollapsed && <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton onClick={() => navigate('/student/agenda')} className={isActive('/student/agenda') ? 'bg-accent text-accent-foreground' : ''}>
                        <ListTodo className="h-4 w-4" />
                        <span>Agenda</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton onClick={() => navigate('/student/assignments')} className={isActive('/student/assignments') ? 'bg-accent text-accent-foreground' : ''}>
                        <ClipboardList className="h-4 w-4" />
                        <span>Assignments</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton onClick={() => navigate('/student/chores')} className={isActive('/student/chores') ? 'bg-accent text-accent-foreground' : ''}>
                        <ListChecks className="h-4 w-4" />
                        <span>Chores</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton onClick={() => navigate('/student/calendar')} className={isActive('/student/calendar') ? 'bg-accent text-accent-foreground' : ''}>
                        <CalendarDays className="h-4 w-4" />
                        <span>Calendar</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarGroupContent>
              </CollapsibleContent>}
          </Collapsible>
        </SidebarGroup>

        {/* XP & Progress */}
        <SidebarGroup>
          <Collapsible defaultOpen={false}>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center justify-between group hover:bg-accent/50 rounded-md px-2 py-1.5 transition-colors">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-[hsl(var(--chart-1))]" />
                  {!isCollapsed && <span className="font-medium">XP & Progress</span>}
                </div>
                {!isCollapsed && <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            {!isCollapsed && <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton onClick={() => navigate('/student/xp')} className={isActive('/student/xp') ? 'bg-accent text-accent-foreground' : ''}>
                        <Trophy className="h-4 w-4" />
                        <span>My XP</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton onClick={() => navigate('/student/rewards')} className={isActive('/student/rewards') ? 'bg-accent text-accent-foreground' : ''}>
                        <ShoppingBag className="h-4 w-4" />
                        <span>Rewards Shop</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton onClick={() => navigate('/student/mastery-journey')} className={isActive('/student/mastery-journey') ? 'bg-accent text-accent-foreground' : ''}>
                        <Sparkles className="h-4 w-4" />
                        <span>Mastery Journey</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton onClick={() => navigate('/student/mastery')} className={isActive('/student/mastery') ? 'bg-accent text-accent-foreground' : ''}>
                        <BarChart3 className="h-4 w-4" />
                        <span>Progress</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton onClick={() => navigate('/student/grades')} className={isActive('/student/grades') ? 'bg-accent text-accent-foreground' : ''}>
                        <Award className="h-4 w-4" />
                        <span>Academic Record</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarGroupContent>
              </CollapsibleContent>}
          </Collapsible>
        </SidebarGroup>

        {/* Focus Tools */}
        <SidebarGroup>
          <Collapsible defaultOpen={false}>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center justify-between group hover:bg-accent/50 rounded-md px-2 py-1.5 transition-colors">
                <div className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-[hsl(var(--chart-2))]" />
                  {!isCollapsed && <span className="font-medium">Focus Tools</span>}
                </div>
                {!isCollapsed && <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            {!isCollapsed && <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton onClick={() => navigate('/focus-tools')} className={isActive('/focus-tools') ? 'bg-accent text-accent-foreground' : ''}>
                        <Timer className="h-4 w-4" />
                        <span>Focus Tools</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton onClick={() => navigate('/student/focus-stats')} className={isActive('/student/focus-stats') ? 'bg-accent text-accent-foreground' : ''}>
                        <Activity className="h-4 w-4" />
                        <span>Session Stats</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarGroupContent>
              </CollapsibleContent>}
          </Collapsible>
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>;
}