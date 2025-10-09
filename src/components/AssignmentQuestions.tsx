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
}

export function AssignmentQuestions({ assignment, studentId }: AssignmentQuestionsProps) {
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});
  const [currentQuestionStart, setCurrentQuestionStart] = useState<Record<string, number>>({});
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const { config: xpConfig } = useXPConfig();

  const questions: Question[] = assignment?.curriculum_items?.body?.questions || [];
  const maxAttempts = assignment?.max_attempts;

  useEffect(() => {
    // Calculate max score
    const max = questions.reduce((sum, q) => sum + q.points, 0);
    setMaxScore(max);

    // Load previous attempts
    loadAttempts();
  }, [questions]);

  // Track time when question changes
  useEffect(() => {
    if (questions.length > 0 && !submitted) {
      const currentQuestionId = questions[currentQuestionIndex]?.id;
      if (currentQuestionId) {
        // Start tracking time for the current question
        setCurrentQuestionStart(prev => ({
          ...prev,
          [currentQuestionId]: Date.now()
        }));
      }
    }
  }, [currentQuestionIndex, questions, submitted]);

  const loadAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('attempt_no')
        .eq('assignment_id', assignment.id)
        .eq('student_id', studentId)
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

  const gradeAnswer = (question: Question, answer: string | number): boolean => {
    if (question.type === 'numeric') {
      const numAnswer = typeof answer === 'number' ? answer : parseFloat(answer as string);
      const correctAnswer = typeof question.correct_answer === 'number' 
        ? question.correct_answer 
        : parseFloat(question.correct_answer as string);
      const tolerance = question.tolerance || 0.01;
      return Math.abs(numAnswer - correctAnswer) <= tolerance;
    } else if (question.type === 'multiple_choice') {
      return answer === question.correct_answer;
    } else {
      // For short answer, do case-insensitive comparison
      const answerStr = (answer as string).toLowerCase().trim();
      const correctStr = (question.correct_answer as string).toLowerCase().trim();
      return answerStr.includes(correctStr) || correctStr.includes(answerStr);
    }
  };

  const handleSubmit = async () => {
    // Check if all questions answered
    const unanswered = questions.filter(q => !answers[q.id]);
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
      let score = 0;
      let correctCount = 0;

      questions.forEach(question => {
        const isCorrect = gradeAnswer(question, answers[question.id]);
        gradedResults[question.id] = isCorrect;
        if (isCorrect) {
          score += question.points;
          correctCount++;
        }
      });

      setResults(gradedResults);
      setTotalScore(score);

      // Calculate total time spent
      const totalTime = Object.values(questionTimes).reduce((sum, time) => sum + time, 0);

      // Create submission
      const { data: submissionData, error: submissionError } = await supabase
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
    setQuestionTimes({});
    setCurrentQuestionStart({});
    setAttemptNumber(prev => prev + 1);
    setCurrentQuestionIndex(0);
    loadAttempts();
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      // Track time before moving to next question
      const currentQuestionId = questions[currentQuestionIndex].id;
      trackQuestionTime(currentQuestionId);
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      // Track time before moving to previous question
      const currentQuestionId = questions[currentQuestionIndex].id;
      trackQuestionTime(currentQuestionId);
      setCurrentQuestionIndex(prev => prev - 1);
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

  const progress = (Object.keys(answers).length / questions.length) * 100;
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {Object.keys(answers).length} / {questions.length} answered
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
                <div className="space-y-2">
                  <p className="text-lg"><BionicText>{question.question}</BionicText></p>
                  <TextToSpeech text={question.question} />
                </div>

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
            <div className="space-y-2">
              <p className="text-lg"><BionicText>{cleanMarkdown(currentQuestion.question)}</BionicText></p>
              <TextToSpeech text={cleanMarkdown(currentQuestion.question)} />
            </div>

            {/* Multiple Choice */}
            {currentQuestion.type === 'multiple_choice' && (
              <RadioGroup
                value={answers[currentQuestion.id] as string}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                {currentQuestion.options?.map((option, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`${currentQuestion.id}-${i}`} />
                    <Label htmlFor={`${currentQuestion.id}-${i}`}><BionicText>{cleanMarkdown(option)}</BionicText></Label>
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

      {/* Navigation Buttons */}
      {!submitted && (
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentQuestionIndex === questions.length - 1}
            className="flex-1"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Submit Button */}
      {!submitted && (
        <Card>
          <CardContent className="pt-6">
            <Button 
              onClick={handleSubmit} 
              disabled={submitting || Object.keys(answers).length !== questions.length}
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