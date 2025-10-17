import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Home,
  Users,
  BookOpen,
  Calendar,
  BarChart3,
  ChevronDown,
  GraduationCap,
  Sparkles,
  Award,
  Gift,
  CheckSquare,
  Timer
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

export function EducatorSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch students
      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .eq('parent_id', user.id)
        .order('name');
      setStudents(studentsData || []);
    } catch (error) {
      console.error('Error fetching sidebar data:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/parent')}
                className={isActive('/parent') ? 'bg-accent text-accent-foreground' : ''}
              >
                <Home className="h-4 w-4" />
                {state !== "collapsed" && <span>Dashboard</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* My Students */}
        <SidebarGroup>
          <Collapsible defaultOpen>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {state !== "collapsed" && <span>My Students</span>}
                </div>
                {state !== "collapsed" && <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {students.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {students.map((student) => (
                        <SidebarMenuItem key={student.id}>
                          <SidebarMenuButton
                            onClick={() => navigate(`/student/${student.id}`)}
                            className={isActive(`/student/${student.id}`) ? 'bg-accent text-accent-foreground' : ''}
                          >
                            <GraduationCap className="h-4 w-4" />
                            {state !== "collapsed" && <span className="truncate">{student.display_name || student.name}</span>}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </div>
                  ) : (
                    state !== "collapsed" && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No students yet
                      </div>
                    )
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Courses & Curriculum */}
        <SidebarGroup>
          <Collapsible defaultOpen>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[hsl(var(--chart-1))]" />
                  {state !== "collapsed" && <span>Courses</span>}
                </div>
                {state !== "collapsed" && <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/parent')}>
                      <BookOpen className="h-4 w-4" />
                      {state !== "collapsed" && <span>All Courses</span>}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/standards-frameworks')}>
                      <Sparkles className="h-4 w-4" />
                      {state !== "collapsed" && <span>Standards Browser</span>}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Analytics */}
        <SidebarGroup>
          <Collapsible>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[hsl(var(--chart-3))]" />
                  {state !== "collapsed" && <span>Analytics</span>}
                </div>
                {state !== "collapsed" && <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/parent?tab=focus-intelligence')}>
                      {state !== "collapsed" && <span>Focus Analytics</span>}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/parent?tab=reports')}>
                      {state !== "collapsed" && <span>Activity Feed</span>}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton 
                      onClick={() => navigate('/focus-tools')}
                      className={isActive('/focus-tools') ? 'bg-accent text-accent-foreground' : ''}
                    >
                      <Timer className="h-4 w-4" />
                      {state !== "collapsed" && <span>Focus Tools</span>}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Rewards System */}
        <SidebarGroup>
          <Collapsible>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-[hsl(var(--chart-2))]" />
                  {state !== "collapsed" && <span>Rewards</span>}
                </div>
                {state !== "collapsed" && <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/parent?tab=overview')}>
                      <Award className="h-4 w-4" />
                      {state !== "collapsed" && <span>XP Configuration</span>}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/parent?tab=overview')}>
                      <Gift className="h-4 w-4" />
                      {state !== "collapsed" && <span>Manage Rewards</span>}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Scheduling */}
        <SidebarGroup>
          <Collapsible>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {state !== "collapsed" && <span>Scheduling</span>}
                </div>
                {state !== "collapsed" && <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/parent?tab=smart-schedule')}>
                      <Calendar className="h-4 w-4" />
                      {state !== "collapsed" && <span>Smart Calendar</span>}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/parent?tab=todo')}>
                      <CheckSquare className="h-4 w-4" />
                      {state !== "collapsed" && <span>Todo List</span>}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>
  );
}
