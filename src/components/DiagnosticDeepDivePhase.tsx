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

// Topic examples to help students understand concepts
const TOPIC_EXAMPLES: Record<string, string> = {
  "Number Operations": "Adding, subtracting, multiplying, dividing",
  "Fractions & Decimals": "Working with parts of numbers",
  "Ratios & Proportions": "Comparing quantities",
  "Algebraic Expressions": "Using variables in math",
  "Equations & Inequalities": "Finding unknown values",
  "Geometry Basics": "Shapes, angles, and measurements",
  "Measurement & Data": "Units and interpreting data",
  "Statistics & Probability": "Averages and likelihood",
  "Reading Comprehension": "Understanding text",
  "Vocabulary": "Word meanings and usage",
  "Grammar & Mechanics": "Sentence structure and punctuation",
  "Writing Structure": "Organizing your writing",
  "Literary Analysis": "Understanding stories",
  "Research Skills": "Finding and using information",
  "Speaking & Listening": "Communication skills",
  "Scientific Method": "How scientists investigate",
  "Matter & Energy": "States of matter and energy forms",
  "Forces & Motion": "How things move",
  "Life Cycles": "How living things grow",
  "Ecosystems": "How organisms interact",
  "Earth Systems": "Earth's processes",
  "Chemical Reactions": "How substances change",
  "Geography": "Places and maps",
  "Historical Events": "Important past events",
  "Government": "How societies are governed",
  "Economics": "Money and resources",
  "Civic Responsibility": "Citizen duties",
  "Cultural Studies": "Different cultures"
};

const LOADING_MESSAGES = [
  "Preparing your next questions",
  "Analyzing your learning progress",
  "Creating personalized questions",
  "Getting everything ready for you"
];

export function DiagnosticDeepDivePhase({ assessmentId, studentId, onComplete }: DiagnosticDeepDivePhaseProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Cycle through loading messages
  useEffect(() => {
    if (!isLoading) return;
    
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleAnswerSubmit = async () => {
    if (!selectedAnswer || !currentQuestion) return;

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    setCurrentQuestion(null); // Clear current question to show loading state
    fetchNextQuestion();
  };

  if (isLoading && !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-lg font-medium">{LOADING_MESSAGES[loadingMessageIndex]}...</p>
          <p className="text-sm text-muted-foreground">This won't take long!</p>
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
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Topic: {currentQuestion.topic}</p>
          {TOPIC_EXAMPLES[currentQuestion.topic] && (
            <p className="text-xs text-muted-foreground italic">
              ({TOPIC_EXAMPLES[currentQuestion.topic]})
            </p>
          )}
        </div>
        <Progress value={(questionsAnswered / 15) * 100} className="h-2" />
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg leading-relaxed">{currentQuestion.question}</CardTitle>
          <CardDescription>Choose the best answer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showFeedback && (
            <div className="space-y-2">
              {Object.entries(currentQuestion.options).map(([letter, text]) => (
                <Button
                  key={letter}
                  onClick={() => setSelectedAnswer(letter)}
                  variant="outline"
                  size="lg"
                  className={cn(
                    "w-full justify-start text-left h-auto py-4 px-4 border-2 transition-all",
                    selectedAnswer === letter && "border-primary bg-primary/5"
                  )}
                >
                  <span className="font-medium mr-3 flex-shrink-0">{letter}.</span>
                  <span className="flex-1 whitespace-normal break-words">{text}</span>
                </Button>
              ))}
              
              <Button
                onClick={() => setSelectedAnswer("IDK")}
                variant="outline"
                size="lg"
                className={cn(
                  "w-full justify-start text-left h-auto py-4 px-4 border-2 transition-all border-dashed",
                  selectedAnswer === "IDK" && "border-primary bg-primary/5"
                )}
              >
                <span className="font-medium mr-3 flex-shrink-0">?</span>
                <span className="flex-1 italic whitespace-normal break-words">I don't know</span>
              </Button>
            </div>
          )}

          {!showFeedback ? (
            <Button
              onClick={handleAnswerSubmit}
              disabled={!selectedAnswer || isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking your answer...
                </>
              ) : (
                "Submit Answer"
              )}
            </Button>
          ) : (
            <>
              <Card className={cn(
                "border-2",
                feedback?.isCorrect ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-blue-500 bg-blue-50 dark:bg-blue-950"
              )}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start gap-3">
                    {feedback?.isCorrect ? (
                      <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <div className="text-2xl flex-shrink-0">💡</div>
                    )}
                    <div className="flex-1">
                      <p className={cn(
                        "font-semibold text-base mb-2",
                        feedback?.isCorrect ? "text-green-900 dark:text-green-100" : "text-blue-900 dark:text-blue-100"
                      )}>
                        {feedback?.isCorrect ? "Great job!" : "Learning Moment"}
                      </p>
                      <p className={cn(
                        "text-sm leading-relaxed",
                        feedback?.isCorrect ? "text-green-800 dark:text-green-200" : "text-blue-800 dark:text-blue-200"
                      )}>
                        {feedback?.message}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Button
                onClick={handleNext}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading next question...
                  </>
                ) : (
                  "Continue →"
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}