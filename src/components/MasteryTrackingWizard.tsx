import { useState, useEffect } from 'react';
import { TrendingUp, Target, BarChart3, Lightbulb, Award, CheckCircle2 } from 'lucide-react';
import { OnboardingWizard, WizardStep } from './onboarding/OnboardingWizard';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useTutorial } from '@/contexts/TutorialContext';

export function MasteryTrackingWizard() {
  const [open, setOpen] = useState(false);
  const { markWizardComplete } = useOnboarding();
  const { activeTutorial, closeTutorial } = useTutorial();

  useEffect(() => {
    if (activeTutorial === 'mastery_tracking') {
      setOpen(true);
    }
  }, [activeTutorial]);

  const handleClose = (completed: boolean) => {
    setOpen(false);
    closeTutorial();
    if (completed) {
      markWizardComplete('mastery_tracking');
    }
  };

  const steps: WizardStep[] = [
    {
      icon: TrendingUp,
      title: "Welcome to Mastery Analytics! 📊",
      description: "Understand your learning progress",
      duckPose: 'waving',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Mastery tracking shows exactly what you know and where to focus next!
          </p>
          <div className="bg-accent/50 p-4 rounded-lg">
            <p className="font-medium">What you'll learn:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>• How mastery is measured</li>
              <li>• Reading your progress charts</li>
              <li>• Understanding learning standards</li>
              <li>• Using AI insights to improve</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: Target,
      title: "What is Mastery? 🎯",
      description: "Beyond grades and percentages",
      duckPose: 'pointing',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Mastery means truly understanding a concept, not just memorizing facts.
          </p>
          <div className="bg-blue-500/10 p-4 rounded-lg border-2 border-blue-500/30">
            <p className="font-medium text-blue-600 dark:text-blue-400">Three levels:</p>
            <div className="mt-3 space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-2xl">🔴</span>
                <div>
                  <p className="font-medium text-sm">Not Started / Struggling</p>
                  <p className="text-xs text-muted-foreground">Need to learn or review this</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-2xl">🟡</span>
                <div>
                  <p className="font-medium text-sm">In Progress</p>
                  <p className="text-xs text-muted-foreground">Getting it, but need more practice</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-2xl">🟢</span>
                <div>
                  <p className="font-medium text-sm">Mastered</p>
                  <p className="text-xs text-muted-foreground">Solid understanding, can apply it</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: BarChart3,
      title: "Understanding the Charts 📈",
      description: "Visual progress tracking",
      duckPose: 'wizard',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Charts show your progress across courses and standards at a glance.
          </p>
          <div className="bg-green-500/10 p-4 rounded-lg border-2 border-green-500/30">
            <p className="font-medium text-green-600 dark:text-green-400">Dashboard features:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>• Overall mastery percentage per course</li>
              <li>• Standards breakdown (red/yellow/green)</li>
              <li>• Progress over time graphs</li>
              <li>• Weak areas highlighted for focus</li>
            </ul>
          </div>
          <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/30">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">💡 Pro tip</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click any standard to see related assignments and your performance
            </p>
          </div>
        </div>
      )
    },
    {
      icon: Lightbulb,
      title: "Learning Standards 📚",
      description: "What they are and why they matter",
      duckPose: 'celebrating',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Standards are specific skills or knowledge you should master (like state requirements).
          </p>
          <div className="bg-purple-500/10 p-4 rounded-lg border-2 border-purple-500/30">
            <p className="font-medium text-purple-600 dark:text-purple-400">Examples:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>• Math: "Solve linear equations with variables"</li>
              <li>• ELA: "Identify main idea and supporting details"</li>
              <li>• Science: "Explain the water cycle"</li>
              <li>• History: "Analyze cause and effect relationships"</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground">
            Your curriculum is built around these standards so you know exactly what to learn!
          </p>
        </div>
      )
    },
    {
      icon: Award,
      title: "AI Mastery Analysis 🤖",
      description: "Smart insights about your learning",
      duckPose: 'superhero',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            AI analyzes your work across assignments to measure true understanding.
          </p>
          <div className="bg-orange-500/10 p-4 rounded-lg border-2 border-orange-500/30">
            <p className="font-medium text-orange-600 dark:text-orange-400">AI considers:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>• Quality of open-ended responses</li>
              <li>• Consistency across similar questions</li>
              <li>• Depth of explanation in practice</li>
              <li>• Discussion chat comprehension</li>
              <li>• Assessment performance</li>
            </ul>
          </div>
          <div className="bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/30">
            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">🎯 Result</p>
            <p className="text-xs text-muted-foreground mt-1">
              AI generates targeted remedial assignments when you need extra help on a standard
            </p>
          </div>
        </div>
      )
    },
    {
      icon: CheckCircle2,
      title: "Master Your Learning! 🚀",
      description: "Use analytics to your advantage",
      duckPose: 'celebrating',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            You're now equipped to track and improve your mastery!
          </p>
          <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 p-4 rounded-lg border-2 border-primary/30">
            <p className="font-medium mb-2">Action steps:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Check your dashboard weekly</li>
              <li>• Focus on yellow/red standards first</li>
              <li>• Read AI insights about weak areas</li>
              <li>• Complete remedial work when suggested</li>
              <li>• Celebrate mastery milestones! 🎉</li>
            </ul>
          </div>
          <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/30 text-center">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              📊 Your journey to mastery starts now!
            </p>
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
        markWizardComplete('mastery_tracking', true);
        handleClose(false);
      }}
      title="Mastery Analytics Tutorial"
    />
  );
}
