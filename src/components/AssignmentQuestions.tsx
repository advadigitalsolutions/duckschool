import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Clock, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { cleanMarkdown } from '@/utils/textFormatting';
import { useXPConfig } from '@/hooks/useXP';
import { BionicText } from './BionicText';
import { TextToSpeech } from './TextToSpeech';
import { MathText } from './MathText';

interface Question {
  id: string;
  type: 'multiple_choice' | 'short_answer' | 'numeric';
  question: string;
  points: number;
  options?: string[];
  correct_answer: string | number;
  tolerance?: number;
  explanation: string;
}

interface AssignmentQuestionsProps {
  assignment: any;
  studentId: string;
  onBack?: () => void;
}

export function AssignmentQuestions({ assignment, studentId, onBack }: AssignmentQuestionsProps) {
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [detailedResults, setDetailedResults] = useState<Record<string, { isCorrect: boolean; score: number; feedback?: string }>>({});
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});
  const [currentQuestionStart, setCurrentQuestionStart] = useState<Record<string, number>>({});
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [draftSubmissionId, setDraftSubmissionId] = useState<string | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const { config: xpConfig } = useXPConfig();

  // Helper function to check if an answer is valid (not empty, undefined, or null)
  const isAnswerValid = (answer: string | number | undefined): boolean => {
    return answer !== undefined && answer !== null && answer !== '';
  };

  const assignmentBody = typeof assignment?.curriculum_items?.body === 'string'
    ? JSON.parse(assignment.curriculum_items.body)
    : assignment?.curriculum_items?.body || {};
  const questions: Question[] = assignmentBody.questions || [];
  const maxAttempts = assignment?.max_attempts;

  useEffect(() => {
    // Calculate max score
    const max = questions.reduce((sum, q) => sum + q.points, 0);
    setMaxScore(max);

    // Load previous attempts and draft progress
    loadProgress();
  }, [questions]);

  // Initialize draft submission on mount
  useEffect(() => {
    if (!draftSubmissionId && !submitted && !loadingDraft) {
      createDraftSubmission();
    }
  }, [loadingDraft]);

  // Debounced auto-save when answers change
  useEffect(() => {
    if (!draftSubmissionId || submitted) return;

    const timeoutId = setTimeout(() => {
      const currentQuestionId = questions[currentQuestionIndex]?.id;
      const currentAnswer = answers[currentQuestionId];
      
      if (currentAnswer !== undefined) {
        const timeSpent = questionTimes[currentQuestionId] || 0;
        saveAnswer(currentQuestionId, currentAnswer, timeSpent);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [answers, draftSubmissionId, submitted]);

  // Log button states for debugging
  useEffect(() => {
    if (!loadingDraft) {
      console.log('[AssignmentQuestions] Button state check:', {
        currentQuestionIndex,
        totalQuestions: questions.length,
        isLastQuestion: currentQuestionIndex === questions.length - 1,
        isCurrentQuestionAnswered: isAnswerValid(answers[questions[currentQuestionIndex]?.id]),
        currentAnswer: answers[questions[currentQuestionIndex]?.id],
        isSaving
      });
    }
  }, [currentQuestionIndex, answers, isSaving, loadingDraft, questions]);

  const loadProgress = async () => {
    try {
      setLoadingDraft(true);
      
      // Check for draft submission
      const { data: draftData, error: draftError } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignment.id)
        .eq('student_id', studentId)
        .is('submitted_at', null)
        .order('attempt_no', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!draftError && draftData) {
        console.log('Restoring draft:', draftData.id);
        setDraftSubmissionId(draftData.id);
        setAttemptNumber(draftData.attempt_no);
        
        // Load saved answers from question_responses
        const { data: responses } = await supabase
          .from('question_responses')
          .select('*')
          .eq('submission_id', draftData.id);

        if (responses && responses.length > 0) {
          const restoredAnswers: Record<string, string | number> = {};
          const restoredTimes: Record<string, number> = {};
          
          responses.forEach(response => {
            const answerData = response.answer as any;
            restoredAnswers[response.question_id] = answerData?.value ?? answerData;
            restoredTimes[response.question_id] = response.time_spent_seconds || 0;
          });
          
          setAnswers(restoredAnswers);
          setQuestionTimes(restoredTimes);
          
          // Restore the exact question index the user was on
          const savedIndex = (draftData.content as any)?.currentQuestionIndex;
          if (savedIndex !== undefined && savedIndex >= 0 && savedIndex < questions.length) {
            setCurrentQuestionIndex(savedIndex);
          } else {
            // Fallback: find first unanswered question
            const firstUnanswered = questions.findIndex(q => !restoredAnswers[q.id]);
            setCurrentQuestionIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
          }
          
          toast.success('Progress restored!');
        }
      } else {
        // Determine next attempt number
        const { data } = await supabase
          .from('submissions')
          .select('attempt_no')
          .eq('assignment_id', assignment.id)
          .eq('student_id', studentId)
          .not('submitted_at', 'is', null)
          .order('attempt_no', { ascending: false })
          .limit(1);

        const nextAttempt = data && data.length > 0 ? data[0].attempt_no + 1 : 1;
        setAttemptNumber(nextAttempt);
        
        if (maxAttempts && nextAttempt > maxAttempts) {
          setSubmitted(true);
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoadingDraft(false);
    }
  };

  const createDraftSubmission = async () => {
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        assignment_id: assignment.id,
        student_id: studentId,
        attempt_no: attemptNumber,
        content: {},
        time_spent_seconds: 0,
        submitted_at: null
      })
      .select()
      .single();

    if (!error && data) {
      setDraftSubmissionId(data.id);
      console.log('Draft created:', data.id);
    }
  };

  const saveAnswer = async (questionId: string, answer: any, timeSpent: number, retryCount = 0): Promise<boolean> => {
    if (!draftSubmissionId) return false;

    setIsSaving(true);
    setSaveError(null);
    console.log('[AssignmentQuestions] Saving answer for question:', questionId);

    try {
      // Upsert answer to question_responses
      const { data: existing } = await supabase
        .from('question_responses')
        .select('id')
        .eq('submission_id', draftSubmissionId)
        .eq('question_id', questionId)
        .eq('attempt_number', attemptNumber)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('question_responses')
          .update({
            answer: { value: answer },
            time_spent_seconds: timeSpent
          })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('question_responses')
          .insert({
            submission_id: draftSubmissionId,
            question_id: questionId,
            answer: { value: answer },
            time_spent_seconds: timeSpent,
            attempt_number: attemptNumber
          });
        
        if (error) throw error;
      }

      // Also update the draft submission to save current question index
      await supabase
        .from('submissions')
        .update({
          content: { currentQuestionIndex }
        })
        .eq('id', draftSubmissionId);

      console.log('[AssignmentQuestions] ✓ Answer saved successfully');
      setIsSaving(false);
      return true;
    } catch (error) {
      console.error('[AssignmentQuestions] ✗ Error saving answer:', error);
      
      // Retry logic (max 3 attempts)
      if (retryCount < 2) {
        console.log(`[AssignmentQuestions] Retrying save (attempt ${retryCount + 2}/3)...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        return saveAnswer(questionId, answer, timeSpent, retryCount + 1);
      }
      
      setSaveError('Failed to save answer. Please try again.');
      setIsSaving(false);
      toast.error('Failed to save your answer. Please try again.');
      return false;
    }
  };

  const loadAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('attempt_no')
        .eq('assignment_id', assignment.id)
        .eq('student_id', studentId)
        .not('submitted_at', 'is', null)
        .order('attempt_no', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        const nextAttempt = data[0].attempt_no + 1;
        setAttemptNumber(nextAttempt);
        
        // If they've exceeded max attempts, mark as submitted
        if (maxAttempts && nextAttempt > maxAttempts) {
          setSubmitted(true);
        }
      }
    } catch (error) {
      console.error('Error loading attempts:', error);
    }
  };

  const trackQuestionTime = (questionId: string) => {
    const now = Date.now();
    if (currentQuestionStart[questionId]) {
      const timeSpent = Math.floor((now - currentQuestionStart[questionId]) / 1000);
      setQuestionTimes(prev => ({
        ...prev,
        [questionId]: (prev[questionId] || 0) + timeSpent
      }));
    }
    setCurrentQuestionStart(prev => ({
      ...prev,
      [questionId]: now
    }));
  };

  const handleAnswerChange = (questionId: string, value: string | number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    trackQuestionTime(questionId);
  };

  const gradeAnswer = async (question: Question, answer: string | number): Promise<{ isCorrect: boolean; score: number; feedback?: string }> => {
    if (question.type === 'numeric') {
      const numAnswer = typeof answer === 'number' ? answer : parseFloat(answer as string);
      const correctAnswer = typeof question.correct_answer === 'number' 
        ? question.correct_answer 
        : parseFloat(question.correct_answer as string);
      const tolerance = question.tolerance || 0.01;
      const isCorrect = Math.abs(numAnswer - correctAnswer) <= tolerance;
      return { isCorrect, score: isCorrect ? 1 : 0 };
    } else if (question.type === 'multiple_choice') {
      // Normalize both strings for comparison (lowercase, trim)
      const studentAnswer = String(answer || '').toLowerCase().trim();
      const correctAnswer = String(question.correct_answer || '').toLowerCase().trim();
      const isCorrect = studentAnswer === correctAnswer;
      return { isCorrect, score: isCorrect ? 1 : 0 };
    } else {
      // For short answer and essay, use AI grading
      try {
        const { data, error } = await supabase.functions.invoke('grade-open-response', {
          body: {
            question: question.question,
            studentAnswer: answer,
            correctAnswer: question.correct_answer,
            maxPoints: question.points || 1
          }
        });

        if (error) throw error;

        // Consider it correct if score >= 0.7 (70% understanding)
        return {
          isCorrect: data.score >= 0.7,
          score: data.score,
          feedback: data.feedback
        };
      } catch (error) {
        console.error('Error grading with AI:', error);
        // Fallback to simple string matching if AI grading fails
        const answerStr = (answer as string).toLowerCase().trim();
        const correctStr = (question.correct_answer as string).toLowerCase().trim();
        const isCorrect = answerStr.includes(correctStr) || correctStr.includes(answerStr);
        return { isCorrect, score: isCorrect ? 1 : 0 };
      }
    }
  };

  const handleSubmit = async () => {
    // Check if all questions answered with valid values
    const unanswered = questions.filter(q => !isAnswerValid(answers[q.id]));
    if (unanswered.length > 0) {
      toast.error(`Please answer all questions. ${unanswered.length} remaining.`);
      return;
    }

    // Check max attempts
    if (maxAttempts && attemptNumber > maxAttempts) {
      toast.error(`Maximum attempts (${maxAttempts}) reached`);
      return;
    }

    // Track time for current question before submitting
    const currentQuestionId = questions[currentQuestionIndex].id;
    trackQuestionTime(currentQuestionId);

    setSubmitting(true);

    try {
      // Grade answers
      const gradedResults: Record<string, boolean> = {};
      const detailedResults: Record<string, { isCorrect: boolean; score: number; feedback?: string }> = {};
      let score = 0;
      let correctCount = 0;

      // Grade all questions (handle async grading)
      for (const question of questions) {
        const result = await gradeAnswer(question, answers[question.id]);
        detailedResults[question.id] = result;
        gradedResults[question.id] = result.isCorrect;
        // Use the partial score for open-ended questions
        score += result.score * question.points;
        if (result.isCorrect) {
          correctCount++;
        }
      }

      setResults(gradedResults);
      setDetailedResults(detailedResults);
      setTotalScore(score);

      // Calculate total time spent
      const totalTime = Object.values(questionTimes).reduce((sum, time) => sum + time, 0);

      let submissionData;
      
      if (draftSubmissionId) {
        // Update existing draft submission to finalize it
        const { data, error: submissionError } = await supabase
          .from('submissions')
          .update({
            submitted_at: new Date().toISOString(),
            time_spent_seconds: totalTime,
            content: { answers, results: gradedResults, score, maxScore }
          })
          .eq('id', draftSubmissionId)
          .select()
          .single();

        if (submissionError) throw submissionError;
        submissionData = data;
      } else {
        // Create new submission
        const { data, error: submissionError } = await supabase
          .from('submissions')
          .insert({
            assignment_id: assignment.id,
            student_id: studentId,
            attempt_no: attemptNumber,
            time_spent_seconds: totalTime,
            content: { answers, results: gradedResults, score, maxScore }
          })
          .select()
          .single();

        if (submissionError) throw submissionError;
        submissionData = data;
      }

      // Create question responses
      const responses = questions.map(question => ({
        submission_id: submissionData.id,
        question_id: question.id,
        answer: { value: answers[question.id] },
        is_correct: gradedResults[question.id],
        time_spent_seconds: questionTimes[question.id] || 0,
        attempt_number: attemptNumber
      }));

      const { error: responsesError } = await supabase
        .from('question_responses')
        .insert(responses);

      if (responsesError) throw responsesError;

      // Create grade
      const { error: gradeError } = await supabase
        .from('grades')
        .insert({
          assignment_id: assignment.id,
          student_id: studentId,
          score,
          max_score: maxScore,
          grader: 'ai',
          rubric_scores: gradedResults
        });

      if (gradeError) throw gradeError;

      // Award XP for correct answers
      if (xpConfig && correctCount > 0) {
        const xpPerQuestion = xpConfig.question_correct_xp;
        const totalXP = correctCount * xpPerQuestion;
        
        await supabase.from('xp_events').insert({
          student_id: studentId,
          amount: totalXP,
          event_type: 'question_correct',
          description: `Answered ${correctCount} questions correctly`,
          reference_id: assignment.id,
        });
      }

      setSubmitted(true);
      
      if (score === maxScore) {
        toast.success('Perfect score! 🎉 Assignment completed!');
      } else {
        toast.success(`Score: ${score}/${maxScore}. Review incorrect answers and try again!`);
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error('Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTryAgain = () => {
    setSubmitted(false);
    setAnswers({});
    setResults({});
    setDetailedResults({});
    setQuestionTimes({});
    setCurrentQuestionStart({});
    setAttemptNumber(prev => prev + 1);
    setCurrentQuestionIndex(0);
    loadAttempts();
  };

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      console.log('[AssignmentQuestions] Next button clicked, current index:', currentQuestionIndex);
      
      // Save current answer before moving
      const currentQuestionId = questions[currentQuestionIndex].id;
      const currentAnswer = answers[currentQuestionId];
      const timeSpent = questionTimes[currentQuestionId] || 0;
      
      if (currentAnswer !== undefined) {
        const saved = await saveAnswer(currentQuestionId, currentAnswer, timeSpent);
        if (!saved) {
          console.error('[AssignmentQuestions] Failed to save answer, blocking navigation');
          return; // Don't navigate if save failed
        }
      }
      
      trackQuestionTime(currentQuestionId);
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);
      
      // Save the new question position
      if (draftSubmissionId) {
        await supabase
          .from('submissions')
          .update({ content: { currentQuestionIndex: newIndex } })
          .eq('id', draftSubmissionId);
      }
      
      console.log('[AssignmentQuestions] Moved to question:', newIndex);
    }
  };

  const handleSkipQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      console.log('[AssignmentQuestions] Skipping question:', currentQuestionIndex);
      trackQuestionTime(questions[currentQuestionIndex].id);
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);
      
      // Save the new question position
      if (draftSubmissionId) {
        await supabase
          .from('submissions')
          .update({ content: { currentQuestionIndex: newIndex } })
          .eq('id', draftSubmissionId);
      }
      
      toast.info('Question skipped. You can come back to it later.');
    }
  };

  const handleRefreshAnswers = async () => {
    console.log('[AssignmentQuestions] Refreshing answers from database...');
    setLoadingDraft(true);
    await loadProgress();
    toast.success('Answers refreshed from saved progress');
  };

  const handlePrevious = async () => {
    if (currentQuestionIndex > 0) {
      // Track time before moving to previous question
      const currentQuestionId = questions[currentQuestionIndex].id;
      trackQuestionTime(currentQuestionId);
      const newIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(newIndex);
      
      // Save the new question position
      if (draftSubmissionId) {
        await supabase
          .from('submissions')
          .update({ content: { currentQuestionIndex: newIndex } })
          .eq('id', draftSubmissionId);
      }
    }
  };

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No questions available for this assignment yet.</p>
        </CardContent>
      </Card>
    );
  }

  // Show loading state while restoring progress
  if (loadingDraft) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Loading your progress...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Block access if max attempts exceeded
  if (maxAttempts && attemptNumber > maxAttempts && !submitted) {
    return (
      <Card className="border-2 border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-6 w-6 text-destructive" />
            Maximum Attempts Reached
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            You have completed all {maxAttempts} attempts for this assignment.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate progress based on valid answers only
  const validAnswersCount = questions.filter(q => isAnswerValid(answers[q.id])).length;
  const progress = (validAnswersCount / questions.length) * 100;
  const currentQuestion = questions[currentQuestionIndex];
  const isCurrentQuestionAnswered = isAnswerValid(answers[currentQuestion?.id]);

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {validAnswersCount} / {questions.length} answered
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Submission Results */}
      {submitted && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {totalScore === maxScore ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  Perfect Score!
                </>
              ) : (
                <>
                  <TrendingUp className="h-6 w-6 text-orange-500" />
                  Keep Going!
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold text-center">
              {totalScore} / {maxScore}
            </div>
            <p className="text-center text-muted-foreground">
              Attempt #{attemptNumber}
              {maxAttempts && ` of ${maxAttempts}`}
            </p>
            {totalScore < maxScore && (!maxAttempts || attemptNumber < maxAttempts) && (
              <Button onClick={handleTryAgain} className="w-full">
                Try Again
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Questions (After Submission) */}
      {submitted ? (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.id} className={results[question.id] === true ? 'border-2 border-green-500' : results[question.id] === false ? 'border-2 border-red-500' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Question {index + 1}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {question.points} points
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <TextToSpeech text={question.question}>
                  <p className="text-lg"><MathText><BionicText>{question.question}</BionicText></MathText></p>
                </TextToSpeech>

                {/* Display Answer Based on Type */}
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Your answer:</p>
                  {question.type === 'multiple_choice' && (
                    <p className="text-base"><BionicText>{String(answers[question.id])}</BionicText></p>
                  )}
                  {question.type === 'numeric' && (
                    <p className="text-base"><BionicText>{String(answers[question.id])}</BionicText></p>
                  )}
                  {question.type === 'short_answer' && (
                    <p className="text-base whitespace-pre-wrap"><BionicText>{String(answers[question.id])}</BionicText></p>
                  )}
                </div>

                {/* Result & Explanation */}
                <div className={`p-4 rounded-lg ${results[question.id] ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {results[question.id] ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <span className="font-medium text-green-600 dark:text-green-400">Correct!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <span className="font-medium text-red-600 dark:text-red-400">Incorrect</span>
                      </>
                    )}
                    {questionTimes[question.id] && (
                      <span className="ml-auto text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {Math.floor(questionTimes[question.id] / 60)}:{(questionTimes[question.id] % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  
                  {/* Show AI feedback for open-ended questions */}
                  {detailedResults[question.id]?.feedback && (
                    <div className="mb-3 p-3 bg-background/50 rounded border">
                      <p className="text-sm font-medium mb-1">Feedback:</p>
                      <p className="text-sm"><BionicText>{detailedResults[question.id].feedback}</BionicText></p>
                      {detailedResults[question.id].score !== undefined && detailedResults[question.id].score < 1 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Score: {Math.round(detailedResults[question.id].score * 100)}%
                        </p>
                      )}
                    </div>
                  )}
                  
                  <p className="text-sm"><BionicText>{cleanMarkdown(question.explanation)}</BionicText></p>
                  {!results[question.id] && (
                    <p className="text-sm mt-2">
                      <strong>Correct answer:</strong> <BionicText>{String(question.correct_answer)}</BionicText>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Current Question (During Quiz) */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>Question {currentQuestionIndex + 1}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {currentQuestion.points} points
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TextToSpeech text={cleanMarkdown(currentQuestion.question)}>
              <p className="text-lg"><MathText><BionicText>{cleanMarkdown(currentQuestion.question)}</BionicText></MathText></p>
            </TextToSpeech>

            {/* Multiple Choice */}
            {currentQuestion.type === 'multiple_choice' && (
              <RadioGroup
                value={answers[currentQuestion.id] as string}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                {currentQuestion.options?.map((option, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`${currentQuestion.id}-${i}`} />
                    <Label htmlFor={`${currentQuestion.id}-${i}`}><MathText><BionicText>{cleanMarkdown(option)}</BionicText></MathText></Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {/* Numeric Answer */}
            {currentQuestion.type === 'numeric' && (
              <Input
                type="text"
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                placeholder="Enter your answer (e.g., 3/8 or 0.375)"
              />
            )}

            {/* Short Answer */}
            {currentQuestion.type === 'short_answer' && (
              <Textarea
                value={answers[currentQuestion.id] as string || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                placeholder="Type your answer here"
                rows={4}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Save Status Indicator */}
      {!submitted && isSaving && (
        <Card className="border-primary/50">
          <CardContent className="py-3 flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Saving your answer...</span>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {!submitted && saveError && (
        <Card className="border-destructive">
          <CardContent className="py-3 flex items-center justify-between">
            <span className="text-sm text-destructive">{saveError}</span>
            <Button variant="outline" size="sm" onClick={handleRefreshAnswers}>
              Refresh Answers
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      {!submitted && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0 || isSaving}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1 || isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
          
          {/* Skip Question Option */}
          {currentQuestionIndex < questions.length - 1 && !isCurrentQuestionAnswered && (
            <Button
              variant="ghost"
              onClick={handleSkipQuestion}
              className="w-full text-xs"
              size="sm"
            >
              Skip this question (you can return later)
            </Button>
          )}
        </div>
      )}

      {/* Submit Button */}
      {!submitted && (
        <Card>
          <CardContent className="pt-6">
            {onBack && (
              <Button
                onClick={onBack}
                variant="outline"
                className="w-full mb-3"
                size="lg"
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                Back to Practice
              </Button>
            )}
            <Button 
              onClick={handleSubmit} 
              disabled={submitting || questions.some(q => !isAnswerValid(answers[q.id]))}
              className="w-full"
              size="lg"
            >
              {submitting ? 'Submitting...' : 'Submit Assignment'}
            </Button>
            {maxAttempts && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                Attempt {attemptNumber} of {maxAttempts}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}