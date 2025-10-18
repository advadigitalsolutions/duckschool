import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { usePageContext } from '@/hooks/usePageContext';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Target, BookOpen, Calendar, TrendingUp, Sparkles, RotateCcw } from 'lucide-react';

interface HelpMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TUTORIALS = [
  {
    id: 'focus_duck_wizard',
    title: 'Focus Duck Timer',
    description: 'Learn how the duck helps you stay focused',
    icon: Target,
    contexts: ['student_dashboard', 'focus_tools']
  },
  {
    id: 'learning_wizard',
    title: 'Learning Wizard',
    description: 'Step-by-step guide through assignments',
    icon: BookOpen,
    contexts: ['assignment_detail']
  },
  {
    id: 'smart_calendar',
    title: 'Smart Calendar',
    description: 'AI-powered scheduling assistant',
    icon: Calendar,
    contexts: ['student_calendar']
  },
  {
    id: 'xp_system',
    title: 'XP & Rewards',
    description: 'How to earn and spend XP',
    icon: Sparkles,
    contexts: ['student_xp', 'student_rewards']
  },
  {
    id: 'mastery_tracking',
    title: 'Mastery Analytics',
    description: 'Understanding your progress',
    icon: TrendingUp,
    contexts: ['student_mastery']
  }
];

export function HelpMenu({ open, onOpenChange }: HelpMenuProps) {
  const { pageContext } = usePageContext();
  const { resetWizard, resetAllWizards } = useOnboarding();

  const getContextualTutorial = () => {
    const tutorial = TUTORIALS.find(t => t.contexts.includes(pageContext));
    return tutorial || TUTORIALS[0]; // Default to Focus Duck
  };

  const getPageName = () => {
    switch (pageContext) {
      case 'student_dashboard': return 'Dashboard';
      case 'assignment_detail': return 'Assignment';
      case 'course_dashboard': return 'Course';
      case 'student_profile': return 'Profile';
      case 'parent_dashboard': return 'Parent Dashboard';
      default: return 'this page';
    }
  };

  const contextualTutorial = getContextualTutorial();
  const pageName = getPageName();

  const handleReplayTutorial = (tutorialId: string) => {
    resetWizard(tutorialId);
    onOpenChange(false);
    // Tutorial will auto-trigger when the component remounts
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Help & Tutorials
          </DialogTitle>
          <DialogDescription>
            Need a refresher? We've got you covered!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Contextual tutorial for current page */}
          <div className="p-4 rounded-lg border-2 border-primary/50 bg-primary/5">
            <div className="flex items-start gap-3 mb-2">
              <contextualTutorial.icon className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Tutorial for {pageName}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {contextualTutorial.description}
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              className="w-full mt-2"
              onClick={() => handleReplayTutorial(contextualTutorial.id)}
            >
              Start Tutorial
            </Button>
          </div>

          <Separator />

          {/* All available tutorials */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">All Tutorials</h4>
            {TUTORIALS.filter(t => t.id !== contextualTutorial.id).map(tutorial => (
              <div 
                key={tutorial.id} 
                className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <tutorial.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{tutorial.title}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleReplayTutorial(tutorial.id)}
                >
                  Replay
                </Button>
              </div>
            ))}
          </div>

          <Separator />

          {/* Reset all */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              resetAllWizards();
              onOpenChange(false);
            }}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset All Tutorials
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
