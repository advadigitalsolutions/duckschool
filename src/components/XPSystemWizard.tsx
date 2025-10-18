import { useState, useEffect } from 'react';
import { Sparkles, Trophy, Gift, TrendingUp, Star, CheckCircle2 } from 'lucide-react';
import { OnboardingWizard, WizardStep } from './onboarding/OnboardingWizard';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useTutorial } from '@/contexts/TutorialContext';

export function XPSystemWizard() {
  const [open, setOpen] = useState(false);
  const { markWizardComplete } = useOnboarding();
  const { activeTutorial, closeTutorial } = useTutorial();

  useEffect(() => {
    if (activeTutorial === 'xp_system') {
      setOpen(true);
    }
  }, [activeTutorial]);

  const handleClose = (completed: boolean) => {
    setOpen(false);
    closeTutorial();
    if (completed) {
      markWizardComplete('xp_system');
    }
  };

  const steps: WizardStep[] = [
    {
      icon: Sparkles,
      title: "Welcome to XP & Rewards! ⭐",
      description: "Turn learning into an adventure",
      duckPose: 'waving',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Earn XP (experience points) for everything you accomplish, then spend it on rewards!
          </p>
          <div className="bg-accent/50 p-4 rounded-lg">
            <p className="font-medium">The system:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>• Complete assignments and chores to earn XP</li>
              <li>• Level up as you accumulate points</li>
              <li>• Spend XP in the rewards shop</li>
              <li>• Parents customize rewards for your family</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: Trophy,
      title: "How to Earn XP 🎯",
      description: "Multiple ways to gain experience",
      duckPose: 'superhero',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            XP rewards effort, completion, and quality work!
          </p>
          <div className="bg-blue-500/10 p-4 rounded-lg border-2 border-blue-500/30">
            <p className="font-medium text-blue-600 dark:text-blue-400">Earn XP by:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>• Completing focus sessions (based on time)</li>
              <li>• Submitting assignments on time</li>
              <li>• Achieving high scores on assessments</li>
              <li>• Finishing chores and household tasks</li>
              <li>• Staying on track during accountability checks</li>
            </ul>
          </div>
          <div className="bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/30">
            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">⚡ Bonus XP</p>
            <p className="text-xs text-muted-foreground mt-1">
              Exceptional work and streaks can earn bonus multipliers!
            </p>
          </div>
        </div>
      )
    },
    {
      icon: Star,
      title: "XP Values & Settings ⚙️",
      description: "Customized for your family",
      duckPose: 'wizard',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Parents can adjust XP values to match your family's priorities.
          </p>
          <div className="bg-green-500/10 p-4 rounded-lg border-2 border-green-500/30">
            <p className="font-medium text-green-600 dark:text-green-400">Customizable rewards:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>• Different XP for different assignment types</li>
              <li>• Bonus for early completion</li>
              <li>• Penalty for late work (optional)</li>
              <li>• Chore XP values set by parents</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: Gift,
      title: "The Rewards Shop 🛍️",
      description: "Spend your hard-earned XP",
      duckPose: 'celebrating',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Browse rewards created by your parents and redeem them with XP!
          </p>
          <div className="bg-purple-500/10 p-4 rounded-lg border-2 border-purple-500/30">
            <p className="font-medium text-purple-600 dark:text-purple-400">Example rewards:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>• Extra screen time (50 XP)</li>
              <li>• Choose dinner menu (100 XP)</li>
              <li>• Skip a chore (75 XP)</li>
              <li>• Special outing (300 XP)</li>
              <li>• Later bedtime on weekend (150 XP)</li>
            </ul>
          </div>
          <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/30">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">📋 Approval Process</p>
            <p className="text-xs text-muted-foreground mt-1">
              Parents review and approve redemptions before they're granted
            </p>
          </div>
        </div>
      )
    },
    {
      icon: TrendingUp,
      title: "Levels & Progression 📈",
      description: "Watch your XP grow over time",
      duckPose: 'pointing',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            As you earn XP, you'll level up and unlock achievements!
          </p>
          <div className="bg-orange-500/10 p-4 rounded-lg border-2 border-orange-500/30">
            <p className="font-medium text-orange-600 dark:text-orange-400">Progression features:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>• Level badge shows your current level</li>
              <li>• XP history tracks your earnings</li>
              <li>• Weekly summaries show progress</li>
              <li>• Redemption history tracks spending</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: CheckCircle2,
      title: "Start Earning XP! 🚀",
      description: "Your adventure begins now",
      duckPose: 'celebrating',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            You're ready to start earning and spending XP!
          </p>
          <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 p-4 rounded-lg border-2 border-primary/30">
            <p className="font-medium mb-2">Success tips:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Check your XP balance in the header</li>
              <li>• Focus on quality work, not just completion</li>
              <li>• Save up for bigger rewards</li>
              <li>• Stay consistent for streak bonuses</li>
              <li>• Have fun with it - learning is rewarding!</li>
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
        markWizardComplete('xp_system', true);
        handleClose(false);
      }}
      title="XP & Rewards Tutorial"
    />
  );
}
