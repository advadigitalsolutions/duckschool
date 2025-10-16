import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, GraduationCap, Calendar, BookOpen, BarChart, MessageSquare, Trophy, CheckCircle } from 'lucide-react';

interface DemoWizardProps {
  role: 'parent' | 'student';
}

export const DemoWizard = ({ role }: DemoWizardProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const showWizard = localStorage.getItem('showDemoWizard');
    if (showWizard === 'true') {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.removeItem('showDemoWizard');
    setOpen(false);
  };

  const handleNext = () => {
    if (step < (role === 'parent' ? parentSteps : studentSteps).length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const parentSteps = [
    {
      title: "Welcome to Duckschool, Parent Demo!",
      description: "Let's take a quick tour of how you can manage your homeschool.",
      icon: GraduationCap,
      content: (
        <div className="space-y-3">
          <p>You're logged in as <strong>Sarah Johnson</strong>, a homeschool parent managing your child's education.</p>
          <p>Your demo account includes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your student: Emma (8th Grade)</li>
            <li>Active courses in Math, Science, and History</li>
            <li>Pre-scheduled assignments and activities</li>
            <li>Progress tracking and analytics</li>
          </ul>
        </div>
      )
    },
    {
      title: "Parent Dashboard Overview",
      description: "Your command center for homeschooling",
      icon: BarChart,
      content: (
        <div className="space-y-3">
          <p>From your dashboard, you can:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>View Student Progress:</strong> See Emma's grades, completed assignments, and mastery levels</li>
            <li><strong>Manage Courses:</strong> Create curriculum, add assignments, and adjust pacing</li>
            <li><strong>Track Time:</strong> Monitor learning sessions and focus patterns</li>
            <li><strong>Approve Rewards:</strong> Manage Emma's XP redemptions</li>
          </ul>
        </div>
      )
    },
    {
      title: "Smart Schedule Calendar",
      description: "AI-powered scheduling assistant",
      icon: Calendar,
      content: (
        <div className="space-y-3">
          <p>The Smart Schedule Calendar helps you:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Auto-schedule assignments</strong> based on workload and preferences</li>
            <li><strong>Chat with AI assistant</strong> to block time, move assignments, and optimize schedules</li>
            <li><strong>Visualize workload</strong> with color-coded daily hours</li>
            <li><strong>Handle conflicts</strong> automatically with intelligent rescheduling</li>
          </ul>
          <p className="text-sm text-muted-foreground">Try saying: "Block off Christmas week" or "Move this assignment to a lighter day"</p>
        </div>
      )
    },
    {
      title: "Course Management",
      description: "Create and customize curriculum",
      icon: BookOpen,
      content: (
        <div className="space-y-3">
          <p>Navigate to any course to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Add Assignments:</strong> Create custom work or generate AI-powered lessons</li>
            <li><strong>Track Standards:</strong> Align with state standards and monitor mastery</li>
            <li><strong>Review Submissions:</strong> Grade work and provide feedback</li>
            <li><strong>Adjust Pacing:</strong> Speed up or slow down based on progress</li>
          </ul>
        </div>
      )
    },
    {
      title: "Ready to Explore!",
      description: "Your homeschool management platform awaits",
      icon: CheckCircle,
      content: (
        <div className="space-y-3">
          <p>You're all set! Here's what to try first:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Click on <strong>Emma's profile</strong> to see detailed progress</li>
            <li>Open the <strong>Smart Schedule Calendar</strong> and chat with the AI</li>
            <li>Create a <strong>new course</strong> using the AI curriculum generator</li>
            <li>Review Emma's <strong>pending submissions</strong> and provide grades</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">This is a demo environment. Feel free to experiment—nothing you do here is permanent!</p>
        </div>
      )
    }
  ];

  const studentSteps = [
    {
      title: "Welcome to Duckschool, Student Demo!",
      description: "Let's explore your personalized learning space.",
      icon: GraduationCap,
      content: (
        <div className="space-y-3">
          <p>You're logged in as <strong>Emma Johnson</strong>, an 8th grade student.</p>
          <p>Your demo account includes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Active courses in Algebra, Biology, and US History</li>
            <li>Today's assignments ready to complete</li>
            <li>XP rewards system with redeemable prizes</li>
            <li>AI learning coach to help you succeed</li>
          </ul>
        </div>
      )
    },
    {
      title: "Your Dashboard",
      description: "Everything you need in one place",
      icon: BarChart,
      content: (
        <div className="space-y-3">
          <p>Your dashboard shows:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Today's Tasks:</strong> Assignments scheduled for today</li>
            <li><strong>This Week's Schedule:</strong> Upcoming work organized by day</li>
            <li><strong>XP & Level:</strong> Track your progress and unlock rewards</li>
            <li><strong>Focus Journey:</strong> The animated duck shows your learning time</li>
          </ul>
        </div>
      )
    },
    {
      title: "Complete Assignments",
      description: "Interactive learning activities",
      icon: BookOpen,
      content: (
        <div className="space-y-3">
          <p>Click any assignment to start the learning wizard:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Research Phase:</strong> Find and validate credible sources</li>
            <li><strong>Notes Phase:</strong> Take organized notes on key concepts</li>
            <li><strong>Practice Phase:</strong> Try guided practice problems</li>
            <li><strong>Discussion Phase:</strong> Chat with AI coach about the topic</li>
            <li><strong>Assessment:</strong> Complete questions to demonstrate mastery</li>
          </ul>
        </div>
      )
    },
    {
      title: "AI Learning Coach",
      description: "Get help anytime you need it",
      icon: MessageSquare,
      content: (
        <div className="space-y-3">
          <p>Your AI coach can:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Answer questions</strong> about your assignments</li>
            <li><strong>Explain concepts</strong> in different ways</li>
            <li><strong>Provide hints</strong> without giving away answers</li>
            <li><strong>Track your understanding</strong> and adjust difficulty</li>
          </ul>
          <p className="text-sm text-muted-foreground">Look for the chat bubble in the bottom-right of any assignment!</p>
        </div>
      )
    },
    {
      title: "Earn Rewards & Level Up!",
      description: "Turn learning into achievements",
      icon: Trophy,
      content: (
        <div className="space-y-3">
          <p>The XP system makes learning fun:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Earn XP</strong> for completing assignments and maintaining focus</li>
            <li><strong>Level up</strong> to unlock new avatars and themes</li>
            <li><strong>Redeem rewards</strong> like extra screen time or special privileges</li>
            <li><strong>Track streaks</strong> and celebrate milestones</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">Check the Rewards Shop to see what you can redeem!</p>
        </div>
      )
    },
    {
      title: "Ready to Learn!",
      description: "Your personalized education starts now",
      icon: CheckCircle,
      content: (
        <div className="space-y-3">
          <p>You're all set! Here's what to try first:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Click on <strong>"Today's Tasks"</strong> to start an assignment</li>
            <li>Complete the <strong>learning wizard</strong> steps</li>
            <li>Chat with your <strong>AI coach</strong> if you get stuck</li>
            <li>Check your <strong>XP progress</strong> and browse the rewards shop</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">This is a demo environment. Explore freely—have fun learning!</p>
        </div>
      )
    }
  ];

  const steps = role === 'parent' ? parentSteps : studentSteps;
  const currentStep = steps[step];
  const Icon = currentStep.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">{currentStep.title}</DialogTitle>
              <DialogDescription>{currentStep.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Card>
          <CardContent className="pt-6">
            {currentStep.content}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between pt-4">
          <div className="flex gap-1">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 w-8 rounded-full transition-colors ${
                  idx === step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button onClick={handleNext}>
              {step < steps.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                'Get Started!'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
