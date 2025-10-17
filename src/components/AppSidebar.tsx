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
  }, []);

  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData) {
        setUserRole(roleData.role as 'parent' | 'student' | 'self_directed');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
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
