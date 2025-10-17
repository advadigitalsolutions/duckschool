import { usePomodoro } from '@/contexts/PomodoroContext';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
interface SimplePomodoroTimerProps {
  studentId: string | null;
  compact?: boolean;
}
export function SimplePomodoroTimer({
  studentId,
  compact = false
}: SimplePomodoroTimerProps) {
  const {
    timeLeft,
    isRunning,
    isBreak,
    totalDuration,
    toggleTimer,
    resetTimer
  } = usePomodoro();
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const progress = (totalDuration - timeLeft) / totalDuration * 100;
  
  // Make timer responsive in compact mode
  const baseSize = compact ? 'min(60vw, 60vh, 400px)' : '320px';
  const radius = compact ? 45 : 120;
  const strokeWidth = compact ? 6 : 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress / 100 * circumference;
  
  return <div className={cn("flex flex-col items-center justify-center min-h-screen gap-8", compact && "gap-4")}>
      {/* Visual Timer */}
      <div className="relative" style={{ width: baseSize, height: baseSize }}>
        <svg 
          className="w-full h-full" 
          viewBox={compact ? "0 0 128 128" : "0 0 320 320"}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Background circle */}
          <circle 
            cx={compact ? 64 : 160} 
            cy={compact ? 64 : 160} 
            r={radius} 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            fill="none" 
            className="text-muted/20" 
          />
          {/* Progress circle */}
          <circle 
            cx={compact ? 64 : 160} 
            cy={compact ? 64 : 160} 
            r={radius} 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            fill="none" 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            className={cn(
              "transition-all duration-1000", 
              isBreak 
                ? "text-green-500 drop-shadow-[0_0_12px_rgba(34,197,94,0.5)]" 
                : "text-primary drop-shadow-[0_0_12px_hsl(var(--primary)/0.5)]"
            )} 
            style={{ strokeLinecap: 'round' }} 
          />
        </svg>
        
        {/* Time Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={cn(
            "font-mono font-bold tabular-nums",
            compact ? "text-[clamp(2rem,8vw,4rem)]" : "text-6xl",
            isBreak ? "text-green-600 dark:text-green-400" : "text-foreground"
          )}>
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Controls */}
      {!compact && <div className="flex gap-4">
          <Button onClick={toggleTimer} size="lg" className={cn("gap-2 min-w-[160px] shadow-lg transition-all duration-200", isRunning && "shadow-primary/50")}>
            {isRunning ? <>
                <Pause className="h-5 w-5" />
                Pause
              </> : <>
                <Play className="h-5 w-5" />
                {timeLeft === totalDuration ? 'Start Focus' : 'Resume'}
              </>}
          </Button>
          
          <Button onClick={resetTimer} variant="outline" size="lg" className="gap-2 min-w-[160px]">
            <RotateCcw className="h-5 w-5" />
            Reset
          </Button>
        </div>}

      {compact && <div className="flex gap-2">
          <Button onClick={toggleTimer} size="sm" variant="ghost">
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button onClick={resetTimer} size="sm" variant="ghost">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>}
    </div>;
}