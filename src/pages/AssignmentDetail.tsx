import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Clock, Target, BookOpen, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AssignmentQuestions } from '@/components/AssignmentQuestions';
import { EditAssignmentDialog } from '@/components/EditAssignmentDialog';
import { DeleteAssignmentDialog } from '@/components/DeleteAssignmentDialog';
import { cleanMarkdown } from '@/utils/textFormatting';
import { BionicText } from '@/components/BionicText';

export default function AssignmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [isParent, setIsParent] = useState(false);

  useEffect(() => {
    fetchAssignment();
  }, [id]);

  const fetchAssignment = async () => {
    try {
      // Get current user to determine student ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is a student or parent
      const { data: studentData } = await supabase
        .from('students')
        .select('id, parent_id')
        .eq('user_id', user.id)
        .single();

      if (studentData) {
        setCurrentStudentId(studentData.id);
      }

      // Check if user is a parent
      const { data: parentStudents } = await supabase
        .from('students')
        .select('id')
        .eq('parent_id', user.id);

      setIsParent(parentStudents && parentStudents.length > 0);

      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          curriculum_items (
            *,
            courses (
              title,
              subject,
              student_id
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setAssignment(data);
    } catch (error: any) {
      toast.error('Failed to load assignment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ status: 'assigned' })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Assignment published! Students can now see it.');
      fetchAssignment();
    } catch (error: any) {
      toast.error('Failed to publish assignment');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Assignment not found</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const content = assignment.curriculum_items?.body || {};
  const studentId = assignment.curriculum_items?.courses?.student_id;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(`/student/${studentId}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{content.title || assignment.curriculum_items?.title}</h1>
              <p className="text-sm text-muted-foreground">
                {assignment.curriculum_items?.courses?.subject}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant={
              assignment.status === 'graded' ? 'default' :
              assignment.status === 'submitted' ? 'secondary' : 
              'outline'
            }>
              {assignment.status}
            </Badge>
            {assignment.due_at && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Due: {new Date(assignment.due_at).toLocaleDateString()}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {assignment.status === 'draft' && isParent && (
              <Button onClick={handlePublish}>
                Publish Assignment
              </Button>
            )}
            {isParent && (
              <>
                <EditAssignmentDialog 
                  assignment={assignment} 
                  onAssignmentUpdated={fetchAssignment}
                />
                <DeleteAssignmentDialog 
                  assignment={assignment} 
                  onAssignmentDeleted={() => navigate(`/student/${studentId}`)}
                />
              </>
            )}
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            <TabsTrigger value="rubric">Rubric</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-4">
            {currentStudentId ? (
              <AssignmentQuestions assignment={assignment} studentId={currentStudentId} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Sign in as a student to complete this assignment.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Learning Objectives
                </CardTitle>
              </CardHeader>
              <CardContent>
                  {content.objectives?.length > 0 ? (
                  <ul className="space-y-2">
                    {content.objectives.map((obj: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <BionicText>{obj}</BionicText>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No objectives defined</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Time & Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>
                  <span className="font-medium">Estimated Time:</span>{' '}
                  {content.estimated_minutes || assignment.curriculum_items?.est_minutes || 0} minutes
                </p>
                {content.adhd_accommodations?.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">ADHD Accommodations:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {content.adhd_accommodations.map((acc: string, idx: number) => (
                        <li key={idx}><BionicText>{cleanMarkdown(acc)}</BionicText></li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="instructions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                  {content.instructions ? (
                    <p className="whitespace-pre-wrap"><BionicText>{cleanMarkdown(content.instructions)}</BionicText></p>
                  ) : (
                    <p className="text-muted-foreground">No instructions provided</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {content.activities?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {content.activities.map((activity: any, idx: number) => (
                      <div key={idx} className="border-l-2 border-primary pl-4">
                        <p className="font-medium">Step {activity.step || idx + 1}</p>
                        <p className="text-sm text-muted-foreground"><BionicText>{cleanMarkdown(activity.description)}</BionicText></p>
                        {activity.duration_minutes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ~{activity.duration_minutes} minutes
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rubric" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Rubric</CardTitle>
              </CardHeader>
              <CardContent>
                {content.rubric?.length > 0 || assignment.rubric ? (
                  <div className="space-y-4">
                    {(content.rubric || assignment.rubric || []).map((item: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium"><BionicText>{cleanMarkdown(item.criteria)}</BionicText></h4>
                          <Badge variant="outline">{item.points} points</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground"><BionicText>{cleanMarkdown(item.description)}</BionicText></p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No rubric defined</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Materials & Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                {content.materials?.length > 0 ? (
                  <ul className="space-y-2">
                    {content.materials.map((material: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <BionicText>{material}</BionicText>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No materials listed</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
