import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProfileAssessment } from '@/components/ProfileAssessment';

export function LearningProfileForm() {
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    fetchStudent();
  }, []);

  const fetchStudent = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setStudent(data);
    }
  };

  if (!student) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <ProfileAssessment 
        studentId={student.id} 
        onComplete={fetchStudent}
      />
    </div>
  );
}
