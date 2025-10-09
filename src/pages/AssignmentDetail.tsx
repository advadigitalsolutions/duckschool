import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Clock, Target, BookOpen, CheckCircle2, Brain, TrendingUp, Sparkles, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AssignmentQuestions } from '@/components/AssignmentQuestions';
import { TeacherQuestionView } from '@/components/TeacherQuestionView';
import { EditAssignmentDialog } from '@/components/EditAssignmentDialog';
import { DeleteAssignmentDialog } from '@/components/DeleteAssignmentDialog';
import { cleanMarkdown } from '@/utils/textFormatting';
import { BionicText } from '@/components/BionicText';
import { StudyGuidePanel } from '@/components/StudyGuidePanel';
import { TextToSpeech } from '@/components/TextToSpeech';
import { AssignmentNotes } from '@/components/AssignmentNotes';

export default function AssignmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [isParent, setIsParent] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [generatingRemedial, setGeneratingRemedial] = useState(false);
  const [teacherNotes, setTeacherNotes] = useState<any>(null);
  const [offlineActivities, setOfflineActivities] = useState('');
  const [offlineGrade, setOfflineGrade] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    fetchAssignment();
  }, [id]);

  // Pre-generate study guide in background when assignment loads
  useEffect(() => {
    if (assignment && !isParent) {
      const content = assignment.curriculum_items?.body || {};
      const questions = content.questions || [];
      
      if (questions.length > 0) {
        console.log('Pre-generating study guide in background for', questions.length, 'questions');
        
        // Trigger study guide generation in background
        supabase.functions.invoke('generate-study-guide', {
          body: {
            assignment_id: assignment.id,
            questions: questions.map((q: any) => ({
              id: q.id,
              question: q.question,
              type: q.type,
              options: q.options
            })),
            student_profile: {
              grade_level: 'N/A', // Will be fetched by edge function if needed
              learning_style: undefined,
              interests: []
            },
            reading_materials: content.reading_materials
          }
        }).then(({ data, error }) => {
          if (error) {
            console.error('Background study guide generation failed:', error);
          } else {
            console.log('Study guide pre-generated successfully for all questions');
          }
        });
      }
    }
  }, [assignment, isParent]);

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

      // If parent, fetch student submissions and teacher notes
      if (parentStudents && parentStudents.length > 0) {
        const { data: submissionsData } = await supabase
          .from('submissions')
          .select(`
            *,
            question_responses (*)
          `)
          .eq('assignment_id', id)
          .order('attempt_no', { ascending: false });
        
        if (submissionsData) {
          setSubmissions(submissionsData);
        }

        // Fetch teacher notes
        const { data: notesData } = await supabase
          .from('teacher_notes')
          .select('*')
          .eq('assignment_id', id)
          .eq('educator_id', user.id)
          .maybeSingle();
        
        if (notesData) {
          setTeacherNotes(notesData);
          setOfflineActivities(notesData.offline_activities || '');
          setOfflineGrade(notesData.offline_grade || '');
        }
      }
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

  const handleGenerateRemedialAssignment = async () => {
    if (!studentId) {
      toast.error('Student ID not found');
      return;
    }

    setGeneratingRemedial(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-remedial-assignment', {
        body: {
          assignmentId: id,
          studentId: studentId,
          courseId: assignment.curriculum_items.course_id
        }
      });

      if (error) throw error;
      
      toast.success('Remedial assignment created successfully!');
      navigate(`/assignment/${data.assignmentId}`);
    } catch (error: any) {
      toast.error('Failed to generate remedial assignment');
      console.error(error);
    } finally {
      setGeneratingRemedial(false);
    }
  };

  const handleSaveTeacherNotes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSavingNotes(true);
    try {
      const noteData = {
        assignment_id: id,
        educator_id: user.id,
        offline_activities: offlineActivities,
        offline_grade: offlineGrade,
        updated_at: new Date().toISOString()
      };

      if (teacherNotes) {
        const { error } = await supabase
          .from('teacher_notes')
          .update(noteData)
          .eq('id', teacherNotes.id);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('teacher_notes')
          .insert([noteData])
          .select()
          .single();
        
        if (error) throw error;
        setTeacherNotes(data);
      }
      
      toast.success('Teacher notes saved successfully!');
    } catch (error: any) {
      toast.error('Failed to save notes');
      console.error(error);
    } finally {
      setSavingNotes(false);
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
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            {isParent && (
              <TabsTrigger value="teacher-guide">Teacher's Guide</TabsTrigger>
            )}
            {isParent && submissions.length > 0 && (
              <TabsTrigger value="attempts">Student Attempts</TabsTrigger>
            )}
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            <TabsTrigger value="rubric">Rubric</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            {!isParent && currentStudentId && (
              <TabsTrigger value="notes">Notes</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="questions" className="space-y-4">
            {isParent ? (
              <TeacherQuestionView questions={content.questions || []} />
            ) : currentStudentId ? (
              <AssignmentQuestions assignment={assignment} studentId={currentStudentId} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Sign in as a student to complete this assignment.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {isParent && (
            <TabsContent value="teacher-guide" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Lesson Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">About This Lesson</h4>
                    <p className="text-muted-foreground">
                      <BionicText>
                        {content.teacher_guide?.lesson_overview || content.description || 'This assignment helps students practice and demonstrate their understanding of the topic.'}
                      </BionicText>
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">How It Fits With Course Goals</h4>
                    <p className="text-muted-foreground">
                      <BionicText>
                        {content.teacher_guide?.course_alignment || `This lesson aligns with the ${assignment.curriculum_items?.courses?.subject} curriculum and builds toward mastery of key concepts. It scaffolds student learning by connecting prior knowledge with new material, reinforcing fundamental skills while introducing advanced applications.`}
                      </BionicText>
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Introducing to Students</h4>
                    <p className="text-muted-foreground">
                      <BionicText>
                        {content.teacher_guide?.introduction_strategy || 'Begin by reviewing the learning objectives with your student. Help them understand why this topic matters and how it connects to what they\'ve learned before. Encourage questions and check for understanding before they start. Remind them to read carefully and take their time with each question.'}
                      </BionicText>
                    </p>
                  </div>

                  {content.teacher_guide?.discussion_prompts && content.teacher_guide.discussion_prompts.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Discussion Prompts</h4>
                      <ul className="space-y-2">
                        {content.teacher_guide.discussion_prompts.map((prompt: string, idx: number) => (
                          <li key={idx} className="text-sm text-muted-foreground pl-4 border-l-2 border-primary">
                            <BionicText>{prompt}</BionicText>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {content.teacher_guide?.assessment_guidance && (
                    <div>
                      <h4 className="font-semibold mb-2">Assessment Guidance</h4>
                      <p className="text-muted-foreground">
                        <BionicText>{content.teacher_guide.assessment_guidance}</BionicText>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    Beyond the Screen Activities
                  </CardTitle>
                  <CardDescription>Hands-on activities to enhance learning</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {content.teacher_guide?.beyond_screen_activities && content.teacher_guide.beyond_screen_activities.length > 0 ? (
                      content.teacher_guide.beyond_screen_activities.map((activity: any, idx: number) => (
                        <div key={idx} className="border-l-4 border-primary pl-4 py-2">
                          <h4 className="font-semibold mb-2">{activity.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            <BionicText>{activity.description}</BionicText>
                          </p>
                          {activity.materials && activity.materials.length > 0 && (
                            <div className="text-xs text-muted-foreground mb-1">
                              <span className="font-medium">Materials:</span> {activity.materials.join(', ')}
                            </div>
                          )}
                          {activity.time_estimate && (
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">Time:</span> {activity.time_estimate}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="border-l-4 border-primary pl-4 py-2">
                          <h4 className="font-semibold mb-2">Activity 1: Creative Expression</h4>
                          <p className="text-sm text-muted-foreground">
                            <BionicText>
                              Have your student create a visual representation of what they learned using art supplies, building materials, or even a nature walk. This could be a poster, diagram, comic strip, or 3D model that explains the key concepts in their own way.
                            </BionicText>
                          </p>
                        </div>

                        <div className="border-l-4 border-primary pl-4 py-2">
                          <h4 className="font-semibold mb-2">Activity 2: Real-World Connection</h4>
                          <p className="text-sm text-muted-foreground">
                            <BionicText>
                              Encourage your student to find real-world examples of the concepts they're learning. This could involve conducting simple experiments, interviewing family members, taking photos of examples in their environment, or writing about how they see these ideas in daily life.
                            </BionicText>
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Offline Activity Log</CardTitle>
                  <CardDescription>
                    Track supplementary work and hands-on activities completed outside the system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Activities Completed
                    </label>
                    <Textarea
                      placeholder="Describe the offline activities your student completed (e.g., built a model, conducted an experiment, created artwork, had a discussion...)"
                      value={offlineActivities}
                      onChange={(e) => setOfflineActivities(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Grade / Assessment for Offline Work
                    </label>
                    <Textarea
                      placeholder="Record your assessment of the offline activities (e.g., 'Excellent - showed deep understanding', 'Good effort - needs more practice with...', or a letter/number grade)"
                      value={offlineGrade}
                      onChange={(e) => setOfflineGrade(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <Button 
                    onClick={handleSaveTeacherNotes}
                    disabled={savingNotes}
                    className="w-full"
                  >
                    {savingNotes ? 'Saving...' : 'Save Notes'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isParent && submissions.length > 0 && (
            <TabsContent value="attempts" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Student Submission History</h3>
                <Button 
                  onClick={handleGenerateRemedialAssignment}
                  disabled={generatingRemedial}
                  className="gap-2"
                >
                  <Brain className="h-4 w-4" />
                  {generatingRemedial ? 'Generating...' : 'Generate Targeted Assignment'}
                </Button>
              </div>
              
              {submissions.map((submission) => (
                <Card key={submission.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Attempt #{submission.attempt_no}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {Math.floor(submission.time_spent_seconds / 60)} min
                        </span>
                        <span>
                          {new Date(submission.submitted_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {submission.question_responses && submission.question_responses.length > 0 ? (
                      <div className="space-y-4">
                        {submission.question_responses.map((response: any, idx: number) => {
                          const question = content.questions?.find((q: any) => q.id === response.question_id);
                          if (!question) return null;
                          
                          return (
                            <div key={response.id} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium flex-1">
                                  Question {idx + 1}: <BionicText>{question.question}</BionicText>
                                </h4>
                                <Badge variant={response.is_correct ? 'default' : 'destructive'}>
                                  {response.is_correct ? 'Correct' : 'Incorrect'}
                                </Badge>
                              </div>
                              
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="font-medium">Student Answer: </span>
                                  <span className="text-muted-foreground">
                                    {typeof response.answer === 'object' 
                                      ? JSON.stringify(response.answer) 
                                      : response.answer}
                                  </span>
                                </div>
                                
                                {!response.is_correct && (
                                  <div>
                                    <span className="font-medium">Correct Answer: </span>
                                    <span className="text-success">
                                      {typeof question.correct_answer === 'object'
                                        ? JSON.stringify(question.correct_answer)
                                        : question.correct_answer}
                                    </span>
                                  </div>
                                )}
                                
                                {question.explanation && (
                                  <div className="pt-2 border-t">
                                    <span className="font-medium">Explanation: </span>
                                    <p className="text-muted-foreground mt-1">
                                      <BionicText>{question.explanation}</BionicText>
                                    </p>
                                  </div>
                                )}
                                
                                {response.time_spent_seconds > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {response.time_spent_seconds}s spent
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No question responses recorded.</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          )}

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
                  <TextToSpeech text={content.objectives?.join('. ') || ''}>
                    <ul className="space-y-2">
                      {content.objectives.map((obj: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <BionicText>{obj}</BionicText>
                        </li>
                      ))}
                    </ul>
                  </TextToSpeech>
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
                    <p className="font-medium mb-2">Supportive Tips:</p>
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
                    <TextToSpeech text={cleanMarkdown(content.instructions)}>
                      <p className="whitespace-pre-wrap"><BionicText>{cleanMarkdown(content.instructions)}</BionicText></p>
                    </TextToSpeech>
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
            {/* Study Guide Panel - AI-generated question-specific learning resources */}
            {content.questions?.length > 0 && (
              <StudyGuidePanel
                assignmentId={assignment.id}
                questions={content.questions}
                studentProfile={{
                  grade_level: assignment.curriculum_items?.courses?.student_id 
                    ? 'N/A' // Will be fetched from student data if needed
                    : 'General',
                  learning_style: undefined,
                  interests: []
                }}
                readingMaterials={content.reading_materials}
                studentId={currentStudentId || undefined}
              />
            )}

            {/* External Materials (if provided by assignment generator) */}
            {content.materials?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    External Resources
                  </CardTitle>
                  <CardDescription>
                    Additional materials recommended for this assignment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {content.materials.map((material: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <BionicText>{material}</BionicText>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {!content.questions?.length && !content.materials?.length && (
              <Card>
                <CardHeader>
                  <CardTitle>Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No resources available for this assignment</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {!isParent && currentStudentId && (
            <TabsContent value="notes">
              <AssignmentNotes
                assignmentId={assignment.id}
                studentId={currentStudentId}
                courseId={assignment.curriculum_items?.courses?.id || assignment.curriculum_items?.course_id}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
