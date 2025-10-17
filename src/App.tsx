import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ParentDashboard from "./pages/ParentDashboard";
import ParentProfile from "./pages/ParentProfile";
import StudentDashboard from "./pages/StudentDashboard";
import StudentDetail from "./pages/StudentDetail";
import StudentXP from "./pages/StudentXP";
import StudentRewards from "./pages/StudentRewards";
import StudentMastery from "./pages/StudentMastery";
import StudentFocusStats from "./pages/StudentFocusStats";
import StudentGradesPage from "./pages/StudentGradesPage";
import StudentAssignments from "./pages/StudentAssignments";
import StudentAgenda from "./pages/StudentAgenda";
import StudentCalendar from "./pages/StudentCalendar";
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
                  <div className="flex min-h-screen w-full">
                    <AppSidebar />
                    <main className="flex-1 overflow-auto">
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/parent" element={<AuthGuard><ParentDashboard /></AuthGuard>} />
                        <Route path="/parent/profile" element={<AuthGuard><ParentProfile /></AuthGuard>} />
                        <Route path="/student/:id" element={<AuthGuard><StudentDetail /></AuthGuard>} />
                        <Route path="/assignment/:id" element={<AuthGuard><AssignmentDetail /></AuthGuard>} />
                        <Route path="/student" element={<AuthGuard><StudentDashboard /></AuthGuard>} />
                        <Route path="/student/profile" element={<AuthGuard><StudentProfile /></AuthGuard>} />
                        <Route path="/student/assignments" element={<AuthGuard><StudentAssignments /></AuthGuard>} />
                        <Route path="/student/agenda" element={<AuthGuard><StudentAgenda /></AuthGuard>} />
                        <Route path="/student/calendar" element={<AuthGuard><StudentCalendar /></AuthGuard>} />
                        <Route path="/student/xp" element={<AuthGuard><StudentXP /></AuthGuard>} />
                        <Route path="/student/rewards" element={<AuthGuard><StudentRewards /></AuthGuard>} />
                        <Route path="/student/mastery" element={<AuthGuard><StudentMastery /></AuthGuard>} />
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
                    </main>
                    <MobileBottomNav />
                  </div>
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
