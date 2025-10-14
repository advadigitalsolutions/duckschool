import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ParentDashboard from "./pages/ParentDashboard";
import ParentProfile from "./pages/ParentProfile";
import StudentDashboard from "./pages/StudentDashboard";
import StudentDetail from "./pages/StudentDetail";
import AssignmentDetail from "./pages/AssignmentDetail";
import StudentProfile from "./pages/StudentProfile";
import CourseDashboard from "./pages/CourseDashboard";
import PomodoroFullscreen from "./pages/PomodoroFullscreen";
import NotFound from "./pages/NotFound";
import LearningWindow from "./pages/LearningWindow";
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
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route 
                path="/parent" 
                element={
                  <AuthGuard>
                    <ParentDashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/parent/profile" 
                element={
                  <AuthGuard>
                    <ParentProfile />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/student/:id"
                element={
                  <AuthGuard>
                    <StudentDetail />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/assignment/:id" 
                element={
                  <AuthGuard>
                    <AssignmentDetail />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/student" 
                element={
                  <AuthGuard>
                    <StudentDashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/student/profile" 
                element={
                  <AuthGuard>
                    <StudentProfile />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/course/:courseId" 
                element={
                  <AuthGuard>
                    <CourseDashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/pomodoro-fullscreen" 
                element={<PomodoroFullscreen />} 
              />
              <Route 
                path="/learning-window" 
                element={<LearningWindow />} 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
            </TooltipProvider>
          </AccessibilityProvider>
        </BionicReadingProvider>
      </PomodoroProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
