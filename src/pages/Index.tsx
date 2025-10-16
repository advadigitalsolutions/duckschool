import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { GraduationCap, BookOpen, Target, Clock, TrendingUp } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in and redirect to appropriate dashboard
    const checkUser = async () => {
      console.log('[Index] Checking user session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      // If there's an error or invalid session, clear everything and don't redirect
      if (error || !session?.user) {
        console.log('[Index] No valid session');
        // Clear any stale localStorage data
        localStorage.removeItem('supabase.auth.token');
        return;
      }

      console.log('[Index] Session found for user:', session.user.id);

      // Validate the session is actually active by checking the user exists
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user || user.id !== session.user.id) {
        // Session is invalid, clear it
        console.log('[Index] Invalid session, signing out');
        await supabase.auth.signOut();
        return;
      }

      // Get user roles from user_roles table
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      console.log('[Index] User roles:', roles);

      if (roles && roles.length > 0) {
        const userRoles = roles.map(r => r.role);
        
        // Redirect based on role priority
        if (userRoles.includes('student')) {
          console.log('[Index] Redirecting to /student');
          navigate('/student', { replace: true });
        } else {
          console.log('[Index] Redirecting to /parent');
          navigate('/parent', { replace: true });
        }
      }
    };

    checkUser();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Header with Theme Toggle */}
      <div className="container mx-auto px-4 pt-4">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <h1 className="mb-4 text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            AI-Powered Homeschool Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Standards-aligned curriculum with ADHD support, automated grading, and California-compliant documentation
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')} className="shadow-lg">
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          <div className="text-center p-6 rounded-lg bg-card border shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">AI Lesson Planning</h3>
            <p className="text-sm text-muted-foreground">
              Upload materials and let AI create personalized lesson plans
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-card border shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
              <Target className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="font-semibold mb-2">ADHD Support</h3>
            <p className="text-sm text-muted-foreground">
              Pomodoro timers, micro-goals, and visual progress tracking
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-card border shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <Clock className="h-6 w-6 text-accent" />
            </div>
            <h3 className="font-semibold mb-2">Auto Grading</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered grading with rubrics and human review options
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-card border shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Progress Tracking</h3>
            <p className="text-sm text-muted-foreground">
              Detailed analytics and California-compliant transcripts
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="max-w-2xl mx-auto p-8 rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 border">
            <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Homeschool?</h2>
            <p className="text-muted-foreground mb-6">
              Start with our AI-powered platform today and give your student the personalized education they deserve
            </p>
            <Button size="lg" onClick={() => navigate('/auth')}>
              Create Free Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
