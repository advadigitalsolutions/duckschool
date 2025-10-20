import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ThumbsUp, Meh, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiagnosticWarmupPhaseProps {
  assessmentId: string;
  subject: string;
  onComplete: (responses: Record<string, string>) => void;
}

// Common topics by subject
const SUBJECT_TOPICS: Record<string, string[]> = {
  "Mathematics": [
    "Number Operations",
    "Fractions & Decimals",
    "Ratios & Proportions",
    "Algebraic Expressions",
    "Equations & Inequalities",
    "Geometry Basics",
    "Measurement & Data",
    "Statistics & Probability"
  ],
  "English Language Arts": [
    "Reading Comprehension",
    "Vocabulary",
    "Grammar & Mechanics",
    "Writing Structure",
    "Literary Analysis",
    "Research Skills",
    "Speaking & Listening"
  ],
  "Science": [
    "Scientific Method",
    "Matter & Energy",
    "Forces & Motion",
    "Life Cycles",
    "Ecosystems",
    "Earth Systems",
    "Chemical Reactions"
  ],
  "Social Studies": [
    "Geography",
    "Historical Events",
    "Government",
    "Economics",
    "Civic Responsibility",
    "Cultural Studies"
  ]
};

export function DiagnosticWarmupPhase({ assessmentId, subject, onComplete }: DiagnosticWarmupPhaseProps) {
  const topics = SUBJECT_TOPICS[subject] || SUBJECT_TOPICS["Mathematics"];
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentTopic = topics[currentIndex];
  const progress = (Object.keys(responses).length / topics.length) * 100;

  const handleResponse = (level: 'confident' | 'unsure' | 'not_confident') => {
    const newResponses = { ...responses, [currentTopic]: level };
    setResponses(newResponses);

    if (currentIndex < topics.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // All topics covered
      onComplete(newResponses);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Let's Start Easy</h2>
        <p className="text-muted-foreground">
          How comfortable do you feel with these topics? Be honest - there's no wrong answer!
        </p>
      </div>

      <Progress value={progress} className="h-2" />

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl">{currentTopic}</CardTitle>
          <CardDescription>
            How confident are you with this topic?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={() => handleResponse('confident')}
              variant="outline"
              size="lg"
              className={cn(
                "h-auto py-6 flex-col gap-2 border-2 transition-all",
                "hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950"
              )}
            >
              <ThumbsUp className="h-8 w-8 text-green-600" />
              <span className="font-medium">Confident</span>
              <span className="text-xs text-muted-foreground">I know this well</span>
            </Button>

            <Button
              onClick={() => handleResponse('unsure')}
              variant="outline"
              size="lg"
              className={cn(
                "h-auto py-6 flex-col gap-2 border-2 transition-all",
                "hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950"
              )}
            >
              <Meh className="h-8 w-8 text-yellow-600" />
              <span className="font-medium">Unsure</span>
              <span className="text-xs text-muted-foreground">I know some of it</span>
            </Button>

            <Button
              onClick={() => handleResponse('not_confident')}
              variant="outline"
              size="lg"
              className={cn(
                "h-auto py-6 flex-col gap-2 border-2 transition-all",
                "hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950"
              )}
            >
              <ThumbsDown className="h-8 w-8 text-blue-600" />
              <span className="font-medium">New to Me</span>
              <span className="text-xs text-muted-foreground">I haven't learned this yet</span>
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            {currentIndex + 1} of {topics.length}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}