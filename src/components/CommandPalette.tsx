import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Sparkles,
  Mail,
  Settings,
  HelpCircle,
  Lightbulb,
  Bug,
  Map,
  GraduationCap,
  Calendar,
  Trophy,
  Timer,
  BookOpen,
  User,
  Bell,
  CreditCard,
  Moon,
  Sun,
  Monitor,
  Accessibility,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTutorial } from '@/contexts/TutorialContext';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { setTheme, theme } = useTheme();
  const { openTutorial } = useTutorial();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => openTutorial('learning_wizard'))}>
            <Sparkles className="mr-2 h-4 w-4" />
            <span>Start Learning Wizard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => window.location.href = 'mailto:support@advadigitalsolutions.com')}>
            <Mail className="mr-2 h-4 w-4" />
            <span>Contact Support</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => navigate('/student'))}>
            <GraduationCap className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/student/calendar'))}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Calendar</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/student/xp'))}>
            <Trophy className="mr-2 h-4 w-4" />
            <span>XP & Rewards</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/focus-tools'))}>
            <Timer className="mr-2 h-4 w-4" />
            <span>Focus Tools</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(() => navigate('/settings'))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>All Settings</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/settings/appearance'))}>
            {theme === 'dark' ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
            <span>Appearance</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/settings/accessibility'))}>
            <Accessibility className="mr-2 h-4 w-4" />
            <span>Accessibility</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/settings/notifications'))}>
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Light</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
            <Monitor className="mr-2 h-4 w-4" />
            <span>System</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Help & Support">
          <CommandItem onSelect={() => runCommand(() => navigate('/settings/help'))}>
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Help Center</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => openTutorial('focus_duck_wizard'))}>
            <BookOpen className="mr-2 h-4 w-4" />
            <span>View Tutorials</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Feedback">
          <CommandItem onSelect={() => runCommand(() => navigate('/feature-requests'))}>
            <Lightbulb className="mr-2 h-4 w-4" />
            <span>Feature Requests</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/feature-requests?category=bug'))}>
            <Bug className="mr-2 h-4 w-4" />
            <span>Report a Bug</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/roadmap'))}>
            <Map className="mr-2 h-4 w-4" />
            <span>View Roadmap</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}