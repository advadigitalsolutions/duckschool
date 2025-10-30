import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, Trophy, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Hide on popup routes
  if (location.pathname === '/pomodoro-popup' || location.pathname === '/duck-popup') {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, label: 'Home', path: '/student' },
    { icon: BookOpen, label: 'Courses', path: '/student/assignments' },
    { icon: Trophy, label: 'XP', path: '/student/xp' },
    { icon: Timer, label: 'Focus', path: '/focus-tools' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t shadow-lg">
      <div className="grid grid-cols-4 gap-1 p-2 safe-area-inset-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center gap-0.5 sm:gap-1 p-2 rounded-lg transition-all active:scale-95',
                isActive(item.path)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent/50 active:bg-accent'
              )}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-[10px] sm:text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
