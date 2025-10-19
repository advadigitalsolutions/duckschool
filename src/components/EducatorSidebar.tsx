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
  Timer,
  ListChecks,
  Settings
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
  const [studentsOpen, setStudentsOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [schedulingOpen, setSchedulingOpen] = useState(false);

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
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar 
      className={isCollapsed ? "w-16" : "w-64"} 
      collapsible="icon"
    >
      <SidebarContent>
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/parent')}
                className={isActive('/parent') ? 'bg-accent text-accent-foreground' : ''}
              >
                <Home className="h-5 w-5" />
                {!isCollapsed && <span>Dashboard</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* My Students */}
        <SidebarGroup>
          <Collapsible open={studentsOpen} onOpenChange={setStudentsOpen}>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center justify-between group hover:bg-accent/50 rounded-md px-2 py-1.5 transition-colors">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {!isCollapsed && <span className="font-medium">My Students</span>}
                </div>
                {!isCollapsed && <ChevronDown className={`h-4 w-4 transition-transform ${studentsOpen ? 'rotate-180' : ''}`} />}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            {!isCollapsed && (
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {students.length > 0 ? (
                      <div className="relative rounded-lg border-2 border-primary/30 bg-background/50 backdrop-blur-sm p-2 transition-all duration-300 group-data-[state=open]:border-primary/50 group-data-[state=open]:shadow-lg group-data-[state=open]:shadow-primary/20">
                        <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
                          {students.map((student) => (
                            <SidebarMenuItem key={student.id}>
                              <SidebarMenuButton
                                onClick={() => navigate(`/student/${student.id}`)}
                                className={`transition-all duration-200 ${
                                  isActive(`/student/${student.id}`)
                                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                    : 'hover:bg-accent hover:text-accent-foreground'
                                }`}
                              >
                                <GraduationCap className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate text-sm">{student.display_name || student.name}</span>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="px-3 py-2 text-sm text-muted-foreground italic">
                        No students yet
                      </div>
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            )}
          </Collapsible>
        </SidebarGroup>

        {/* Courses & Curriculum */}
        <SidebarGroup>
          <Collapsible open={coursesOpen} onOpenChange={setCoursesOpen}>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center justify-between group hover:bg-accent/50 rounded-md px-2 py-1.5 transition-colors">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[hsl(var(--chart-1))]" />
                  {!isCollapsed && <span className="font-medium">Courses</span>}
                </div>
                {!isCollapsed && <ChevronDown className={`h-4 w-4 transition-transform ${coursesOpen ? 'rotate-180' : ''}`} />}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            {!isCollapsed && (
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton onClick={() => navigate('/parent?tab=students')}>
                        <BookOpen className="h-4 w-4" />
                        <span>All Courses</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton onClick={() => navigate('/standards-frameworks')}>
                        <Sparkles className="h-4 w-4" />
                        <span>Standards Browser</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarGroupContent>
              </CollapsibleContent>
            )}
          </Collapsible>
        </SidebarGroup>

        {/* Analytics */}
        <SidebarGroup>
          <Collapsible open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center justify-between group hover:bg-accent/50 rounded-md px-2 py-1.5 transition-colors">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[hsl(var(--chart-3))]" />
                  {!isCollapsed && <span className="font-medium">Analytics</span>}
                </div>
                {!isCollapsed && <ChevronDown className={`h-4 w-4 transition-transform ${analyticsOpen ? 'rotate-180' : ''}`} />}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            {!isCollapsed && (
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton onClick={() => navigate('/parent?tab=focus-intelligence')}>
                        <span>Focus Analytics</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton onClick={() => navigate('/parent?tab=reports')}>
                        <span>Activity Feed</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton 
                        onClick={() => navigate('/focus-tools')}
                        className={isActive('/focus-tools') ? 'bg-accent text-accent-foreground' : ''}
                      >
                        <Timer className="h-4 w-4" />
                        <span>Focus Tools</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarGroupContent>
              </CollapsibleContent>
            )}
          </Collapsible>
        </SidebarGroup>

        {/* Rewards System */}
        <SidebarGroup>
          <Collapsible open={rewardsOpen} onOpenChange={setRewardsOpen}>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center justify-between group hover:bg-accent/50 rounded-md px-2 py-1.5 transition-colors">
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-[hsl(var(--chart-2))]" />
                  {!isCollapsed && <span className="font-medium">Rewards</span>}
                </div>
                {!isCollapsed && <ChevronDown className={`h-4 w-4 transition-transform ${rewardsOpen ? 'rotate-180' : ''}`} />}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            {!isCollapsed && (
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton onClick={() => navigate('/parent?tab=xp')}>
                        <Award className="h-4 w-4" />
                        <span>XP Configuration</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton onClick={() => navigate('/parent?tab=xp')}>
                        <Gift className="h-4 w-4" />
                        <span>Manage Rewards</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton onClick={() => navigate('/parent?tab=chores')}>
                        <ListChecks className="h-4 w-4" />
                        <span>Chores</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarGroupContent>
              </CollapsibleContent>
            )}
          </Collapsible>
        </SidebarGroup>

        {/* Scheduling */}
        <SidebarGroup>
          <Collapsible open={schedulingOpen} onOpenChange={setSchedulingOpen}>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center justify-between group hover:bg-accent/50 rounded-md px-2 py-1.5 transition-colors">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {!isCollapsed && <span className="font-medium">Scheduling</span>}
                </div>
                {!isCollapsed && <ChevronDown className={`h-4 w-4 transition-transform ${schedulingOpen ? 'rotate-180' : ''}`} />}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            {!isCollapsed && (
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton onClick={() => navigate('/parent?tab=smart-schedule')}>
                        <Calendar className="h-4 w-4" />
                        <span>Smart Calendar</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton onClick={() => navigate('/parent?tab=todo')}>
                        <CheckSquare className="h-4 w-4" />
                        <span>Todo List</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarGroupContent>
              </CollapsibleContent>
            )}
          </Collapsible>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/settings')}
                className={isActive('/settings') ? 'bg-accent text-accent-foreground' : ''}
              >
                <Settings className="h-5 w-5" />
                {!isCollapsed && <span>Settings</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>
  );
}
