import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CoursePacingDashboard } from '@/components/CoursePacingDashboard';
import { toast } from 'sonner';

export default function CourseDashboard() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [userRole, setUserRole] = useState<'parent' | 'student' | null>(null);

  useEffect(() => {
    fetchCourseAndCheckAccess();
  }, [courseId]);

  const fetchCourseAndCheckAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      setUserRole(roleData?.role === 'parent' ? 'parent' : 'student');

      // Fetch course
      const { data: courseData, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) throw error;

      if (!courseData) {
        toast.error('Course not found');
        navigate(roleData?.role === 'parent' ? '/parent' : '/student');
        return;
      }

      setCourse(courseData);
    } catch (error: any) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(userRole === 'parent' ? '/parent' : '/student');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto p-4 md:p-8 max-w-6xl">
        <CoursePacingDashboard
          courseId={course.id}
          courseTitle={course.title}
          courseSubject={course.subject}
          studentId={course.student_id}
          gradeLevel={course.grade_level}
        />
      </div>
    </div>
  );
}
