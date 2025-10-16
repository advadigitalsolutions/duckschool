import { useState, useEffect } from 'react';

interface DemoNames {
  parentName: string;
  studentName: string;
  educatorName: string;
}

/**
 * Hook to retrieve demo participant names from localStorage
 * Returns personalized names or defaults
 */
export function useDemoNames(): DemoNames {
  const [names, setNames] = useState<DemoNames>({
    parentName: 'Demo Parent',
    studentName: 'Demo Student',
    educatorName: 'Demo Educator'
  });

  useEffect(() => {
    const parentName = localStorage.getItem('demo_parent_name');
    const studentName = localStorage.getItem('demo_student_name');
    const educatorName = localStorage.getItem('demo_educator_name');

    setNames({
      parentName: parentName || 'Demo Parent',
      studentName: studentName || 'Demo Student',
      educatorName: educatorName || (studentName || 'Demo Educator')
    });
  }, []);

  return names;
}
