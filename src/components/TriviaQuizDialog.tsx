import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, CheckCircle2, XCircle, Trophy, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ConfettiCelebration } from "./ConfettiCelebration";

interface TriviaQuestion {
  question: string;
  options: string[];
  correct: string;
  explanation: string;
}

interface TriviaQuizDialogProps {
  studentId: string;
  specialInterests: string[];
}

export const TriviaQuizDialog = ({ studentId, specialInterests }: TriviaQuizDialogProps) => {
  const [open, setOpen] = useState(false);
  const [numQuestions, setNumQuestions] = useState("5");
  const [difficulty, setDifficulty] = useState("medium");
  const [selectedInterest, setSelectedInterest] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [quiz, setQuiz] = useState<TriviaQuestion[] | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const { toast } = useToast();

  const handleGenerate = async () => {
    const topic = customTopic || selectedInterest;
    if (!topic) {
      toast({
        title: "Select a Topic",
        description: "Please choose an interest or enter a custom topic.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-trivia', {
        body: {
          topic,
          numQuestions: parseInt(numQuestions),
          difficulty,
          studentId
        }
      });

      if (error) throw error;

      setQuiz(data.questions);
      setCurrentQuestion(0);
      setAnswers({});
      setShowResults(false);
      setScore(0);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswer = (answer: string) => {
    setAnswers({ ...answers, [currentQuestion]: answer });
  };

  const handleNext = () => {
    if (currentQuestion < quiz!.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate score
      const finalScore = quiz!.reduce((score, q, idx) => {
        return score + (answers[idx] === q.correct ? 1 : 0);
      }, 0);
      setScore(finalScore);
      setShowResults(true);
    }
  };

  const handleRestart = () => {
    setQuiz(null);
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setScore(0);
  };

  const currentQ = quiz?.[currentQuestion];
  const hasAnswered = currentQuestion in answers;
  const isCorrect = answers[currentQuestion] === currentQ?.correct;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Brain className="h-4 w-4" />
          Create Trivia Quiz
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Trivia Quiz
          </DialogTitle>
          <DialogDescription>
            Test your knowledge on topics you love!
          </DialogDescription>
        </DialogHeader>

        {!quiz ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Number of Questions</Label>
              <Select value={numQuestions} onValueChange={setNumQuestions}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Questions</SelectItem>
                  <SelectItem value="10">10 Questions</SelectItem>
                  <SelectItem value="15">15 Questions</SelectItem>
                  <SelectItem value="20">20 Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">🟢 Easy</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="hard">🔴 Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {specialInterests.length > 0 && (
              <div className="space-y-2">
                <Label>Choose from Your Interests</Label>
                <Select value={selectedInterest} onValueChange={(val) => {
                  setSelectedInterest(val);
                  setCustomTopic("");
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an interest" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialInterests.map((interest, idx) => (
                      <SelectItem key={idx} value={interest}>
                        {interest}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Or Enter Custom Topic</Label>
              <Input
                value={customTopic}
                onChange={(e) => {
                  setCustomTopic(e.target.value);
                  setSelectedInterest("");
                }}
                placeholder="e.g., Ancient Egypt, Dinosaurs, Space..."
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || (!selectedInterest && !customTopic)}
              className="w-full"
            >
              {isGenerating ? "Generating Quiz..." : "Start Quiz"}
            </Button>
          </div>
        ) : showResults ? (
          <div className="space-y-6 text-center">
            {score === quiz.length && <ConfettiCelebration active={true} onComplete={() => {}} />}
            <Trophy className="h-16 w-16 mx-auto text-yellow-500" />
            <div>
              <h3 className="text-2xl font-bold mb-2">Quiz Complete!</h3>
              <p className="text-4xl font-bold text-primary">
                {score} / {quiz.length}
              </p>
              <p className="text-muted-foreground mt-2">
                {score === quiz.length
                  ? "Perfect score! 🎉"
                  : score >= quiz.length * 0.7
                  ? "Great job! 🌟"
                  : score >= quiz.length * 0.5
                  ? "Good effort! 👍"
                  : "Keep learning! 📚"}
              </p>
            </div>

            <div className="space-y-4">
              {quiz.map((q, idx) => (
                <Card key={idx} className={answers[idx] === q.correct ? "border-green-500" : "border-red-500"}>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      {answers[idx] === q.correct ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      Question {idx + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p className="font-medium">{q.question}</p>
                    <p>
                      <span className="text-muted-foreground">Your answer: </span>
                      <Badge variant={answers[idx] === q.correct ? "default" : "destructive"}>
                        {answers[idx]}
                      </Badge>
                    </p>
                    {answers[idx] !== q.correct && (
                      <p>
                        <span className="text-muted-foreground">Correct answer: </span>
                        <Badge variant="default">{q.correct}</Badge>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground italic">{q.explanation}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button onClick={handleRestart} className="w-full">
              Create Another Quiz
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Question {currentQuestion + 1} of {quiz.length}
              </span>
              <Badge variant="outline">
                {difficulty === "easy" ? "🟢" : difficulty === "medium" ? "🟡" : "🔴"} {difficulty}
              </Badge>
            </div>

            <Progress value={((currentQuestion + 1) / quiz.length) * 100} />

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{currentQ?.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={answers[currentQuestion]}
                  onValueChange={handleAnswer}
                  className="space-y-3"
                >
                  {currentQ?.options.map((option, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-colors ${
                        hasAnswered
                          ? option === currentQ.correct
                            ? "bg-green-50 dark:bg-green-950 border-green-500"
                            : option === answers[currentQuestion]
                            ? "bg-red-50 dark:bg-red-950 border-red-500"
                            : "border-muted"
                          : "border-muted hover:border-primary"
                      }`}
                    >
                      <RadioGroupItem value={option} id={`option-${idx}`} disabled={hasAnswered} />
                      <Label
                        htmlFor={`option-${idx}`}
                        className="flex-1 cursor-pointer"
                      >
                        {option}
                      </Label>
                      {hasAnswered && option === currentQ.correct && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                      {hasAnswered && option === answers[currentQuestion] && option !== currentQ.correct && (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  ))}
                </RadioGroup>

                {hasAnswered && (
                  <div className={`mt-4 p-4 rounded-lg ${isCorrect ? "bg-green-50 dark:bg-green-950" : "bg-red-50 dark:bg-red-950"}`}>
                    <p className="text-sm font-medium mb-2">
                      {isCorrect ? "✓ Correct!" : "✗ Not quite right"}
                    </p>
                    <p className="text-sm text-muted-foreground">{currentQ?.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button
              onClick={handleNext}
              disabled={!hasAnswered}
              className="w-full"
            >
              {currentQuestion < quiz.length - 1 ? "Next Question" : "See Results"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};