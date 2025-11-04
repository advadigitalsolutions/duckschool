import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { CommandPalette } from "@/components/CommandPalette";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { CustomizableHeader } from "@/components/CustomizableHeader";
import { ConfettiCelebration } from "@/components/ConfettiCelebration";
import { FocusJourneyBar } from "@/components/FocusJourneyBar";
import { FocusJourneyProvider } from "@/contexts/FocusJourneyContext";
import { FocusDuckWizard } from "@/components/FocusDuckWizard";
import { LearningWizardTutorial } from "@/components/LearningWizardTutorial";
import { SmartCalendarWizard } from "@/components/SmartCalendarWizard";
import { XPSystemWizard } from "@/components/XPSystemWizard";
import { MasteryTrackingWizard } from "@/components/MasteryTrackingWizard";
import Settings from "./pages/Settings";
import Account from "./pages/settings/Account";
import Appearance from "./pages/settings/Appearance";
import AccessibilitySettings from "./pages/settings/AccessibilitySettings";
import LearningProfile from "./pages/settings/LearningProfile";
import Notifications from "./pages/settings/Notifications";
import Billing from "./pages/settings/Billing";
import Help from "./pages/settings/Help";
import FeedbackSettings from "./pages/settings/Feedback";
import FeatureRequests from "./pages/FeatureRequests";
import Roadmap from "./pages/Roadmap";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Marketing from "./pages/Marketing";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import AboutUs from "./pages/AboutUs";
import Blog from "./pages/Blog";
import WhyDiagnosticsArentTests from "./pages/blog/WhyDiagnosticsArentTests";
import PedagogiesSupported from "./pages/blog/PedagogiesSupported";
import ADHDSupport from "./pages/blog/ADHDSupport";
import DyslexiaSupport from "./pages/blog/DyslexiaSupport";
import ExpatFamilies from "./pages/blog/ExpatFamilies";
import JustInTimeCurriculum from "./pages/blog/JustInTimeCurriculum";
import SchoolsAndCharters from "./pages/blog/SchoolsAndCharters";
import BusyFamilies from "./pages/blog/BusyFamilies";
import MostAutomated from "./pages/blog/MostAutomated";
import StateStandards from "./pages/blog/StateStandards";
import PublicSchoolSupplement from "./pages/blog/PublicSchoolSupplement";
import DataDrivenCurriculum from "./pages/blog/DataDrivenCurriculum";
import BridgingLearningGaps from "./pages/blog/BridgingLearningGaps";
import MasteryBasedLearning from "./pages/blog/MasteryBasedLearning";
import MultipleChildren from "./pages/blog/MultipleChildren";
import LearningDifferences from "./pages/blog/LearningDifferences";
import IndependentLearners from "./pages/blog/IndependentLearners";
import AIPersonalization from "./pages/blog/AIPersonalization";
import RigorAndWellBeing from "./pages/blog/RigorAndWellBeing";
import PortfolioAssessment from "./pages/blog/PortfolioAssessment";
import ProjectBasedLearning from "./pages/blog/ProjectBasedLearning";
import StudentBurnout from "./pages/blog/StudentBurnout";
import NeuroscienceOfLearning from "./pages/blog/NeuroscienceOfLearning";
import CriticalThinking from "./pages/blog/CriticalThinking";
import SchoolOverwhelm from "./pages/blog/SchoolOverwhelm";
import CollaborativeLearning from "./pages/blog/CollaborativeLearning";
import ParentTeacherPartnership from "./pages/blog/ParentTeacherPartnership";
import CreativeLearning from "./pages/blog/CreativeLearning";
import HomeschoolRoutines from "./pages/blog/HomeschoolRoutines";
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
import StudentSkillsCheckIn from "./pages/StudentSkillsCheckIn";
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
import DiagnosticAssessment from "./pages/DiagnosticAssessment";
import { AuthGuard } from "./components/AuthGuard";
import { BionicReadingProvider } from "./contexts/BionicReadingContext";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";
import { PomodoroProvider } from "./contexts/PomodoroContext";
import { ReadingRuler } from "./components/ReadingRuler";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [student, setStudent] = useState<any>(null);
  const [headerSettings, setHeaderSettings] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const navigate = useNavigate();
  
  const isPublicRoute = ['/', '/pricing', '/about', '/about-us', '/blog', '/auth', '/dashboard'].some(route => 
    location.pathname === route || location.pathname.startsWith('/blog/')
  );
  
  // Exclude parent routes that happen to start with /student (like /student/:id)
  const isParentStudentDetailRoute = /^\/student\/[a-f0-9-]+$/.test(location.pathname);
  const isStudentRoute = (location.pathname.startsWith('/student') || location.pathname.startsWith('/assignment/')) && !isParentStudentDetailRoute;
  
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
        <div className="flex-1 flex flex-col pb-16 md:pb-0">
          {!isPublicRoute && !isStudentRoute && (
            <header className="h-14 border-b flex items-center gap-4 px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
              <SidebarTrigger className="h-9 w-9" />
              <h2 className="font-semibold text-lg">Parent Dashboard</h2>
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
                    <FocusDuckWizard />
                    <LearningWizardTutorial />
                    <SmartCalendarWizard />
                    <XPSystemWizard />
                    <MasteryTrackingWizard />
                    <CommandPalette />
                    <Routes>
                      <Route path="/" element={<Marketing />} />
                      <Route path="/pricing" element={<Pricing />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/about-us" element={<AboutUs />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/blog/why-diagnostics-arent-tests" element={<WhyDiagnosticsArentTests />} />
                      <Route path="/blog/pedagogies-supported" element={<PedagogiesSupported />} />
                      <Route path="/blog/adhd-support" element={<ADHDSupport />} />
                      <Route path="/blog/dyslexia-support" element={<DyslexiaSupport />} />
                      <Route path="/blog/expat-families" element={<ExpatFamilies />} />
                      <Route path="/blog/just-in-time-curriculum" element={<JustInTimeCurriculum />} />
                      <Route path="/blog/schools-and-charters" element={<SchoolsAndCharters />} />
                      <Route path="/blog/busy-families" element={<BusyFamilies />} />
                      <Route path="/blog/most-automated" element={<MostAutomated />} />
                      <Route path="/blog/state-standards" element={<StateStandards />} />
                      <Route path="/blog/public-school-supplement" element={<PublicSchoolSupplement />} />
                      <Route path="/blog/data-driven-curriculum" element={<DataDrivenCurriculum />} />
                      <Route path="/blog/bridging-learning-gaps" element={<BridgingLearningGaps />} />
                      <Route path="/blog/mastery-based-learning" element={<MasteryBasedLearning />} />
                      <Route path="/blog/multiple-children" element={<MultipleChildren />} />
                      <Route path="/blog/learning-differences" element={<LearningDifferences />} />
                      <Route path="/blog/independent-learners" element={<IndependentLearners />} />
                      <Route path="/blog/ai-personalization" element={<AIPersonalization />} />
                      <Route path="/blog/rigor-and-wellbeing" element={<RigorAndWellBeing />} />
                      <Route path="/blog/portfolio-assessment" element={<PortfolioAssessment />} />
                      <Route path="/blog/project-based-learning" element={<ProjectBasedLearning />} />
                      <Route path="/blog/student-burnout" element={<StudentBurnout />} />
                      <Route path="/blog/neuroscience-of-learning" element={<NeuroscienceOfLearning />} />
                      <Route path="/blog/critical-thinking" element={<CriticalThinking />} />
                      <Route path="/blog/school-overwhelm" element={<SchoolOverwhelm />} />
                      <Route path="/blog/collaborative-learning" element={<CollaborativeLearning />} />
                      <Route path="/blog/parent-teacher-partnership" element={<ParentTeacherPartnership />} />
                      <Route path="/blog/creative-learning" element={<CreativeLearning />} />
                      <Route path="/blog/homeschool-routines" element={<HomeschoolRoutines />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/waitlist" element={<Waitlist />} />
                      <Route path="/dashboard" element={<Index />} />
                      
                      {/* Settings Routes */}
                      <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>}>
                        <Route path="account" element={<Account />} />
                        <Route path="appearance" element={<Appearance />} />
                        <Route path="accessibility" element={<AccessibilitySettings />} />
                        <Route path="learning-profile" element={<LearningProfile />} />
                        <Route path="notifications" element={<Notifications />} />
                        <Route path="billing" element={<Billing />} />
                        <Route path="help" element={<Help />} />
                        <Route path="feedback" element={<FeedbackSettings />} />
                      </Route>

                      {/* Feedback Routes */}
                      <Route path="/feature-requests" element={<AuthGuard><FeatureRequests /></AuthGuard>} />
                      <Route path="/roadmap" element={<AuthGuard><Roadmap /></AuthGuard>} />
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
                      <Route path="/student/diagnostic/:assessmentId" element={<AuthGuard><DiagnosticAssessment /></AuthGuard>} />
                      <Route path="/student/xp" element={<AuthGuard><StudentXP /></AuthGuard>} />
                      <Route path="/student/rewards" element={<AuthGuard><StudentRewards /></AuthGuard>} />
                      <Route path="/student/mastery" element={<AuthGuard><StudentMastery /></AuthGuard>} />
                      <Route path="/student/mastery-journey" element={<AuthGuard><StudentMasteryJourney /></AuthGuard>} />
                      <Route path="/student/skills" element={<AuthGuard><StudentSkillsCheckIn /></AuthGuard>} />
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
