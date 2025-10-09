import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ParentDashboard from "./pages/ParentDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentDetail from "./pages/StudentDetail";
import AssignmentDetail from "./pages/AssignmentDetail";
import StudentProfile from "./pages/StudentProfile";
import NotFound from "./pages/NotFound";
import { AuthGuard } from "./components/AuthGuard";
import { BionicReadingProvider } from "./contexts/BionicReadingContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BionicReadingProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </BionicReadingProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
