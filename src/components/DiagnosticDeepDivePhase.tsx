import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiagnosticDeepDivePhaseProps {
  assessmentId: string;
  studentId: string;
  onComplete: () => void;
}

interface Question {
  questionNumber: number;
  topic: string;
  difficulty: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: string;
  explanation: string;
}

export function DiagnosticDeepDivePhase({ assessmentId, studentId, onComplete }: DiagnosticDeepDivePhaseProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [questionsAnswered, setQuestionsAnswered] = useState(0);

  const fetchNextQuestion = async () => {
    setIsLoading(true);
    setShowFeedback(false);
    setSelectedAnswer(null);
    setQuestionStartTime(Date.now());

    try {
      const { data, error } = await supabase.functions.invoke('get-next-diagnostic-question', {
        body: { assessmentId }
      });

      if (error) throw error;

      if (data.complete) {
        onComplete();
      } else {
        setCurrentQuestion(data);
      }
    } catch (error) {
      console.error('Error fetching question:', error);
      toast({
        title: "Error",
        description: "Could not load question. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNextQuestion();
  }, []);

  const handleAnswerSubmit = async () => {
    if (!selectedAnswer || !currentQuestion) return;

    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);

    try {
      const { data, error } = await supabase.functions.invoke('submit-diagnostic-response', {
        body: {
          assessmentId,
          studentId,
          questionNumber: currentQuestion.questionNumber,
          topic: currentQuestion.topic,
          difficulty: currentQuestion.difficulty,
          questionData: {
            question: currentQuestion.question,
            options: currentQuestion.options,
            correctAnswer: currentQuestion.correctAnswer
          },
          studentAnswer: selectedAnswer,
          correctAnswer: currentQuestion.correctAnswer,
          timeSpent,
          explanation: currentQuestion.explanation
        }
      });

      if (error) throw error;

      setFeedback({
        isCorrect: data.isCorrect,
        message: data.feedback || (data.isCorrect 
          ? "Great job! That's correct!" 
          : `Not quite. ${currentQuestion.explanation}`)
      });
      setShowFeedback(true);
      setQuestionsAnswered(prev => prev + 1);
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: "Error",
        description: "Could not submit answer. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleNext = () => {
    fetchNextQuestion();
  };

  if (isLoading && !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading next question...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Question {currentQuestion.questionNumber}</h2>
        <p className="text-sm text-muted-foreground">Topic: {currentQuestion.topic}</p>
        <Progress value={(questionsAnswered / 15) * 100} className="h-2" />
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg leading-relaxed">{currentQuestion.question}</CardTitle>
          <CardDescription>Choose the best answer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {Object.entries(currentQuestion.options).map(([letter, text]) => (
              <Button
                key={letter}
                onClick={() => !showFeedback && setSelectedAnswer(letter)}
                disabled={showFeedback}
                variant="outline"
                size="lg"
                className={cn(
                  "w-full justify-start text-left h-auto py-4 px-4 border-2 transition-all",
                  selectedAnswer === letter && !showFeedback && "border-primary bg-primary/5",
                  showFeedback && letter === currentQuestion.correctAnswer && "border-green-500 bg-green-50 dark:bg-green-950",
                  showFeedback && selectedAnswer === letter && letter !== currentQuestion.correctAnswer && "border-red-500 bg-red-50 dark:bg-red-950"
                )}
              >
                <span className="font-medium mr-3">{letter}.</span>
                <span className="flex-1">{text}</span>
                {showFeedback && letter === currentQuestion.correctAnswer && (
                  <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
                )}
                {showFeedback && selectedAnswer === letter && letter !== currentQuestion.correctAnswer && (
                  <XCircle className="h-5 w-5 text-red-600 ml-2" />
                )}
              </Button>
            ))}
          </div>

          {showFeedback && feedback && (
            <Card className={cn(
              "border-2",
              feedback.isCorrect ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-blue-500 bg-blue-50 dark:bg-blue-950"
            )}>
              <CardContent className="pt-6">
                <p className={cn(
                  "font-medium mb-2",
                  feedback.isCorrect ? "text-green-900 dark:text-green-100" : "text-blue-900 dark:text-blue-100"
                )}>
                  {feedback.isCorrect ? "✨ Correct!" : "💡 Learning Moment"}
                </p>
                <p className={cn(
                  "text-sm",
                  feedback.isCorrect ? "text-green-800 dark:text-green-200" : "text-blue-800 dark:text-blue-200"
                )}>
                  {feedback.message}
                </p>
              </CardContent>
            </Card>
          )}

          {!showFeedback ? (
            <Button
              onClick={handleAnswerSubmit}
              disabled={!selectedAnswer}
              className="w-full"
              size="lg"
            >
              Submit Answer
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="w-full"
              size="lg"
            >
              Next Question
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}