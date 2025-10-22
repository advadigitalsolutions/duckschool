import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ImprovedProfileAssessment } from '@/components/ImprovedProfileAssessment';

export function LearningProfileForm() {
  const [student, setStudent] = useState<any>(null);
  const [isParent, setIsParent] = useState(false);

  useEffect(() => {
    fetchStudent();
  }, []);

  const fetchStudent = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if user is a student
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setStudent(data);
      setIsParent(false);
    } else {
      // User is a parent
      setIsParent(true);
    }
  };

  if (student === null && !isParent) return <div>Loading...</div>;

  if (isParent) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-2">Learning Profile</h3>
          <p className="text-muted-foreground">
            Learning profiles are designed for students. As a parent/educator, you can view and manage your students' learning profiles from their individual profile pages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ImprovedProfileAssessment 
        studentId={student.id} 
        onComplete={fetchStudent}
      />
    </div>
  );
}
