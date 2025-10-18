import { useState, useEffect } from 'react';
import { BookOpen, Search, FileText, MessageCircle, PenTool, CheckCircle2 } from 'lucide-react';
import { OnboardingWizard, WizardStep } from './onboarding/OnboardingWizard';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useTutorial } from '@/contexts/TutorialContext';

export function LearningWizardTutorial() {
  const [open, setOpen] = useState(false);
  const { markWizardComplete } = useOnboarding();
  const { activeTutorial, closeTutorial } = useTutorial();

  useEffect(() => {
    if (activeTutorial === 'learning_wizard') {
      setOpen(true);
    }
  }, [activeTutorial]);

  const handleClose = (completed: boolean) => {
    setOpen(false);
    closeTutorial();
    if (completed) {
      markWizardComplete('learning_wizard');
    }
  };

  const steps: WizardStep[] = [
    {
      icon: BookOpen,
      title: "Welcome to the Learning Wizard! 📚",
      description: "Your step-by-step guide through assignments",
      duckPose: 'waving',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            The Learning Wizard breaks down assignments into manageable phases to help you learn effectively!
          </p>
          <div className="bg-accent/50 p-4 rounded-lg">
            <p className="font-medium">Five phases of learning:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>• Research - Explore and gather information</li>
              <li>• Notes - Organize what you've learned</li>
              <li>• Discussion - Talk through concepts with AI</li>
              <li>• Practice - Apply your knowledge</li>
              <li>• Assessment - Show what you know</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: Search,
      title: "Phase 1: Research 🔍",
      description: "Discover and validate resources",
      duckPose: 'pointing',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Start by exploring reliable sources to build your understanding.
          </p>
          <div className="bg-blue-500/10 p-4 rounded-lg border-2 border-blue-500/30">
            <p className="font-medium text-blue-600 dark:text-blue-400">Research tips:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>• AI suggests relevant resources to get you started</li>
              <li>• Add your own sources as you explore</li>
              <li>• View resources in an iframe or open in new tab</li>
              <li>• Parents can validate your sources</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: FileText,
      title: "Phase 2: Taking Notes 📝",
      description: "Capture key insights",
      duckPose: 'wizard',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Transform what you've learned into organized notes using our rich text editor.
          </p>
          <div className="bg-green-500/10 p-4 rounded-lg border-2 border-green-500/30">
            <p className="font-medium text-green-600 dark:text-green-400">Note-taking features:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>• Format text with bold, italic, lists</li>
              <li>• Add images and links</li>
              <li>• Save notes to course reference library</li>
              <li>• AI learning coach available for questions</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: MessageCircle,
      title: "Phase 3: Discussion 💬",
      description: "Deepen understanding through conversation",
      duckPose: 'celebrating',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Chat with your AI learning coach to explore concepts and clarify understanding.
          </p>
          <div className="bg-purple-500/10 p-4 rounded-lg border-2 border-purple-500/30">
            <p className="font-medium text-purple-600 dark:text-purple-400">Discussion benefits:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>• Ask questions in your own words</li>
              <li>• Get explanations at your level</li>
              <li>• Explore "what if" scenarios</li>
              <li>• Build confidence before assessment</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: PenTool,
      title: "Phase 4: Practice ✏️",
      description: "Apply what you've learned",
      duckPose: 'superhero',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Work through practice problems with AI support - no pressure!
          </p>
          <div className="bg-orange-500/10 p-4 rounded-lg border-2 border-orange-500/30">
            <p className="font-medium text-orange-600 dark:text-orange-400">Practice mode:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>• Low-stakes environment to try things out</li>
              <li>• Get hints when stuck</li>
              <li>• Learn from mistakes safely</li>
              <li>• AI coach guides you through reasoning</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: CheckCircle2,
      title: "Phase 5: Assessment ✅",
      description: "Demonstrate your mastery",
      duckPose: 'celebrating',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Show what you know! This is your chance to shine.
          </p>
          <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 p-4 rounded-lg border-2 border-primary/30">
            <p className="font-medium mb-2">Remember:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• You've already practiced, so you're ready</li>
              <li>• AI grades open-ended responses instantly</li>
              <li>• Get detailed feedback on your work</li>
              <li>• Can request human review if needed</li>
              <li>• Your learning coach is still there to help!</li>
            </ul>
          </div>
          <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/30 text-center">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              💡 The wizard saves your progress, so you can take breaks anytime!
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
        markWizardComplete('learning_wizard', true);
        handleClose(false);
      }}
      title="Learning Wizard Tutorial"
    />
  );
}
