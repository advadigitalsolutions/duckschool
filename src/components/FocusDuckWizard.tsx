import { useState, useEffect } from 'react';
import { Target, Clock, Eye, Zap, CheckCircle2, PauseCircle, BookOpen, Ghost, Heart } from 'lucide-react';
import { OnboardingWizard, WizardStep } from './onboarding/OnboardingWizard';
import { useOnboarding } from '@/hooks/useOnboarding';

export function FocusDuckWizard() {
  const [open, setOpen] = useState(false);
  const { hasSeenWizard, markWizardComplete } = useOnboarding();

  useEffect(() => {
    if (!hasSeenWizard('focus_duck_wizard')) {
      // Small delay to let page load first
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [hasSeenWizard]);

  const steps: WizardStep[] = [
    {
      icon: Target,
      title: "Meet Your Focus Duck! 🦆",
      description: "Your friendly companion for staying focused",
      duckPose: 'waving',
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
      duckPose: 'pointing',
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
              <li>• The duck will show your progress with a walking animation</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: Zap,
      title: "The Duck Walks With You ⏱️",
      description: "Watch your progress in real-time",
      duckPose: 'celebrating',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            As time passes, the duck walks along the progress bar! The further it gets, the closer you are to finishing.
          </p>
          <div className="bg-green-500/10 p-4 rounded-lg border-2 border-green-500/30">
            <p className="font-medium text-green-600 dark:text-green-400">🟢 Happy Duck = You're Crushing It!</p>
            <p className="text-sm text-muted-foreground mt-2">
              When the duck is walking and the bar is green, you're doing great. Keep it up!
            </p>
          </div>
        </div>
      )
    },
    {
      icon: Eye,
      title: "⚠️ What Makes the Duck Upset",
      description: "Understanding idle detection",
      duckPose: 'confused',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            The duck gets worried if you're idle (no mouse/keyboard activity) for 60+ seconds.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-green-500/10 border-2 border-green-500/30">
              <p className="font-medium text-green-600 dark:text-green-400 text-sm mb-1">😊 Happy Duck</p>
              <p className="text-xs text-muted-foreground">You're actively working</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/10 border-2 border-orange-500/30">
              <p className="font-medium text-orange-600 dark:text-orange-400 text-sm mb-1">😰 Jumping Duck</p>
              <p className="text-xs text-muted-foreground">Idle for 60+ seconds</p>
            </div>
          </div>
          <div className="bg-orange-500/10 p-4 rounded-lg border-2 border-orange-500/30">
            <p className="font-medium text-orange-600 dark:text-orange-400">When this happens:</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>• Duck starts jumping and quacking</li>
              <li>• Progress bar turns orange</li>
              <li>• This is automatic - it's checking if you're still there!</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: Ghost,
      title: "When the Duck Falls 😱",
      description: "Don't panic - you can always bring it back!",
      duckPose: 'confused',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            If you ignore the jumping duck for too long, it will FALL dramatically off the screen!
          </p>
          <div className="bg-red-500/10 p-4 rounded-lg border-2 border-red-500/30 space-y-3">
            <div>
              <p className="font-medium text-red-600 dark:text-red-400">The Sequence:</p>
              <ol className="mt-2 space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                <li>Duck falls off the screen</li>
                <li>Duck is flattened at bottom-left for 10 seconds</li>
                <li>Duck comes back to life and jumps frantically</li>
                <li>Click the revived duck anytime to rescue it!</li>
              </ol>
            </div>
          </div>
          <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/30">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">💡 Don't worry!</p>
            <p className="text-xs text-muted-foreground mt-1">
              The duck always comes back. Just click it to continue your session!
            </p>
          </div>
        </div>
      )
    },
    {
      icon: PauseCircle,
      title: "Pause vs. Research vs. Away",
      description: "Know the difference!",
      duckPose: 'pointing',
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            <div className="p-3 rounded-lg bg-orange-500/10 border-2 border-orange-500/30">
              <p className="font-medium text-orange-600 dark:text-orange-400 text-sm mb-2">⏸ Good Pause (Break Button)</p>
              <p className="text-xs text-muted-foreground mb-2">Bathroom break, snack, quick stretch</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Click pause button (right side of bar)</li>
                <li>• Duck stays where it is, no falling</li>
                <li>• Counts as intentional break time</li>
              </ul>
            </div>
            
            <div className="p-3 rounded-lg bg-blue-500/10 border-2 border-blue-500/30">
              <p className="font-medium text-blue-600 dark:text-blue-400 text-sm mb-2">📖 Focused Research (Book Button)</p>
              <p className="text-xs text-muted-foreground mb-2">Reading articles, watching videos, reviewing notes</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Click book button (right side of bar)</li>
                <li>• <strong>Progress bar turns blue</strong></li>
                <li>• <strong>Duck keeps walking! You're still focused!</strong></li>
                <li>• Timer keeps running (counts as quality focus time)</li>
                <li>• Duck won't get upset or fall</li>
              </ul>
            </div>
            
            <div className="p-3 rounded-lg bg-red-500/10 border-2 border-red-500/30">
              <p className="font-medium text-red-600 dark:text-red-400 text-sm mb-2">❌ Going Away</p>
              <p className="text-xs text-muted-foreground mb-2">Social media, phone, getting distracted</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Don't click anything - just leave</li>
                <li>• Duck notices idle → starts jumping</li>
                <li>• If ignored, duck falls</li>
                <li>• Counts as away/idle time</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-primary/10 p-3 rounded-lg border border-primary/30">
            <p className="text-sm font-medium text-primary">🎯 Key Takeaway</p>
            <p className="text-xs text-muted-foreground mt-1">
              Use <strong>book button</strong> when reading/researching (duck stays happy!). 
              Use <strong>pause button</strong> for breaks. 
              Don't click anything if distracted - duck will try to help you refocus!
            </p>
          </div>
        </div>
      )
    },
    {
      icon: Eye,
      title: "📸 Accountability Mode (Optional)",
      description: "Get gentle check-ins to stay on track",
      duckPose: 'superhero',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Turn on accountability mode for random check-ins during your session.
          </p>
          <div className="bg-accent/50 p-4 rounded-lg space-y-3">
            <div>
              <p className="font-medium">How it works:</p>
              <ol className="mt-2 space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li>You'll be asked if you're still focused at random times (30s - 5min)</li>
                <li>Click "Yes" → Screen capture + AI checks if you're on task</li>
                <li>Click "No" → Timer pauses, no screenshot</li>
              </ol>
            </div>
            <div className="bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/30">
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">🔒 Privacy</p>
              <p className="text-xs text-muted-foreground">Screenshots instantly deleted, never stored</p>
            </div>
          </div>
          <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/30">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">💡 This is TOTALLY optional!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Only use if it helps YOU. Can lose -1 XP if off-task (disabled by default).
            </p>
          </div>
        </div>
      )
    },
    {
      icon: Zap,
      title: "How This Helps You 📊",
      description: "The payoff for staying focused",
      duckPose: 'wizard',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Every session tracks your focus data so you can see your patterns!
          </p>
          <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 p-4 rounded-lg border-2 border-primary/30">
            <p className="font-medium mb-2">What you'll see in analytics:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-green-500">🟢</span>
                <span><strong>Active time:</strong> Focused work</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">🔵</span>
                <span><strong>Research time:</strong> Reading & learning (counts as quality focus!)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400">🟠</span>
                <span><strong>Break time:</strong> Intentional pauses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">🔴</span>
                <span><strong>Idle/Away time:</strong> Distractions</span>
              </li>
            </ul>
          </div>
          <div className="bg-accent/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              📈 Use this data to discover: When do you focus best? What distracts you? Over time, you'll build epic focus skills!
            </p>
          </div>
        </div>
      )
    },
    {
      icon: CheckCircle2,
      title: "Ready to Focus! 🚀",
      description: "You're all set to start your first session",
      duckPose: 'celebrating',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            You now know everything you need to use the Focus Duck effectively!
          </p>
          <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 p-4 rounded-lg space-y-2 border-2 border-primary/30">
            <p className="font-medium text-primary flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Remember:
            </p>
            <ul className="mt-2 space-y-2 text-sm">
              <li>• The duck is here to help, not stress you out</li>
              <li>• It's okay to take breaks when you need them</li>
              <li>• Use the 📖 book button when researching!</li>
              <li>• Every focus session earns you XP and builds good habits</li>
              <li>• You've got this! 🦆✨</li>
            </ul>
          </div>
          <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/30 text-center">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              💡 Need to see this again? Click the ✨ help button anytime!
            </p>
          </div>
        </div>
      )
    }
  ];

  return (
    <OnboardingWizard
      open={open}
      onOpenChange={setOpen}
      steps={steps}
      onComplete={() => markWizardComplete('focus_duck_wizard')}
      onSkip={() => markWizardComplete('focus_duck_wizard', true)}
      title="Focus Duck Tutorial"
    />
  );
}
