import { useState, useEffect } from 'react';
import { Calendar, Bot, Clock, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';
import { OnboardingWizard, WizardStep } from './onboarding/OnboardingWizard';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useTutorial } from '@/contexts/TutorialContext';

export function SmartCalendarWizard() {
  const [open, setOpen] = useState(false);
  const { markWizardComplete } = useOnboarding();
  const { activeTutorial, closeTutorial } = useTutorial();

  useEffect(() => {
    if (activeTutorial === 'smart_calendar') {
      setOpen(true);
    }
  }, [activeTutorial]);

  const handleClose = (completed: boolean) => {
    setOpen(false);
    closeTutorial();
    if (completed) {
      markWizardComplete('smart_calendar');
    }
  };

  const steps: WizardStep[] = [
    {
      icon: Calendar,
      title: "Meet Your Smart Calendar! 📅",
      description: "AI-powered scheduling that adapts to you",
      duckPose: 'waving',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Your calendar isn't just a schedule - it's your intelligent planning assistant!
          </p>
          <div className="bg-accent/50 p-4 rounded-lg">
            <p className="font-medium">What makes it smart:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>• AI schedules assignments based on workload</li>
              <li>• Learns your focus patterns over time</li>
              <li>• Adapts to changes automatically</li>
              <li>• Chat assistant helps you plan</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: Bot,
      title: "AI Scheduling Magic ✨",
      description: "Let AI handle the planning",
      duckPose: 'wizard',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            The AI considers multiple factors to create your optimal schedule.
          </p>
          <div className="bg-blue-500/10 p-4 rounded-lg border-2 border-blue-500/30">
            <p className="font-medium text-blue-600 dark:text-blue-400">AI considers:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>• Assignment due dates and priorities</li>
              <li>• Estimated time for each task</li>
              <li>• Your blocked time and availability</li>
              <li>• When you focus best (from session data)</li>
              <li>• Subject difficulty and prerequisites</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: Clock,
      title: "Flexible Scheduling 🔄",
      description: "Easy to adjust and personalize",
      duckPose: 'pointing',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            AI gives you a starting point, but you're in control!
          </p>
          <div className="bg-green-500/10 p-4 rounded-lg border-2 border-green-500/30">
            <p className="font-medium text-green-600 dark:text-green-400">You can:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>• Drag assignments to different times</li>
              <li>• Lock important time blocks</li>
              <li>• Set recurring blocked times</li>
              <li>• Request AI to reschedule around changes</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: Bot,
      title: "Calendar Chat Assistant 💬",
      description: "Ask questions in plain English",
      duckPose: 'celebrating',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Chat with your calendar like it's a personal assistant!
          </p>
          <div className="bg-purple-500/10 p-4 rounded-lg border-2 border-purple-500/30">
            <p className="font-medium text-purple-600 dark:text-purple-400">Example requests:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>• "Move math to Wednesday morning"</li>
              <li>• "I have soccer practice on Tuesdays at 4pm"</li>
              <li>• "What's the best time to study science?"</li>
              <li>• "I need more time for this essay"</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: TrendingUp,
      title: "Learning Your Patterns 📊",
      description: "Gets smarter as you work",
      duckPose: 'superhero',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Every focus session teaches the AI more about your optimal schedule.
          </p>
          <div className="bg-orange-500/10 p-4 rounded-lg border-2 border-orange-500/30">
            <p className="font-medium text-orange-600 dark:text-orange-400">AI learns:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>• What time of day you focus best</li>
              <li>• How long you can sustain attention</li>
              <li>• Which subjects need more time buffers</li>
              <li>• Your natural work rhythm</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: CheckCircle2,
      title: "Your Schedule, Optimized! 🚀",
      description: "Ready to let AI handle the planning",
      duckPose: 'celebrating',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            You now know how to use your Smart Calendar effectively!
          </p>
          <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 p-4 rounded-lg border-2 border-primary/30">
            <p className="font-medium mb-2">Pro tips:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Let AI do the initial scheduling</li>
              <li>• Add blocked times for activities/appointments</li>
              <li>• Use chat assistant for quick changes</li>
              <li>• Review weekly to adjust as needed</li>
              <li>• Trust the AI - it gets better with time!</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  return (
    <OnboardingWizard
      open={open}
      onOpenChange={(isOpen) => !isOpen && handleClose(false)}
      steps={steps}
      onComplete={() => handleClose(true)}
      onSkip={() => {
        markWizardComplete('smart_calendar', true);
        handleClose(false);
      }}
      title="Smart Calendar Tutorial"
    />
  );
}
