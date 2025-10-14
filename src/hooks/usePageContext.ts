import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

type PageContext = 
  | 'student_dashboard'
  | 'course_dashboard'
  | 'assignment_detail'
  | 'student_profile'
  | 'pomodoro_fullscreen'
  | 'parent_dashboard'
  | 'other';

export const usePageContext = () => {
  const location = useLocation();
  const params = useParams();
  const [pageContext, setPageContext] = useState<PageContext>('other');
  const [courseId, setCourseId] = useState<string | null>(null);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);

  useEffect(() => {
    const path = location.pathname;
    
    if (path === '/student' || path === '/student/') {
      setPageContext('student_dashboard');
    } else if (path.startsWith('/course/')) {
      setPageContext('course_dashboard');
      setCourseId(params.id || null);
    } else if (path.startsWith('/assignment/')) {
      setPageContext('assignment_detail');
      setAssignmentId(params.id || null);
    } else if (path === '/student/profile') {
      setPageContext('student_profile');
    } else if (path === '/pomodoro-fullscreen') {
      setPageContext('pomodoro_fullscreen');
    } else if (path === '/parent') {
      setPageContext('parent_dashboard');
    } else {
      setPageContext('other');
    }
  }, [location.pathname, params]);

  return {
    pageContext,
    courseId,
    assignmentId
  };
};
