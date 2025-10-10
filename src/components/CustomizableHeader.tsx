import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { HeaderCustomizationModal } from '@/components/HeaderCustomizationModal';
import { LogOut, User, Settings } from 'lucide-react';
import { getRandomQuote } from '@/utils/inspirationalQuotes';
import { getRandomAffirmation } from '@/utils/affirmations';
import { useNavigate } from 'react-router-dom';

interface HeaderSettings {
  showName: boolean;
  customName: string | null;
  showGrade: boolean;
  customGrade: string | null;
  greetingType: 'name' | 'time-based' | 'custom';
  rotatingDisplay: 'none' | 'quote' | 'affirmation' | 'funFact';
  funFactTopic: string | null;
  locations: Array<{ name: string; timezone: string }>;
  showWeather: boolean;
  customReminders: Array<{ text: string; completed: boolean }>;
  countdowns: Array<{ name: string; date: Date; showTime: boolean }>;
  pomodoroEnabled: boolean;
  pomodoroSettings: {
    workMinutes: number;
    breakMinutes: number;
    longBreakMinutes: number;
    sessionsUntilLongBreak: number;
    visualTimer: boolean;
    timerColor: string;
    numberColor: string;
  };
  celebrateWins: boolean;
  show8BitStars: boolean;
}

interface CustomizableHeaderProps {
  student: any;
  settings: HeaderSettings;
  onSaveSettings: (settings: HeaderSettings) => void;
  onSignOut: () => void;
  onDemoCelebration: () => void;
}

export function CustomizableHeader({
  student,
  settings,
  onSaveSettings,
  onSignOut,
  onDemoCelebration,
}: CustomizableHeaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [rotatingText, setRotatingText] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    // Update rotating text based on settings
    if (settings.rotatingDisplay === 'quote') {
      const quote = getRandomQuote();
      setRotatingText(`"${quote.quote}" - ${quote.author}`);
    } else if (settings.rotatingDisplay === 'affirmation') {
      setRotatingText(getRandomAffirmation(student?.display_name || student?.name || 'You'));
    }

    // Update every 30 seconds
    const interval = setInterval(() => {
      if (settings.rotatingDisplay === 'quote') {
        const quote = getRandomQuote();
        setRotatingText(`"${quote.quote}" - ${quote.author}`);
      } else if (settings.rotatingDisplay === 'affirmation') {
        setRotatingText(getRandomAffirmation(student?.display_name || student?.name || 'You'));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [settings.rotatingDisplay, student]);

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const name = settings.customName || student?.display_name || student?.name || 'Student';
    
    if (settings.greetingType === 'time-based') {
      const hour = currentTime.getHours();
      let timeGreeting = 'Good evening';
      if (hour < 12) timeGreeting = 'Good morning';
      else if (hour < 18) timeGreeting = 'Good afternoon';
      return `${timeGreeting}, ${name}!`;
    }
    
    return `Welcome back, ${name}!`;
  };

  const formatCountdown = (targetDate: Date | string) => {
    try {
      const now = new Date();
      const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
      const diff = target.getTime() - now.getTime();
      
      if (diff <= 0) return 'Event has passed';
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } catch (error) {
      console.error('Error formatting countdown:', error);
      return 'Invalid date';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        {settings.show8BitStars && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                }}
              />
            ))}
          </div>
        )}
        
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Left section */}
            <div className="flex items-center gap-4">
              <Avatar 
                className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity" 
                onClick={() => navigate('/student/profile')}
              >
                <AvatarImage src={student?.avatar_url || ''} />
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              
              <div>
                <div 
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity group"
                  onClick={() => setShowModal(true)}
                >
                  {settings.showName && (
                    <h1 className="text-xl md:text-2xl font-bold group-hover:underline">
                      {getGreeting()}
                    </h1>
                  )}
                  {settings.showGrade && (
                    <Badge variant="secondary">
                      {settings.customGrade || student?.grade_level || 'Grade N/A'}
                    </Badge>
                  )}
                  <Settings className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                {settings.rotatingDisplay !== 'none' && (
                  <p className="text-sm text-muted-foreground mt-1 max-w-2xl truncate">
                    {rotatingText}
                  </p>
                )}
              </div>
            </div>

            {/* Center section - Pomodoro */}
            {settings.pomodoroEnabled && (
              <div className="flex-shrink-0">
                <PomodoroTimer settings={settings.pomodoroSettings} compact />
              </div>
            )}

            {/* Right section */}
            <div className="flex items-center gap-2">
              {settings.locations.map((loc, index) => {
                try {
                  const timeString = currentTime.toLocaleTimeString('en-US', { 
                    timeZone: loc.timezone,
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  return (
                    <Badge key={index} variant="outline" className="hidden md:inline-flex">
                      {loc.name}: {timeString}
                    </Badge>
                  );
                } catch (error) {
                  console.error(`Invalid timezone: ${loc.timezone}`, error);
                  return (
                    <Badge key={index} variant="outline" className="hidden md:inline-flex text-destructive">
                      {loc.name}: Invalid timezone
                    </Badge>
                  );
                }
              })}
              
              <ThemeToggle />
              <Button variant="outline" size="icon" onClick={onSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Second row - reminders and countdowns */}
          {(settings.customReminders.length > 0 || settings.countdowns.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {settings.customReminders.map((reminder, index) => (
                <Badge 
                  key={`reminder-${index}`} 
                  variant="outline" 
                  className="gap-2 bg-yellow-500/10 border-yellow-500/50"
                >
                  <Checkbox 
                    checked={reminder.completed}
                    onCheckedChange={() => {
                      const newReminders = [...settings.customReminders];
                      newReminders[index].completed = !newReminders[index].completed;
                      onSaveSettings({ ...settings, customReminders: newReminders });
                    }}
                  />
                  <span className={reminder.completed ? 'line-through' : ''}>
                    📌 {reminder.text}
                  </span>
                </Badge>
              ))}
              
              {settings.countdowns.map((countdown, index) => (
                <Badge 
                  key={`countdown-${index}`} 
                  variant="outline"
                  className="bg-blue-500/10 border-blue-500/50"
                >
                  ⏰ {countdown.name}: {formatCountdown(countdown.date)}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </header>

      <HeaderCustomizationModal
        open={showModal}
        onOpenChange={setShowModal}
        settings={settings}
        onSave={onSaveSettings}
        onDemo={onDemoCelebration}
        studentName={student?.display_name || student?.name || 'Student'}
      />
    </>
  );
}
