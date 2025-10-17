import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Target, Clock, Eye, Zap, CheckCircle2 } from 'lucide-react';

export function FocusDuckWizard() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenWizard = localStorage.getItem('focus_duck_wizard_completed');
    if (!hasSeenWizard) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('focus_duck_wizard_completed', 'true');
    setOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const steps = [
    {
      icon: Target,
      title: "Meet Your Focus Duck! 🦆",
      description: "Your friendly companion for staying focused",
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            The Focus Duck helps you stay on task by tracking your work sessions and celebrating your progress!
          </p>
          <div className="bg-accent/50 p-4 rounded-lg">
            <p className="font-medium">How it works:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>• Set a goal for what you want to accomplish</li>
              <li>• Choose how long you want to focus</li>
              <li>• The duck tracks your progress and cheers you on</li>
              <li>• Earn XP when you complete your session!</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: Clock,
      title: "Set Your Focus Time",
      description: "Choose how long you want to work",
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Pick a duration that feels manageable - it's better to do shorter, focused sessions than to burn out!
          </p>
          <div className="bg-accent/50 p-4 rounded-lg space-y-2">
            <p className="font-medium">Pro tips:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>• Start with 15-25 minutes if you're new to focused work</li>
              <li>• You can always start another session when you finish</li>
              <li>• The duck will show your progress with a climbing animation</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: Eye,
      title: "Accountability Mode (Optional)",
      description: "Get gentle check-ins to stay on track",
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Turn on accountability mode for random check-ins during your session.
          </p>
          <div className="bg-accent/50 p-4 rounded-lg space-y-2">
            <p className="font-medium">How it works:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>• You'll be asked if you're still focused at random times</li>
              <li>• If enabled, it can check your screen to see if you're on task</li>
              <li>• This is completely optional - use it only if it helps you!</li>
              <li>• No one else sees these check-ins, they're just for you</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: Zap,
      title: "Watch the Duck Climb!",
      description: "See your progress in real-time",
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            As you work, the duck climbs higher! The higher it gets, the closer you are to finishing.
          </p>
          <div className="bg-accent/50 p-4 rounded-lg space-y-2">
            <p className="font-medium">What you'll see:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>• The duck starts at the bottom and climbs as time passes</li>
              <li>• A progress bar shows how much time is left</li>
              <li>• You can pause anytime if you need a break</li>
              <li>• When you finish, you'll get a celebration! 🎉</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: CheckCircle2,
      title: "Ready to Focus!",
      description: "You're all set to start your first session",
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            You now know everything you need to use the Focus Duck effectively!
          </p>
          <div className="bg-primary/10 p-4 rounded-lg space-y-2">
            <p className="font-medium text-primary">Remember:</p>
            <ul className="mt-2 space-y-2 text-sm">
              <li>• The duck is here to help, not stress you out</li>
              <li>• It's okay to take breaks when you need them</li>
              <li>• Every focus session earns you XP and builds good habits</li>
              <li>• You've got this! 🦆✨</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle>{currentStepData.title}</DialogTitle>
          </div>
          <DialogDescription>{currentStepData.description}</DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {currentStepData.content}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
            <Button onClick={handleNext}>
              {currentStep === steps.length - 1 ? "Let's Go!" : 'Next'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
