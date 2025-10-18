import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { DuckCharacter } from './DuckCharacter';
import { ConfettiCelebration } from '@/components/ConfettiCelebration';
import { cn } from '@/lib/utils';

export interface WizardStep {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  content: React.ReactNode;
  duckPose?: 'waving' | 'pointing' | 'celebrating' | 'confused' | 'wizard' | 'superhero';
}

interface OnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  steps: WizardStep[];
  onComplete: () => void;
  onSkip: () => void;
  title?: string;
}

export function OnboardingWizard({ 
  open, 
  onOpenChange, 
  steps, 
  onComplete, 
  onSkip,
  title = "Quick Tour"
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open) {
      setCurrentStep(0);
    }
  }, [open]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowConfetti(true);
      setTimeout(() => {
        onComplete();
        onOpenChange(false);
      }, 2000);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
    onOpenChange(false);
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="flex items-center gap-2">
                    {currentStepData.title}
                    {currentStep === 0 && (
                      <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
                    )}
                  </DialogTitle>
                  <DialogDescription>{currentStepData.description}</DialogDescription>
                </div>
              </div>
              <DuckCharacter 
                pose={currentStepData.duckPose || 'waving'} 
                size="md" 
              />
            </div>
          </DialogHeader>

          <div className="py-6 animate-in slide-in-from-right-5 fade-in-0 duration-300">
            {currentStepData.content}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300 ease-out",
                    index === currentStep 
                      ? "w-8 bg-primary scale-110" 
                      : index < currentStep
                      ? "w-2 bg-primary/60 scale-100"
                      : "w-2 bg-muted scale-90"
                  )}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentStep === 0 && (
                <Button 
                  variant="ghost" 
                  onClick={handleSkip}
                  className="text-muted-foreground"
                >
                  I got this →
                </Button>
              )}
              {currentStep > 0 && (
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button onClick={handleNext}>
                {currentStep === steps.length - 1 ? (
                  <>Let's Go! 🚀</>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showConfetti && (
        <ConfettiCelebration 
          active={showConfetti} 
          onComplete={() => setShowConfetti(false)} 
        />
      )}
    </>
  );
}
