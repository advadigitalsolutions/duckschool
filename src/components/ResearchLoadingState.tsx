import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { FileSearch, FileText, Scale, Sparkles } from "lucide-react";

interface LoadingStep {
  message: string;
  icon: React.ReactNode;
  duration: number;
}

const loadingSteps: LoadingStep[] = [
  {
    message: "Reviewing government websites...",
    icon: <FileSearch className="h-5 w-5" />,
    duration: 2000
  },
  {
    message: "Scraping PDFs and official documents...",
    icon: <FileText className="h-5 w-5" />,
    duration: 3000
  },
  {
    message: "Compiling legal guidelines...",
    icon: <Scale className="h-5 w-5" />,
    duration: 2500
  },
  {
    message: "Formatting documentation nicely...",
    icon: <Sparkles className="h-5 w-5" />,
    duration: 2000
  }
];

interface ResearchLoadingStateProps {
  state?: string;
  grade?: string;
}

export const ResearchLoadingState = ({ state, grade }: ResearchLoadingStateProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let stepTimer: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;
    
    const totalDuration = loadingSteps.reduce((sum, step) => sum + step.duration, 0);
    const progressPerMs = 100 / totalDuration;
    let elapsedTime = 0;

    // Progress bar animation
    progressInterval = setInterval(() => {
      elapsedTime += 50;
      const newProgress = Math.min(elapsedTime * progressPerMs, 95); // Cap at 95% until complete
      setProgress(newProgress);
    }, 50);

    // Step progression
    const advanceStep = (stepIndex: number) => {
      if (stepIndex < loadingSteps.length) {
        setCurrentStep(stepIndex);
        stepTimer = setTimeout(() => {
          advanceStep(stepIndex + 1);
        }, loadingSteps[stepIndex].duration);
      }
    };

    advanceStep(0);

    return () => {
      clearTimeout(stepTimer);
      clearInterval(progressInterval);
    };
  }, []);

  const currentStepData = loadingSteps[currentStep] || loadingSteps[0];

  return (
    <div className="flex items-center justify-center p-8">
      <Card className="w-full max-w-lg p-8 space-y-6 border-muted">
        <div className="text-center space-y-3">
          <div className="flex justify-center items-center gap-3 text-primary animate-pulse">
            {currentStepData.icon}
            <h3 className="text-lg font-semibold">
              Researching Standards & Legal Requirements
            </h3>
          </div>
          
          {state && grade && (
            <p className="text-sm text-muted-foreground">
              Analyzing official sources for {state} grade {grade}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Progress value={progress} className="h-2" />
          
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-fade-in">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
            {currentStepData.message}
          </div>
        </div>

        <div className="space-y-2 pt-2">
          {loadingSteps.map((step, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                idx < currentStep
                  ? 'text-muted-foreground/60 line-through'
                  : idx === currentStep
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground/40'
              }`}
            >
              {idx < currentStep ? (
                <span className="text-green-600">✓</span>
              ) : idx === currentStep ? (
                <span className="animate-spin">⟳</span>
              ) : (
                <span className="opacity-40">○</span>
              )}
              {step.message}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
