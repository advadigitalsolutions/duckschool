import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ImprovedProfileAssessment } from '@/components/ImprovedProfileAssessment';
import { ParentProfileAssessment } from '@/components/ParentProfileAssessment';

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
        <ParentProfileAssessment />
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
