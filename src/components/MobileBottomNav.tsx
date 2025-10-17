import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, Trophy, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, label: 'Home', path: '/student' },
    { icon: BookOpen, label: 'Courses', path: '/student' },
    { icon: Trophy, label: 'XP', path: '/student/xp' },
    { icon: Timer, label: 'Focus', path: '/pomodoro-fullscreen' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="grid grid-cols-4 gap-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors',
                isActive(item.path)
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
