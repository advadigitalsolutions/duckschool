import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Plus,
  Calendar,
  FileText,
  ChevronDown,
  BarChart3,
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
  User,
  Check
} from 'lucide-react';
import { WeeklyView } from '@/components/WeeklyView';
import { OverdueWorkTab } from '@/components/OverdueWorkTab';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AddCourseDialog } from '@/components/AddCourseDialog';
import { AddAssignmentDialog } from '@/components/AddAssignmentDialog';
import { StandardsPlanningDialog } from '@/components/StandardsPlanningDialog';
import { AssignmentAnalytics } from '@/components/AssignmentAnalytics';
import { EditAssignmentDialog } from '@/components/EditAssignmentDialog';
import { DeleteAssignmentDialog } from '@/components/DeleteAssignmentDialog';
import { EditCourseDialog } from '@/components/EditCourseDialog';
import { DeleteCourseDialog } from '@/components/DeleteCourseDialog';
import { ArchiveCourseDialog } from '@/components/ArchiveCourseDialog';
import { PersonalityReportView } from '@/components/PersonalityReportView';
import { StudentGrades } from '@/components/StudentGrades';
import { GlobalCourseSettingsDialog } from '@/components/GlobalCourseSettingsDialog';
import { Settings } from 'lucide-react';
import { FocusAnalyticsDashboard } from '@/components/FocusAnalyticsDashboard';

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAssignments, setExpandedAssignments] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [processingSession, setProcessingSession] = useState(false);
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);

  useEffect(() => {
    fetchStudentData();
  }, [id, showArchived]);

  const fetchStudentData = async () => {
    try {
      // Fetch student
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();

      if (studentError) throw studentError;
      setStudent(studentData);

      // Fetch courses (include archived based on toggle)
      const coursesQuery = supabase
        .from('courses')
        .select('*')
        .eq('student_id', id)
        .order('created_at', { ascending: false });

      if (!showArchived) {
        coursesQuery.eq('archived', false);
      }

      const { data: coursesData } = await coursesQuery;
      setCourses(coursesData || []);

      // Fetch curriculum items for the student's courses
      const courseIds = coursesData?.map(c => c.id) || [];
      const { data: curriculumData } = await supabase
        .from('curriculum_items')
        .select('id')
        .in('course_id', courseIds);

      const curriculumItemIds = curriculumData?.map(ci => ci.id) || [];

      // Fetch assignments with curriculum items
      const { data: assignmentsData } = curriculumItemIds.length > 0 
        ? await supabase
            .from('assignments')
            .select(`
              *,
              curriculum_items (
                *,
                courses (
                  title,
                  subject
                )
              )
            `)
            .in('curriculum_item_id', curriculumItemIds)
        : { data: [] };

      setAssignments(assignmentsData || []);
    } catch (error: any) {
      toast.error('Failed to load student data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAssignmentExpanded = (assignmentId: string) => {
    setExpandedAssignments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assignmentId)) {
        newSet.delete(assignmentId);
      } else {
        newSet.add(assignmentId);
      }
      return newSet;
    });
  };

  const handleProcessSession = async () => {
    if (!window.confirm('This will update the student profile and recreate courses based on the curriculum planning conversation. Continue?')) {
      return;
    }

    setProcessingSession(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-curriculum-session', {
        body: JSON.stringify({ studentId: id }),
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (error) throw error;

      toast.success('Profile updated successfully! Refreshing...');
      
      // Reload the student data and courses
      await fetchStudentData();
    } catch (error: any) {
      console.error('Error processing session:', error);
      toast.error('Error processing session: ' + (error?.message || 'Unknown error'));
    } finally {
      setProcessingSession(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Student not found</p>
          <Button onClick={() => navigate('/parent')}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/parent')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar 
              className="h-16 w-16 cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={() => navigate('/parent/profile')}
            >
              <AvatarImage src={student.avatar_url || ''} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{student.name}</h1>
              <p className="text-sm text-muted-foreground">
                Grade {student.grade_level || 'N/A'}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-8">
        {/* Student Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Student Information</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleProcessSession}
                disabled={processingSession}
              >
                {processingSession ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Processing...
                  </>
                ) : (
                  'Update from Planning Session'
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                <p>{student.dob ? new Date(student.dob).toLocaleDateString() : 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Grade Level</p>
                <p>{student.grade_level || 'Not set'}</p>
              </div>
            </div>
            
            {student.accommodations?.notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">ADHD Accommodations</p>
                <p className="text-sm">{student.accommodations.notes}</p>
              </div>
            )}
            
            {student.goals?.notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Learning Goals</p>
                <p className="text-sm">{student.goals.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processing Overlay */}
        {processingSession && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <Card className="w-96">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <div className="text-center">
                    <p className="font-semibold">Processing Curriculum Planning Session</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Creating courses and generating assessments...
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This may take a few minutes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="this-week" className="space-y-4">
          <TabsList>
            <TabsTrigger value="this-week">This Week</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="all-assignments">All Assignments</TabsTrigger>
            <TabsTrigger value="time-analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Time Analytics
            </TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="learning-profile">
              Learning Profile
              {student?.profile_assessment_completed && (
                <Check className="ml-2 h-4 w-4 text-success" />
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="this-week" className="space-y-4">
            <WeeklyView studentId={student.id} />
          </TabsContent>

          <TabsContent value="overdue" className="space-y-4">
            <OverdueWorkTab studentId={student.id} />
          </TabsContent>

          <TabsContent value="courses" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div>
                      <CardTitle>Courses</CardTitle>
                      <CardDescription>Manage courses for {student.name}</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowGlobalSettings(true)}
                      title="Configure All Courses"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowArchived(!showArchived)}
                    >
                      {showArchived ? 'Hide Archived' : 'Show Archived'}
                    </Button>
                    <StandardsPlanningDialog 
                      studentId={student.id} 
                      onFrameworkCreated={fetchStudentData} 
                    />
                    <AddCourseDialog studentId={student.id} onCourseAdded={fetchStudentData} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {courses.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No courses yet</p>
                    <div className="flex gap-2 justify-center">
                      <StandardsPlanningDialog 
                        studentId={student.id} 
                        onFrameworkCreated={fetchStudentData} 
                      />
                      <AddCourseDialog studentId={student.id} onCourseAdded={fetchStudentData} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courses.map((course) => (
                      <Card key={course.id} className={course.archived ? 'opacity-60' : ''}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">{course.title}</CardTitle>
                                {course.archived && <Badge variant="secondary">Archived</Badge>}
                                {course.initiated_by_role === 'student' && (
                                  <Badge variant="outline" className="border-primary/50 text-primary">
                                    <User className="h-3 w-3 mr-1" />
                                    Student-Initiated
                                  </Badge>
                                )}
                              </div>
                              <CardDescription>{course.subject}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/course/${course.id}`)}
                              >
                                View Progress
                              </Button>
                              <Badge>{course.credits} credit{course.credits !== 1 ? 's' : ''}</Badge>
                              <EditCourseDialog
                                course={course}
                                onCourseUpdated={fetchStudentData}
                                trigger={
                                  <Button variant="ghost" size="icon">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                }
                              />
                              <ArchiveCourseDialog
                                course={course}
                                onCourseUpdated={fetchStudentData}
                                trigger={
                                  <Button variant="ghost" size="icon">
                                    {course.archived ? (
                                      <ArchiveRestore className="h-4 w-4" />
                                    ) : (
                                      <Archive className="h-4 w-4" />
                                    )}
                                  </Button>
                                }
                              />
                              <DeleteCourseDialog
                                course={course}
                                onCourseDeleted={fetchStudentData}
                                trigger={
                                  <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                }
                              />
                            </div>
                          </div>
                        </CardHeader>
                        {course.description && (
                          <CardContent>
                            <p className="text-sm text-muted-foreground">{course.description}</p>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all-assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Assignments</CardTitle>
                    <CardDescription>Current and upcoming work</CardDescription>
                  </div>
                  {courses.length > 0 && (
                    <AddAssignmentDialog 
                      courses={courses} 
                      studentId={student.id}
                      onAssignmentAdded={fetchStudentData} 
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {courses.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">No courses yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create a course first to add assignments
                    </p>
                    <AddCourseDialog studentId={student.id} onCourseAdded={fetchStudentData} />
                  </div>
                ) : assignments.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No assignments yet</p>
                    <AddAssignmentDialog 
                      courses={courses} 
                      studentId={student.id}
                      onAssignmentAdded={fetchStudentData} 
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <Collapsible
                        key={assignment.id}
                        open={expandedAssignments.has(assignment.id)}
                        onOpenChange={() => toggleAssignmentExpanded(assignment.id)}
                      >
                        <Card className="transition-all duration-300 hover:border-orange-500">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-base cursor-pointer" onClick={() => navigate(`/assignment/${assignment.id}`)}>
                                    {assignment.curriculum_items?.body?.title || assignment.curriculum_items?.title}
                                  </CardTitle>
                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <ChevronDown className={`h-4 w-4 transition-transform ${expandedAssignments.has(assignment.id) ? 'rotate-180' : ''}`} />
                                    </Button>
                                  </CollapsibleTrigger>
                                </div>
                                <CardDescription>
                                  {assignment.curriculum_items?.courses?.subject}
                                </CardDescription>
                                {assignment.due_at && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Due: {new Date(assignment.due_at).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={
                                  assignment.status === 'graded' ? 'default' :
                                  assignment.status === 'submitted' ? 'secondary' : 
                                  'outline'
                                }>
                                  {assignment.status}
                                </Badge>
                                <EditAssignmentDialog 
                                  assignment={assignment} 
                                  onAssignmentUpdated={fetchStudentData}
                                  trigger={
                                    <Button variant="ghost" size="icon">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  }
                                />
                                <DeleteAssignmentDialog 
                                  assignment={assignment} 
                                  onAssignmentDeleted={fetchStudentData}
                                  trigger={
                                    <Button variant="ghost" size="icon">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  }
                                />
                                <CollapsibleTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <BarChart3 className="h-4 w-4 mr-1" />
                                    Analytics
                                  </Button>
                                </CollapsibleTrigger>
                              </div>
                            </div>
                          </CardHeader>
                          <CollapsibleContent>
                            <CardContent>
                              <AssignmentAnalytics assignmentId={assignment.id} studentId={student.id} />
                            </CardContent>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="time-analytics" className="space-y-4">
            <FocusAnalyticsDashboard studentId={student.id} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Course Analytics</CardTitle>
                <CardDescription>Select a course to view detailed analytics and progress</CardDescription>
              </CardHeader>
              <CardContent>
                {courses.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No courses yet</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {courses.filter(c => !c.archived).map((course) => (
                      <Card 
                        key={course.id} 
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => navigate(`/course/${course.id}`)}
                      >
                        <CardHeader>
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{course.title}</CardTitle>
                            {course.initiated_by_role === 'student' && (
                              <Badge variant="outline" className="border-primary/50 text-primary" title="This course was created by the student">
                                <User className="h-3 w-3 mr-1" />
                                Student-Initiated
                              </Badge>
                            )}
                          </div>
                          <CardDescription>{course.subject}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button variant="ghost" className="w-full">
                            <BarChart3 className="mr-2 h-4 w-4" />
                            View Detailed Analytics
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <StudentGrades studentId={student.id} />
          </TabsContent>

          <TabsContent value="learning-profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Learning Profile & Personality Type</CardTitle>
                <CardDescription>
                  View {student.name}'s learning style assessment results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PersonalityReportView student={student} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <GlobalCourseSettingsDialog
        open={showGlobalSettings}
        onOpenChange={setShowGlobalSettings}
        studentId={student.id}
        onUpdate={fetchStudentData}
      />
    </div>
  );
}
