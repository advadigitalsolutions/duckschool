import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // This page only handles authentication redirects
    const checkUser = async () => {
      console.log('[Index] Checking user session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      // If there's an error or invalid session, redirect to marketing page
      if (error || !session?.user) {
        console.log('[Index] No valid session, redirecting to marketing');
        navigate('/', { replace: true });
        return;
      }

      console.log('[Index] Session found for user:', session.user.id);

      // Validate the session is actually active by checking the user exists
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user || user.id !== session.user.id) {
        // Session is invalid, clear it
        console.log('[Index] Invalid session, signing out');
        await supabase.auth.signOut();
        navigate('/', { replace: true });
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
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
};

export default Index;
