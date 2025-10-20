import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, TrendingUp, AlertCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DiagnosticResults {
  totalQuestions: number;
  correctAnswers: number;
  accuracyRate: number;
  averageMastery: number;
  mastered: Array<{ topic: string; mastery: number }>;
  inProgress: Array<{ topic: string; mastery: number }>;
  needsWork: Array<{ topic: string; mastery: number }>;
}

interface DiagnosticResultsDashboardProps {
  assessmentId: string;
  results: DiagnosticResults;
  subject: string;
  studentId: string;
}

export function DiagnosticResultsDashboard({ 
  assessmentId, 
  results, 
  subject,
  studentId 
}: DiagnosticResultsDashboardProps) {
  const navigate = useNavigate();

  const handleGenerateCourse = () => {
    navigate(`/student/dashboard`, { 
      state: { 
        diagnosticComplete: true,
        assessmentId,
        subject 
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Section */}
      <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader className="text-center pb-3">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl">Assessment Complete!</CardTitle>
          <CardDescription className="text-base">
            You've done an amazing job! Here's what we discovered about your knowledge.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-3xl font-bold text-primary">{results.totalQuestions}</div>
              <div className="text-sm text-muted-foreground">Questions</div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-3xl font-bold text-green-600">{results.correctAnswers}</div>
              <div className="text-sm text-muted-foreground">Correct</div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{Math.round(results.accuracyRate * 100)}%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{Math.round(results.averageMastery * 100)}%</div>
              <div className="text-sm text-muted-foreground">Mastery</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Map */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Mastered */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Strengths
            </CardTitle>
            <CardDescription>
              You've got these down!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.mastered.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No topics fully mastered yet - but that's okay! We'll work on building these skills.
              </p>
            ) : (
              results.mastered.map(({ topic, mastery }) => (
                <div key={topic} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{topic}</span>
                    <span className="text-muted-foreground">{Math.round(mastery * 100)}%</span>
                  </div>
                  <Progress value={mastery * 100} variant="success" className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <TrendingUp className="h-5 w-5" />
              Growing
            </CardTitle>
            <CardDescription>
              You're on your way!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.inProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No topics in progress
              </p>
            ) : (
              results.inProgress.map(({ topic, mastery }) => (
                <div key={topic} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{topic}</span>
                    <span className="text-muted-foreground">{Math.round(mastery * 100)}%</span>
                  </div>
                  <Progress value={mastery * 100} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Needs Work */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <AlertCircle className="h-5 w-5" />
              Focus Areas
            </CardTitle>
            <CardDescription>
              Let's learn these together!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.needsWork.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Great job! No major gaps identified.
              </p>
            ) : (
              results.needsWork.map(({ topic, mastery }) => (
                <div key={topic} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{topic}</span>
                    <span className="text-muted-foreground">{Math.round(mastery * 100)}%</span>
                  </div>
                  <Progress value={mastery * 100} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Next Steps */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
          <CardDescription>
            Based on your results, we can now create a personalized learning plan that's just right for you!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>We'll start with your strongest topics to build confidence</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Gradually introduce new concepts at just the right pace</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Fill in any gaps with targeted practice</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Keep challenging you as you grow!</span>
            </li>
          </ul>

          <Button onClick={handleGenerateCourse} className="w-full" size="lg">
            Create My Personalized Course
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}