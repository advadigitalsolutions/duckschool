import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, Calendar, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface CourseWithStudent {
  id: string;
  title: string;
  subject: string;
  description: string;
  grade_level: string;
  created_at: string;
  student: {
    id: string;
    name: string;
    display_name: string;
    grade_level: string;
  };
  _count: {
    assignments: number;
    completed: number;
  };
}

export default function ParentAllCourses() {
  const [courses, setCourses] = useState<CourseWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentFilter, setStudentFilter] = useState<string>('all');
  const [students, setStudents] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCoursesAndStudents();
  }, []);

  const fetchCoursesAndStudents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('parent_id', user.id);

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Fetch all courses for this parent's students
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          subject,
          description,
          grade_level,
          created_at,
          student_id,
          students!inner(
            id,
            name,
            display_name,
            grade_level
          )
        `)
        .eq('students.parent_id', user.id)
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      // Fetch assignment counts for each course
      const coursesWithCounts = await Promise.all(
        (coursesData || []).map(async (course: any) => {
          const { data: assignments } = await supabase
            .from('assignments')
            .select('id, status, curriculum_items!inner(course_id)')
            .eq('curriculum_items.course_id', course.id);

          const totalAssignments = assignments?.length || 0;
          const completedAssignments = assignments?.filter(a => a.status === 'graded').length || 0;

          return {
            ...course,
            student: Array.isArray(course.students) ? course.students[0] : course.students,
            _count: {
              assignments: totalAssignments,
              completed: completedAssignments
            }
          };
        })
      );

      setCourses(coursesWithCounts);
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = studentFilter === 'all' 
    ? courses 
    : courses.filter(c => c.student?.id === studentFilter);

  const getProgressPercentage = (course: CourseWithStudent) => {
    if (course._count.assignments === 0) return 0;
    return Math.round((course._count.completed / course._count.assignments) * 100);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">All Courses</h1>
          <p className="text-muted-foreground mt-1">
            Manage courses across all your students
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            className="px-4 py-2 rounded-md border bg-background"
          >
            <option value="all">All Students</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.display_name || student.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No courses found. Add courses for your students to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => {
            const progress = getProgressPercentage(course);
            
            return (
              <Card 
                key={course.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/course/${course.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-2">
                        <GraduationCap className="h-3 w-3" />
                        {course.student?.display_name || course.student?.name}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {course.subject}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span>{course._count.assignments} assignments</span>
                    </div>
                    <div className="flex items-center gap-1 text-success">
                      <TrendingUp className="h-4 w-4" />
                      <span>{course._count.completed} completed</span>
                    </div>
                  </div>

                  {course.grade_level && (
                    <Badge variant="outline" className="w-fit">
                      Grade {course.grade_level}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
