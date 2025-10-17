import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StudentSidebar } from './StudentSidebar';
import { EducatorSidebar } from './EducatorSidebar';
import { HybridSidebar } from './HybridSidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent } from '@/components/ui/sidebar';

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
      console.log('[AppSidebar] Current user:', user?.id);
      
      if (!user) {
        console.log('[AppSidebar] No user found');
        setUserRole(null);
        setLoading(false);
        return;
      }

      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      console.log('[AppSidebar] Role data:', roleData, 'Error:', error);

      if (roleData) {
        setUserRole(roleData.role as 'parent' | 'student' | 'self_directed');
        console.log('[AppSidebar] User role set to:', roleData.role);
      } else {
        setUserRole(null);
        console.log('[AppSidebar] No role found for user');
      }
    } catch (error) {
      console.error('[AppSidebar] Error fetching user role:', error);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    );
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

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="p-4 text-muted-foreground text-sm">
            No role assigned. Please contact support.
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
