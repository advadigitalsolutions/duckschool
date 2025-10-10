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
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface HeaderSettings {
  showName: boolean;
  customName: string | null;
  showGrade: boolean;
  customGrade: string | null;
  greetingType: 'none' | 'name' | 'time-based';
  rotatingDisplay: 'none' | 'quote' | 'affirmation' | 'funFact';
  rotationFrequency: 'minute' | 'hour' | 'day';
  funFactTopic: string | null;
  locations: Array<{ name: string; timezone: string }>;
  showWeather: boolean;
  weatherZipCode: string | null;
  customReminders: Array<{ text: string; completed: boolean }>;
  countdowns: Array<{ 
    name: string; 
    date: Date; 
    time?: string;
    showDays: boolean;
    showHours: boolean;
    showMinutes: boolean;
    showSeconds: boolean;
    isComplete?: boolean;
  }>;
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
  starColor: string;
  headerVisibility: 'sticky' | 'auto-hide' | 'normal';
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
  const [weather, setWeather] = useState<string | null>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const updateRotatingText = async () => {
      if (settings.rotatingDisplay === 'quote') {
        const quote = getRandomQuote();
        setRotatingText(`"${quote.quote}" - ${quote.author}`);
      } else if (settings.rotatingDisplay === 'affirmation') {
        setRotatingText(getRandomAffirmation(student?.display_name || student?.name || 'You', student?.pronouns));
      } else if (settings.rotatingDisplay === 'funFact' && settings.funFactTopic) {
        try {
          const { data, error } = await supabase.functions.invoke('generate-fun-fact', {
            body: { topic: settings.funFactTopic }
          });
          if (!error && data?.fact) {
            setRotatingText(data.fact);
          }
        } catch (error) {
          console.error('Failed to generate fun fact:', error);
        }
      }
    };

    updateRotatingText();

    // Determine interval based on rotation frequency
    const getInterval = () => {
      switch (settings.rotationFrequency) {
        case 'minute': return 60000; // 1 minute
        case 'hour': return 3600000; // 1 hour
        case 'day': return 86400000; // 24 hours
        default: return 3600000;
      }
    };

    const interval = setInterval(updateRotatingText, getInterval());
    return () => clearInterval(interval);
  }, [settings.rotatingDisplay, settings.rotationFrequency, settings.funFactTopic, student]);

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Weather fetching
  useEffect(() => {
    const fetchWeather = async () => {
      if (!settings.showWeather) {
        setWeather(null);
        return;
      }

      try {
        let location = settings.weatherZipCode;
        
        // If no zip code, try to get browser location
        if (!location && navigator.geolocation) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          location = `${position.coords.latitude},${position.coords.longitude}`;
        }

        if (location) {
          // Using wttr.in as a simple weather API
          const response = await fetch(`https://wttr.in/${location}?format=%C+%t`);
          const weatherText = await response.text();
          setWeather(weatherText.trim());
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
        setWeather(null);
      }
    };

    fetchWeather();
    // Update weather every 30 minutes
    const interval = setInterval(fetchWeather, 1800000);
    return () => clearInterval(interval);
  }, [settings.showWeather, settings.weatherZipCode]);

  // Auto-hide header on scroll
  useEffect(() => {
    if (settings.headerVisibility !== 'auto-hide') return;

    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 50) {
        setIsHeaderVisible(true);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down
        setIsHeaderVisible(false);
      }
      
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [settings.headerVisibility]);

  const getGreeting = () => {
    if (settings.greetingType === 'none') {
      return null;
    }
    
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

  const formatCountdown = (countdown: any) => {
    try {
      const now = new Date();
      // Handle date string deserialization
      let target = countdown.date instanceof Date ? countdown.date : new Date(countdown.date);
      
      if (countdown.time) {
        const [hours, minutes] = countdown.time.split(':');
        target = new Date(target); // Create new instance to avoid mutation
        target.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      
      const diff = target.getTime() - now.getTime();
      
      if (diff <= 0) {
        if (!countdown.isComplete) {
          const updatedCountdowns = settings.countdowns.map((c: any) => 
            c.name === countdown.name && c.date === countdown.date 
              ? { ...c, isComplete: true } 
              : c
          );
          onSaveSettings({ ...settings, countdowns: updatedCountdowns });
          
          // Flash the header for 30 seconds
          const flashInterval = setInterval(() => {
            document.querySelector('header')?.classList.toggle('flash-rainbow');
          }, 300);
          setTimeout(() => clearInterval(flashInterval), 30000);
        }
        return 'Complete!';
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      const parts = [];
      if (countdown.showDays !== false) parts.push(`${days}d`);
      if (countdown.showHours !== false) parts.push(`${hours}h`);
      if (countdown.showMinutes !== false) parts.push(`${minutes}m`);
      if (countdown.showSeconds !== false) parts.push(`${seconds}s`);
      
      return parts.join(' ') || 'No units selected';
    } catch (error) {
      console.error('Error formatting countdown:', error, countdown);
      return 'Invalid date';
    }
  };

  const headerClasses = cn(
    "top-0 z-40 border-b bg-background/70 backdrop-blur-xl backdrop-saturate-150 shadow-lg transition-transform duration-300",
    settings.headerVisibility === 'sticky' && "sticky",
    settings.headerVisibility === 'auto-hide' && "sticky",
    settings.headerVisibility === 'auto-hide' && !isHeaderVisible && "-translate-y-full"
  );

  return (
    <>
      <header className={headerClasses}>
        {settings.show8BitStars && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: settings.starColor || '#fbbf24',
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                  animation: `twinkle-${i % 3} 16s ease-in-out infinite`,
                  animationDelay: `${(i * 1.6) % 8}s`,
                }}
              />
            ))}
          </div>
        )}
        <style>
          {`
            @keyframes twinkle-0 {
              0% { opacity: 0; transform: scale(0.5); }
              25% { opacity: 0.8; transform: scale(1); }
              50% { opacity: 0.8; transform: scale(1); }
              75% { opacity: 0; transform: scale(0.5); }
              100% { opacity: 0; transform: scale(0.5); }
            }
            @keyframes twinkle-1 {
              0% { opacity: 0; transform: scale(0.6); }
              25% { opacity: 0.7; transform: scale(1); }
              50% { opacity: 0.7; transform: scale(1); }
              75% { opacity: 0; transform: scale(0.6); }
              100% { opacity: 0; transform: scale(0.6); }
            }
            @keyframes twinkle-2 {
              0% { opacity: 0; transform: scale(0.4); }
              25% { opacity: 0.9; transform: scale(1.1); }
              50% { opacity: 0.9; transform: scale(1.1); }
              75% { opacity: 0; transform: scale(0.4); }
              100% { opacity: 0; transform: scale(0.4); }
            }
            @keyframes flash-rainbow {
              0% { border-color: hsl(0, 100%, 50%); }
              16% { border-color: hsl(60, 100%, 50%); }
              33% { border-color: hsl(120, 100%, 50%); }
              50% { border-color: hsl(180, 100%, 50%); }
              66% { border-color: hsl(240, 100%, 50%); }
              83% { border-color: hsl(300, 100%, 50%); }
              100% { border-color: hsl(360, 100%, 50%); }
            }
            .flash-rainbow {
              animation: flash-rainbow 0.3s linear infinite;
              border-width: 3px;
            }
          `}
        </style>
        
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Left section */}
            <div className="flex items-center gap-4 flex-1 min-w-0 group">
              <Avatar 
                className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity" 
                onClick={() => navigate('/student/profile')}
              >
                <AvatarImage src={student?.avatar_url || ''} />
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              
              {settings.showName && settings.greetingType !== 'none' ? (
                <div>
                  <div 
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity group"
                    onClick={() => setShowModal(true)}
                  >
                    <h1 className="text-xl md:text-2xl font-bold group-hover:underline">
                      {getGreeting()}
                    </h1>
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
              ) : (
                <div 
                  className="flex-1 min-h-[3rem] flex items-center cursor-pointer"
                  onClick={() => setShowModal(true)}
                >
                  <Settings className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Center section - Pomodoro */}
            {settings.pomodoroEnabled && (
              <div className="flex-shrink-0">
                <PomodoroTimer settings={settings.pomodoroSettings} compact />
              </div>
            )}

            {/* Right section */}
            <div className="flex items-center gap-2">
              {weather && (
                <Badge variant="outline" className="hidden md:inline-flex">
                  🌤️ {weather}
                </Badge>
              )}
              
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
                  className="gap-2 bg-amber-500/10 border-amber-500/50 hover:bg-amber-500/20 transition-colors"
                >
                  <Checkbox 
                    checked={reminder.completed}
                    onCheckedChange={async () => {
                      const wasCompleted = reminder.completed;
                      const newReminders = [...settings.customReminders];
                      newReminders[index].completed = !newReminders[index].completed;
                      onSaveSettings({ ...settings, customReminders: newReminders });
                      
                      // Trigger celebration and log to parent dashboard when checking off
                      if (!wasCompleted && newReminders[index].completed) {
                        if (settings.celebrateWins) {
                          onDemoCelebration();
                        }
                        
                        // Log to parent dashboard via XP event
                        try {
                          await supabase.from('xp_events').insert({
                            student_id: student?.id,
                            event_type: 'reminder_completed',
                            amount: 0,
                            description: `Completed reminder: ${reminder.text}`,
                          });
                        } catch (error) {
                          console.error('Error logging reminder completion:', error);
                        }
                      }
                    }}
                  />
                  <span className={reminder.completed ? 'line-through opacity-60' : ''}>
                    {reminder.text}
                  </span>
                </Badge>
              ))}
              
              {settings.countdowns.map((countdown, index) => {
                const isComplete = countdown.isComplete || formatCountdown(countdown) === 'Complete!';
                return (
                  <Badge 
                    key={`countdown-${index}`} 
                    variant="outline"
                    className={cn(
                      "transition-all duration-300",
                      isComplete 
                        ? "bg-gradient-to-r from-green-500/20 to-blue-500/20 border-green-500/50 animate-pulse" 
                        : "bg-blue-500/10 border-blue-500/50 hover:bg-blue-500/20"
                    )}
                  >
                    ⏰ {countdown.name}: {formatCountdown(countdown)}
                  </Badge>
                );
              })}
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
