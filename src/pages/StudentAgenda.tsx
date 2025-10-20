import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WeeklyView } from '@/components/WeeklyView';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen } from 'lucide-react';
import { DiagnosticAssessmentLauncher } from '@/components/DiagnosticAssessmentLauncher';

export default function StudentAgenda() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [upNextAssignment, setUpNextAssignment] = useState<any>(null);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (studentData) {
        setStudent(studentData);
        await fetchUpNextAssignment(studentData.id);
      } else {
        navigate('/parent');
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpNextAssignment = async (studentId: string) => {
    try {
      // First, check for incomplete assignments that were started (has activity events)
      const { data: recentActivity } = await supabase
        .from('activity_events')
        .select('assignment_id')
        .eq('student_id', studentId)
        .not('assignment_id', 'is', null)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (recentActivity?.assignment_id) {
        // Check if this assignment is incomplete
        const { data: assignment } = await supabase
          .from('assignments')
          .select(`
            *,
            curriculum_items (
              title,
              type,
              est_minutes,
              body,
              courses (
                title
              )
            ),
            submissions (
              id
            )
          `)
          .eq('id', recentActivity.assignment_id)
          .single();

        if (assignment && (!assignment.submissions || assignment.submissions.length === 0)) {
          setUpNextAssignment(assignment);
          return;
        }
      }

      // If no incomplete recent assignment, get next due assignment
      const now = new Date();
      const { data: nextAssignment } = await supabase
        .from('assignments')
        .select(`
          *,
          curriculum_items!inner (
            title,
            type,
            est_minutes,
            body,
            courses!inner (
              title,
              student_id
            )
          ),
          submissions (
            id
          )
        `)
        .eq('curriculum_items.courses.student_id', studentId)
        .eq('status', 'assigned')
        .is('submissions.id', null)
        .gte('due_at', now.toISOString())
        .order('due_at', { ascending: true })
        .limit(1)
        .single();

      if (nextAssignment) {
        setUpNextAssignment(nextAssignment);
      }
    } catch (error) {
      console.error('Error fetching up next assignment:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!student) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Guide</h1>
        {student.id && (
          <DiagnosticAssessmentLauncher 
            studentId={student.id} 
            buttonText="Skills Check-In"
            variant="outline"
          />
        )}
      </div>
      
      {/* Personalized Learning Card */}
      {student.id && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Personalized Learning</CardTitle>
            <CardDescription>
              Take a quick skills check-in to create a custom course just for you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DiagnosticAssessmentLauncher 
              studentId={student.id}
              buttonText="Start Skills Check-In"
            />
          </CardContent>
        </Card>
      )}
      
      {/* Up Next Box */}
      {upNextAssignment && (
        <Card className="mb-6 border-2 border-yellow-500 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>📍</span> Up Next
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-1">
                  {upNextAssignment.curriculum_items?.courses?.title}
                </div>
                <h3 className="font-semibold text-lg mb-2">
                  {upNextAssignment.curriculum_items?.title || 'Untitled Assignment'}
                </h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {upNextAssignment.curriculum_items?.est_minutes || 30} minutes
                  </div>
                  {upNextAssignment.due_at && (
                    <div>
                      Due: {new Date(upNextAssignment.due_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              <Button onClick={() => navigate(`/assignment/${upNextAssignment.id}`)}>
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <WeeklyView studentId={student.id} />
    </div>
  );
}