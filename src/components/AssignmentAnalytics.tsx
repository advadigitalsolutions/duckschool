import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Clock, TrendingUp, CheckCircle2, XCircle, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface AssignmentAnalyticsProps {
  assignmentId: string;
  studentId: string;
}

interface SubmissionData {
  id: string;
  attempt_no: number;
  time_spent_seconds: number;
  submitted_at: string;
  content: any;
}

interface QuestionResponse {
  question_id: string;
  is_correct: boolean;
  time_spent_seconds: number;
  attempt_number: number;
}

export function AssignmentAnalytics({ assignmentId, studentId }: AssignmentAnalyticsProps) {
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [questionResponses, setQuestionResponses] = useState<QuestionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [assignmentId, studentId]);

  const fetchAnalytics = async () => {
    try {
      // Fetch submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .order('attempt_no', { ascending: true });

      if (submissionsError) throw submissionsError;
      setSubmissions(submissionsData || []);

      // Fetch question responses
      if (submissionsData && submissionsData.length > 0) {
        const submissionIds = submissionsData.map(s => s.id);
        const { data: responsesData, error: responsesError } = await supabase
          .from('question_responses')
          .select('*')
          .in('submission_id', submissionIds);

        if (responsesError) throw responsesError;
        setQuestionResponses(responsesData || []);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No submissions yet</p>
        </CardContent>
      </Card>
    );
  }

  const totalAttempts = submissions.length;
  const totalTimeSpent = submissions.reduce((sum, s) => sum + s.time_spent_seconds, 0);
  const latestSubmission = submissions[submissions.length - 1];
  const latestScore = latestSubmission.content?.score || 0;
  const maxScore = latestSubmission.content?.maxScore || 100;

  // Calculate question-level analytics
  const questionStats: Record<string, { attempts: number; correctCount: number; totalTime: number }> = {};
  
  questionResponses.forEach(response => {
    if (!questionStats[response.question_id]) {
      questionStats[response.question_id] = { attempts: 0, correctCount: 0, totalTime: 0 };
    }
    questionStats[response.question_id].attempts++;
    if (response.is_correct) questionStats[response.question_id].correctCount++;
    questionStats[response.question_id].totalTime += response.time_spent_seconds;
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {totalAttempts}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Time Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-secondary" />
              {formatTime(totalTimeSpent)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Latest Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {latestScore === maxScore ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <BarChart3 className="h-5 w-5 text-orange-500" />
              )}
              {latestScore}/{maxScore}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Time Per Attempt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              {formatTime(Math.floor(totalTimeSpent / totalAttempts))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attempt History */}
      <Card>
        <CardHeader>
          <CardTitle>Attempt History</CardTitle>
          <CardDescription>Scores and time spent for each attempt</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {submissions.map((submission) => (
              <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Badge variant="outline">Attempt #{submission.attempt_no}</Badge>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatTime(submission.time_spent_seconds)}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(submission.submitted_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {submission.content?.score || 0}/{submission.content?.maxScore || 100}
                  </span>
                  {submission.content?.score === submission.content?.maxScore ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-orange-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Question-Level Analytics */}
      {Object.keys(questionStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Question Performance</CardTitle>
            <CardDescription>Attempts and success rate per question</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(questionStats).map(([questionId, stats]) => {
                const successRate = Math.round((stats.correctCount / stats.attempts) * 100);
                return (
                  <div key={questionId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4 flex-1">
                      <span className="font-medium text-sm">{questionId}</span>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formatTime(stats.totalTime)}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {stats.attempts} attempt{stats.attempts !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={successRate === 100 ? "default" : "secondary"}>
                        {successRate}% correct
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}