import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedMasteryDashboard } from '@/components/UnifiedMasteryDashboard';
import { BarChart3 } from 'lucide-react';

export default function StudentMastery() {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentId();
  }, []);

  const fetchStudentId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (studentData) {
        setStudentId(studentData.id);
      }
    } catch (error) {
      console.error('Error fetching student ID:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Mastery Dashboard
        </h1>
        <p className="text-muted-foreground">Track your learning progress and mastery levels</p>
      </div>

      {studentId && <UnifiedMasteryDashboard studentId={studentId} />}
    </div>
  );
}
