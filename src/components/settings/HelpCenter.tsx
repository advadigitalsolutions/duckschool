import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { usePageContext } from '@/hooks/usePageContext';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useTutorial } from '@/contexts/TutorialContext';
import { Target, BookOpen, Calendar, TrendingUp, Sparkles, RotateCcw, Mail } from 'lucide-react';

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

export function HelpCenter() {
  const { pageContext } = usePageContext();
  const { resetWizard, resetAllWizards } = useOnboarding();
  const { openTutorial } = useTutorial();

  const getContextualTutorial = () => {
    const tutorial = TUTORIALS.find(t => t.contexts.includes(pageContext));
    return tutorial || TUTORIALS[0];
  };

  const contextualTutorial = getContextualTutorial();

  const handleReplayTutorial = (tutorialId: string) => {
    resetWizard(tutorialId);
    openTutorial(tutorialId as any);
  };

  const handleContactSupport = () => {
    const email = 'support@advadigitalsolutions.com';
    const subject = 'Support Request';
    const body = `Hi Support Team,

I need help with:

[Please describe your issue here]

---
User Info:
URL: ${window.location.href}
Browser: ${navigator.userAgent}`;
    
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Interactive Tutorials
          </CardTitle>
          <CardDescription>Learn how to use features with step-by-step guides</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg border-2 border-primary/50 bg-primary/5">
            <div className="flex items-start gap-3 mb-2">
              <contextualTutorial.icon className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Recommended Tutorial</h3>
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
              Start {contextualTutorial.title}
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">All Tutorials</h4>
            {TUTORIALS.filter(t => t.id !== contextualTutorial.id).map(tutorial => (
              <div 
                key={tutorial.id} 
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors border"
              >
                <div className="flex items-center gap-3">
                  <tutorial.icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{tutorial.title}</p>
                    <p className="text-xs text-muted-foreground">{tutorial.description}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleReplayTutorial(tutorial.id)}
                >
                  Start
                </Button>
              </div>
            ))}
          </div>

          <Separator />

          <Button
            variant="outline"
            className="w-full"
            onClick={() => resetAllWizards()}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset All Tutorials
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Support</CardTitle>
          <CardDescription>Need additional help? Get in touch with our support team</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleContactSupport}
            className="w-full"
          >
            <Mail className="h-4 w-4 mr-2" />
            Email Support
          </Button>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            We typically respond within 24 hours
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
