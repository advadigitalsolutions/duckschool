import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface PomodoroTimerProps {
  settings: {
    workMinutes: number;
    breakMinutes: number;
    longBreakMinutes: number;
    sessionsUntilLongBreak: number;
    visualTimer: boolean;
    timerColor: string;
    numberColor: string;
  };
  compact?: boolean;
}

export function PomodoroTimer({ settings, compact = false }: PomodoroTimerProps) {
  const [timeLeft, setTimeLeft] = useState(settings.workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalDuration, setTotalDuration] = useState(settings.workMinutes * 60);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    
    if (!isBreak) {
      const newSessionCount = sessionsCompleted + 1;
      setSessionsCompleted(newSessionCount);
      
      const isLongBreak = newSessionCount % settings.sessionsUntilLongBreak === 0;
      const breakDuration = isLongBreak ? settings.longBreakMinutes : settings.breakMinutes;
      
      setTimeLeft(breakDuration * 60);
      setTotalDuration(breakDuration * 60);
      setIsBreak(true);
    } else {
      setTimeLeft(settings.workMinutes * 60);
      setTotalDuration(settings.workMinutes * 60);
      setIsBreak(false);
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    const duration = isBreak 
      ? (sessionsCompleted % settings.sessionsUntilLongBreak === 0 ? settings.longBreakMinutes : settings.breakMinutes) * 60
      : settings.workMinutes * 60;
    setTimeLeft(duration);
    setTotalDuration(duration);
  };

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
      <div className="flex items-center gap-2">
        {settings.visualTimer && (
          <div className="relative w-12 h-12">
            <svg className="transform -rotate-90 w-12 h-12">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke={settings.timerColor}
                strokeWidth="3"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000"
              />
            </svg>
          </div>
        )}
        <div 
          className="font-mono text-lg font-bold min-w-[4rem] text-center"
          style={{ color: settings.numberColor }}
        >
          {formatTime(timeLeft)}
        </div>
        <Button variant="ghost" size="icon" onClick={toggleTimer} className="h-8 w-8">
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={resetTimer} className="h-8 w-8">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center gap-4">
        <div className="text-sm font-medium text-muted-foreground">
          {isBreak ? '☕ Break Time' : '💪 Work Time'}
        </div>
        
        {settings.visualTimer && (
          <div className="relative w-32 h-32">
            <svg className="transform -rotate-90 w-32 h-32">
              <circle
                cx="64"
                cy="64"
                r="60"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="64"
                cy="64"
                r="60"
                stroke={settings.timerColor}
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000"
                style={{ strokeLinecap: 'round' }}
              />
            </svg>
            <div 
              className="absolute inset-0 flex items-center justify-center font-mono text-3xl font-bold"
              style={{ color: settings.numberColor }}
            >
              {formatTime(timeLeft)}
            </div>
          </div>
        )}

        {!settings.visualTimer && (
          <div 
            className="font-mono text-5xl font-bold"
            style={{ color: settings.numberColor }}
          >
            {formatTime(timeLeft)}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={toggleTimer} size="lg">
            {isRunning ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? 'Pause' : 'Start'}
          </Button>
          <Button onClick={resetTimer} variant="outline" size="lg">
            <RotateCcw className="mr-2 h-5 w-5" />
            Reset
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Sessions completed: {sessionsCompleted}
        </div>
      </div>
    </Card>
  );
}
