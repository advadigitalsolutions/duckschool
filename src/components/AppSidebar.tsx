import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StudentSidebar } from './StudentSidebar';
import { EducatorSidebar } from './EducatorSidebar';
import { HybridSidebar } from './HybridSidebar';

export function AppSidebar() {
  const [userRole, setUserRole] = useState<'parent' | 'student' | 'self_directed' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserRole();
    
    // Listen for auth state changes to update sidebar when user logs in/out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        fetchUserRole();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData) {
        setUserRole(roleData.role as 'parent' | 'student' | 'self_directed');
      } else {
        setUserRole(null);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (userRole === 'self_directed') {
    return <HybridSidebar />;
  }

  if (userRole === 'student') {
    return <StudentSidebar />;
  }

  if (userRole === 'parent') {
    return <EducatorSidebar />;
  }

  return null;
}
