import { usePomodoro } from '@/contexts/PomodoroContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, RotateCcw, SkipForward, Coffee, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PomodoroTimerProps {
  compact?: boolean;
  onTimeClick?: () => void;
}

export function PomodoroTimer({ compact = false, onTimeClick }: PomodoroTimerProps) {
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
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  // For kitchen timer: start at 0% (small gap at top) and fill to 100% (complete circle)
  const filledCircumference = (progress / 100) * circumference;

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
            {settings.timerStyle === 'doughnut' ? (
              <>
                <svg className="w-10 h-10" style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    cx="20"
                    cy="20"
                    r={radius}
                    stroke={settings.timerBackgroundColor}
                    strokeWidth="2.5"
                    fill="none"
                    opacity="0.3"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r={radius}
                    stroke={isBreak ? 'hsl(142, 76%, 36%)' : settings.timerForegroundColor}
                    strokeWidth="2.5"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - filledCircumference}
                    className="transition-all duration-1000"
                    style={{ strokeLinecap: 'round' }}
                  />
                </svg>
                {settings.showMinutesInside && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold cursor-pointer hover:scale-110 transition-transform"
                    style={{ color: settings.numberColor }}
                    onClick={onTimeClick}
                    title="Click to adjust timer settings"
                  >
                    {Math.ceil(timeLeft / 60)}
                  </div>
                )}
              </>
            ) : (
              <div 
                className="transform -rotate-90 w-10 h-10 cursor-pointer hover:scale-110 transition-transform"
                onClick={onTimeClick}
              >
                <svg className="w-10 h-10">
                  <circle cx="20" cy="20" r="19" fill="currentColor" className="text-muted opacity-20" />
                  <path
                    d={`M 20 20 L 20 1 A 19 19 0 ${progress > 50 ? 1 : 0} 1 ${
                      20 + 19 * Math.sin((progress / 100) * 2 * Math.PI)
                    } ${20 - 19 * Math.cos((progress / 100) * 2 * Math.PI)} Z`}
                    fill={isBreak ? 'hsl(142, 76%, 36%)' : settings.timerColor}
                    className="transition-all duration-1000"
                  />
                  <circle cx="20" cy="20" r="2" fill="currentColor" className="text-background" />
                </svg>
              </div>
            )}
          </div>
        )}
        
        {settings.showTimeText && (
          <div 
            className="font-mono text-base font-bold tabular-nums cursor-pointer hover:text-primary transition-colors"
            style={{ color: settings.numberColor }}
            onClick={onTimeClick}
            title="Click to adjust timer settings"
          >
            {formatTime(timeLeft)}
          </div>
        )}
        
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
            {settings.timerStyle === 'doughnut' ? (
              <>
                <svg className="w-48 h-48" style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke={settings.timerBackgroundColor}
                    strokeWidth="12"
                    fill="none"
                    opacity="0.3"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke={isBreak ? 'hsl(142, 76%, 36%)' : settings.timerForegroundColor}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 88}
                    strokeDashoffset={2 * Math.PI * 88 - (progress / 100) * 2 * Math.PI * 88}
                    className="transition-all duration-1000 drop-shadow-lg"
                    style={{ strokeLinecap: 'round' }}
                  />
                </svg>
                {settings.showTimeText && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform" onClick={onTimeClick} title="Click to adjust timer settings">
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
                )}
              </>
            ) : (
              <>
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle cx="96" cy="96" r="93" fill="currentColor" className="text-muted opacity-20" />
                  <path
                    d={`M 96 96 L 96 3 A 93 93 0 ${progress > 50 ? 1 : 0} 1 ${
                      96 + 93 * Math.sin((progress / 100) * 2 * Math.PI)
                    } ${96 - 93 * Math.cos((progress / 100) * 2 * Math.PI)} Z`}
                    fill={isBreak ? 'hsl(142, 76%, 36%)' : settings.timerColor}
                    className="transition-all duration-1000 drop-shadow-lg"
                  />
                  <circle cx="96" cy="96" r="6" fill="currentColor" className="text-background" />
                  {/* Clock tick marks and numbers */}
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((num, i) => {
                    const angle = (i * 30) * (Math.PI / 180);
                    const x = 96 + 78 * Math.sin(angle);
                    const y = 96 - 78 * Math.cos(angle);
                    return (
                      <text
                        key={num}
                        x={x}
                        y={y + 4}
                        textAnchor="middle"
                        className="text-[10px] font-semibold fill-current"
                      >
                        {num}
                      </text>
                    );
                  })}
                </svg>
                {settings.showTimeText && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform" onClick={onTimeClick} title="Click to adjust timer settings">
                    <div 
                      className="font-mono text-4xl font-bold tabular-nums"
                      style={{ color: settings.numberColor }}
                    >
                      {formatTime(timeLeft)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      {Math.ceil(timeLeft / 60)} minutes left
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {!settings.visualTimer && settings.showTimeText && (
          <div className="flex flex-col items-center gap-2 cursor-pointer hover:scale-105 transition-transform" onClick={onTimeClick} title="Click to adjust timer settings">
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
