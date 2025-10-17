import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { CustomizableHeader } from "@/components/CustomizableHeader";
import { ConfettiCelebration } from "@/components/ConfettiCelebration";
import { FocusJourneyBar } from "@/components/FocusJourneyBar";
import { FocusJourneyProvider } from "@/contexts/FocusJourneyContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Marketing from "./pages/Marketing";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Blog from "./pages/Blog";
import WhyDiagnosticsArentTests from "./pages/blog/WhyDiagnosticsArentTests";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Waitlist from "./pages/Waitlist";
import ParentDashboard from "./pages/ParentDashboard";
import ParentProfile from "./pages/ParentProfile";
import StudentDashboard from "./pages/StudentDashboard";
import StudentDetail from "./pages/StudentDetail";
import StudentXP from "./pages/StudentXP";
import StudentRewards from "./pages/StudentRewards";
import StudentMastery from "./pages/StudentMastery";
import StudentMasteryJourney from "./pages/StudentMasteryJourney";
import StudentFocusStats from "./pages/StudentFocusStats";
import StudentGradesPage from "./pages/StudentGradesPage";
import StudentAssignments from "./pages/StudentAssignments";
import StudentAgenda from "./pages/StudentAgenda";
import StudentCalendar from "./pages/StudentCalendar";
import StudentChores from "./pages/StudentChores";
import StandardsFrameworks from "./pages/StandardsFrameworks";
import AssignmentDetail from "./pages/AssignmentDetail";
import StudentProfile from "./pages/StudentProfile";
import CourseDashboard from "./pages/CourseDashboard";
import PomodoroFullscreen from "./pages/PomodoroFullscreen";
import FocusTools from "./pages/FocusTools";
import PomodoroPopup from "./pages/PomodoroPopup";
import DuckPopup from "./pages/DuckPopup";
import NotFound from "./pages/NotFound";
import LearningWindow from "./pages/LearningWindow";
import AdminSeedStandards from "./pages/AdminSeedStandards";
import { AuthGuard } from "./components/AuthGuard";
import { BionicReadingProvider } from "./contexts/BionicReadingContext";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";
import { PomodoroProvider } from "./contexts/PomodoroContext";
import { ReadingRuler } from "./components/ReadingRuler";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = window.location;
  const [student, setStudent] = useState<any>(null);
  const [headerSettings, setHeaderSettings] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const navigate = useNavigate();
  
  const isPublicRoute = ['/', '/pricing', '/about', '/blog', '/auth', '/dashboard'].some(route => 
    location.pathname === route || location.pathname.startsWith('/blog/')
  );
  
  const isStudentRoute = location.pathname.startsWith('/student') || location.pathname.startsWith('/assignment/');
  
  // Only show focus duck on assignment detail pages and learning windows
  const showFocusDuck = location.pathname.startsWith('/assignment/') || 
                        location.pathname === '/learning-window';

  useEffect(() => {
    if (isStudentRoute) {
      fetchStudent();
    }
  }, [isStudentRoute]);

  const fetchStudent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (studentData) {
        setStudent(studentData);
        setHeaderSettings(studentData.header_settings || getDefaultHeaderSettings());
      }
    } catch (error) {
      console.error('Error fetching student:', error);
    }
  };

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
      timerColor: 'hsl(var(--primary))',
      numberColor: 'hsl(var(--foreground))',
    },
    celebrateWins: true,
    show8BitStars: false,
    starColor: '#fbbf24',
    headerVisibility: 'sticky' as const,
  });

  const saveHeaderSettings = async (newSettings: any) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ header_settings: newSettings })
        .eq('id', student?.id);

      if (error) throw error;
      setHeaderSettings(newSettings);
      toast.success('Header settings saved!');
    } catch (error) {
      toast.error('Failed to save header settings');
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <FocusJourneyProvider studentId={student?.id}>
      <ConfettiCelebration active={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      <div className="flex min-h-screen w-full">
        {!isPublicRoute && <AppSidebar />}
        <div className="flex-1 flex flex-col">
          {!isPublicRoute && !isStudentRoute && (
            <header className="h-12 border-b flex items-center px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
              <SidebarTrigger className="-ml-1" />
            </header>
          )}
          
          {isStudentRoute && headerSettings && student && (
            <>
              <CustomizableHeader
                student={student}
                settings={headerSettings}
                onSaveSettings={saveHeaderSettings}
                onSignOut={handleSignOut}
                onDemoCelebration={() => setShowConfetti(true)}
              />
              {showFocusDuck && <FocusJourneyBar studentId={student.id} />}
            </>
          )}
          
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
        {!isPublicRoute && <MobileBottomNav />}
      </div>
    </FocusJourneyProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="theme">
      <PomodoroProvider>
        <BionicReadingProvider>
          <AccessibilityProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <ReadingRuler />
              <BrowserRouter>
                <SidebarProvider>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<Marketing />} />
                      <Route path="/pricing" element={<Pricing />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/blog/why-diagnostics-arent-tests" element={<WhyDiagnosticsArentTests />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/waitlist" element={<Waitlist />} />
                      <Route path="/dashboard" element={<Index />} />
                      <Route path="/parent" element={<AuthGuard><ParentDashboard /></AuthGuard>} />
                      <Route path="/parent/profile" element={<AuthGuard><ParentProfile /></AuthGuard>} />
                      <Route path="/student/:id" element={<AuthGuard><StudentDetail /></AuthGuard>} />
                      <Route path="/assignment/:id" element={<AuthGuard><AssignmentDetail /></AuthGuard>} />
                      <Route path="/student" element={<AuthGuard><StudentDashboard /></AuthGuard>} />
                      <Route path="/student/profile" element={<AuthGuard><StudentProfile /></AuthGuard>} />
                      <Route path="/student/assignments" element={<AuthGuard><StudentAssignments /></AuthGuard>} />
                      <Route path="/student/agenda" element={<AuthGuard><StudentAgenda /></AuthGuard>} />
                      <Route path="/student/calendar" element={<AuthGuard><StudentCalendar /></AuthGuard>} />
                      <Route path="/student/chores" element={<AuthGuard><StudentChores /></AuthGuard>} />
                      <Route path="/student/xp" element={<AuthGuard><StudentXP /></AuthGuard>} />
                      <Route path="/student/rewards" element={<AuthGuard><StudentRewards /></AuthGuard>} />
                      <Route path="/student/mastery" element={<AuthGuard><StudentMastery /></AuthGuard>} />
                      <Route path="/student/mastery-journey" element={<AuthGuard><StudentMasteryJourney /></AuthGuard>} />
                      <Route path="/student/focus-stats" element={<AuthGuard><StudentFocusStats /></AuthGuard>} />
                      <Route path="/student/grades" element={<AuthGuard><StudentGradesPage /></AuthGuard>} />
                      <Route path="/course/:courseId" element={<AuthGuard><CourseDashboard /></AuthGuard>} />
                      <Route path="/pomodoro-fullscreen" element={<PomodoroFullscreen />} />
                      <Route path="/focus-tools" element={<AuthGuard><FocusTools /></AuthGuard>} />
                      <Route path="/pomodoro-popup" element={<PomodoroPopup />} />
                      <Route path="/duck-popup" element={<DuckPopup />} />
                      <Route path="/standards-frameworks" element={<AuthGuard><StandardsFrameworks /></AuthGuard>} />
                      <Route path="/learning-window" element={<LearningWindow />} />
                      <Route path="/admin/seed-standards" element={<AuthGuard><AdminSeedStandards /></AuthGuard>} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </SidebarProvider>
              </BrowserRouter>
            </TooltipProvider>
          </AccessibilityProvider>
        </BionicReadingProvider>
      </PomodoroProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
