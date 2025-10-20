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

// Topic examples to help students understand concepts
const TOPIC_EXAMPLES: Record<string, string> = {
  // Mathematics
  "Number Operations": "Adding, subtracting, multiplying, and dividing (e.g., 24 × 3 = 72)",
  "Fractions & Decimals": "Working with parts of numbers (e.g., 1/2 = 0.5, or 3/4 + 1/4)",
  "Ratios & Proportions": "Comparing quantities (e.g., 2:3 ratio, or if 2 apples cost $1, how much for 6?)",
  "Algebraic Expressions": "Using variables in math (e.g., 3x + 5, or solving 2y - 4 = 10)",
  "Equations & Inequalities": "Finding unknown values (e.g., x + 7 = 15, or 2x < 10)",
  "Geometry Basics": "Shapes, angles, and measurements (e.g., area of a rectangle, or angles in a triangle)",
  "Measurement & Data": "Units, converting, and interpreting data (e.g., inches to feet, or reading charts)",
  "Statistics & Probability": "Averages and likelihood (e.g., mean of 5, 7, 9 or chance of rolling a 6)",
  
  // English Language Arts
  "Reading Comprehension": "Understanding what you read (e.g., identifying main ideas, making inferences)",
  "Vocabulary": "Word meanings and usage (e.g., synonyms, context clues, word roots)",
  "Grammar & Mechanics": "Proper sentence structure (e.g., subject-verb agreement, punctuation)",
  "Writing Structure": "Organizing your writing (e.g., paragraphs, introductions, conclusions)",
  "Literary Analysis": "Understanding stories (e.g., theme, character development, symbolism)",
  "Research Skills": "Finding and using information (e.g., citing sources, evaluating credibility)",
  "Speaking & Listening": "Communication skills (e.g., presentations, active listening)",
  
  // Science
  "Scientific Method": "How scientists investigate (e.g., hypothesis, experiment, conclusion)",
  "Matter & Energy": "States of matter and energy forms (e.g., solid/liquid/gas, heat transfer)",
  "Forces & Motion": "How things move (e.g., gravity, friction, speed and acceleration)",
  "Life Cycles": "How living things grow (e.g., butterfly metamorphosis, plant growth)",
  "Ecosystems": "How organisms interact (e.g., food chains, habitats, adaptations)",
  "Earth Systems": "Earth's processes (e.g., weather, rock cycle, water cycle)",
  "Chemical Reactions": "How substances change (e.g., mixing baking soda and vinegar)",
  
  // Social Studies
  "Geography": "Places and maps (e.g., continents, coordinates, physical features)",
  "Historical Events": "Important past events (e.g., wars, discoveries, social movements)",
  "Government": "How societies are governed (e.g., democracy, laws, branches of government)",
  "Economics": "Money and resources (e.g., supply and demand, trade, budgeting)",
  "Civic Responsibility": "Citizen duties (e.g., voting, community service, rights)",
  "Cultural Studies": "Different cultures (e.g., traditions, beliefs, customs)"
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
          <CardDescription className="mt-2 space-y-1">
            <div className="text-sm text-muted-foreground italic">
              {TOPIC_EXAMPLES[currentTopic] || ""}
            </div>
            <div className="text-sm font-medium mt-2">
              How confident are you with this topic?
            </div>
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