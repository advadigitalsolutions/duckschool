import { usePomodoro } from '@/contexts/PomodoroContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, RotateCcw, SkipForward, Coffee, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PomodoroTimerProps {
  compact?: boolean;
}

export function PomodoroTimer({ compact = false }: PomodoroTimerProps) {
  const {
    timeLeft,
    isRunning,
    isBreak,
    sessionsCompleted,
    totalDuration,
    settings,
    toggleTimer,
    resetTimer,
    skipToBreak,
    skipToWork,
  } = usePomodoro();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border shadow-sm">
        <div className="flex items-center gap-1.5">
          {isBreak ? (
            <Coffee className="h-4 w-4 text-green-500 animate-pulse" />
          ) : (
            <Zap className="h-4 w-4 text-orange-500" />
          )}
        </div>
        
        {settings.visualTimer && (
          <div className="relative w-10 h-10">
            <svg className="transform -rotate-90 w-10 h-10">
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
                className="text-muted opacity-20"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke={isBreak ? 'hsl(142, 76%, 36%)' : settings.timerColor}
                strokeWidth="2.5"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000"
                style={{ strokeLinecap: 'round' }}
              />
            </svg>
            <div 
              className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold"
              style={{ color: settings.numberColor }}
            >
              {Math.ceil(timeLeft / 60)}
            </div>
          </div>
        )}
        
        <div 
          className="font-mono text-base font-bold tabular-nums"
          style={{ color: settings.numberColor }}
        >
          {formatTime(timeLeft)}
        </div>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTimer} 
            className={cn(
              "h-8 w-8 transition-all",
              isRunning && "text-primary"
            )}
          >
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={resetTimer} 
            className="h-8 w-8"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="p-8 bg-gradient-to-br from-card to-card/50 border-2">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          {isBreak ? (
            <>
              <Coffee className="h-6 w-6 text-green-500 animate-pulse" />
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                Break Time - Relax! 🌟
              </span>
            </>
          ) : (
            <>
              <Zap className="h-6 w-6 text-orange-500" />
              <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                Focus Time - You Got This! 💪
              </span>
            </>
          )}
        </div>
        
        {settings.visualTimer && (
          <div className="relative w-48 h-48">
            <svg className="transform -rotate-90 w-48 h-48">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-muted opacity-20"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke={isBreak ? 'hsl(142, 76%, 36%)' : settings.timerColor}
                strokeWidth="12"
                fill="none"
                strokeDasharray={circumference * 1.95}
                strokeDashoffset={(circumference * 1.95) - (progress / 100) * (circumference * 1.95)}
                className="transition-all duration-1000 drop-shadow-lg"
                style={{ strokeLinecap: 'round' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div 
                className="font-mono text-5xl font-bold tabular-nums"
                style={{ color: settings.numberColor }}
              >
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {Math.ceil(timeLeft / 60)} minutes left
              </div>
            </div>
          </div>
        )}

        {!settings.visualTimer && (
          <div className="flex flex-col items-center gap-2">
            <div 
              className="font-mono text-7xl font-bold tabular-nums"
              style={{ color: settings.numberColor }}
            >
              {formatTime(timeLeft)}
            </div>
            <div className="text-base text-muted-foreground">
              {Math.ceil(timeLeft / 60)} minutes left
            </div>
          </div>
        )}

        <div className="flex gap-3 flex-wrap justify-center">
          <Button 
            onClick={toggleTimer} 
            size="lg"
            className={cn(
              "gap-2 min-w-[140px] transition-all shadow-lg",
              isRunning && "bg-primary/90"
            )}
          >
            {isRunning ? (
              <>
                <Pause className="h-5 w-5" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                {timeLeft === totalDuration ? 'Start' : 'Resume'}
              </>
            )}
          </Button>
          
          <Button 
            onClick={resetTimer} 
            variant="outline" 
            size="lg"
            className="gap-2 min-w-[140px]"
          >
            <RotateCcw className="h-5 w-5" />
            Reset
          </Button>
          
          <Button 
            onClick={isBreak ? skipToWork : skipToBreak} 
            variant="secondary" 
            size="lg"
            className="gap-2 min-w-[140px]"
          >
            <SkipForward className="h-5 w-5" />
            {isBreak ? 'Skip to Work' : 'Skip to Break'}
          </Button>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10">
            <span className="text-muted-foreground">Sessions:</span>
            <span className="font-bold text-lg">{sessionsCompleted}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50">
            <span className="text-muted-foreground">Next break:</span>
            <span className="font-bold">
              {settings.sessionsUntilLongBreak - (sessionsCompleted % settings.sessionsUntilLongBreak)} sessions
            </span>
          </div>
        </div>

        {!isRunning && timeLeft > 0 && (
          <div className="text-center text-sm text-muted-foreground animate-pulse">
            👆 Click Start to begin your focus session
          </div>
        )}
      </div>
    </Card>
  );
}
