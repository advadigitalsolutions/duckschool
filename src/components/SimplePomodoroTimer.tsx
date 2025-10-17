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
    resetTimer,
    settings
  } = usePomodoro();
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const progress = (totalDuration - timeLeft) / totalDuration * 100;
  const remainingProgress = 100 - progress;
  
  // Make timer responsive in compact mode
  const baseSize = compact ? 'min(60vw, 60vh, 400px)' : '320px';
  const radius = compact ? 45 : 120;
  const strokeWidth = compact ? 6 : 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress / 100 * circumference;
  
  // Wedge timer calculations
  const angle = (remainingProgress / 100) * 360;
  const endAngle = angle - 90; // Start from top
  const largeArcFlag = angle > 180 ? 1 : 0;
  const centerX = compact ? 64 : 160;
  const centerY = compact ? 64 : 160;
  const wedgeRadius = compact ? 58 : 150;
  
  const endX = centerX + wedgeRadius * Math.cos((endAngle * Math.PI) / 180);
  const endY = centerY + wedgeRadius * Math.sin((endAngle * Math.PI) / 180);
  
  // Gradient colors from settings or defaults
  const foregroundColor = settings?.timerForegroundColor || 'hsl(var(--primary))';
  const backgroundColor = settings?.timerBackgroundColor || 'hsl(var(--muted))';
  const timerStyle = settings?.timerStyle || 'doughnut';
  
  return <div className={cn("flex flex-col items-center justify-center min-h-screen gap-8", compact && "gap-4")}>
      {/* Visual Timer */}
      <div className="relative" style={{ width: baseSize, height: baseSize }}>
        {timerStyle === 'wedge' ? (
          <svg 
            className="w-full h-full" 
            viewBox={compact ? "0 0 128 128" : "0 0 320 320"}
          >
            <defs>
              <linearGradient id="wedgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={foregroundColor} stopOpacity="0.9" />
                <stop offset="50%" stopColor={foregroundColor} />
                <stop offset="100%" stopColor={foregroundColor} stopOpacity="1.2" />
              </linearGradient>
            </defs>
            
            {/* Background circle */}
            <circle 
              cx={centerX} 
              cy={centerY} 
              r={wedgeRadius} 
              fill={backgroundColor}
              stroke="currentColor"
              strokeWidth="3"
              className="text-foreground"
            />
            
            {/* Wedge */}
            {remainingProgress > 0 && (
              <path
                d={`
                  M ${centerX} ${centerY}
                  L ${centerX} ${centerY - wedgeRadius}
                  A ${wedgeRadius} ${wedgeRadius} 0 ${largeArcFlag} 1 ${endX} ${endY}
                  Z
                `}
                fill="url(#wedgeGradient)"
                className="transition-all duration-1000"
              />
            )}
            
            {/* Center dot */}
            <circle 
              cx={centerX} 
              cy={centerY} 
              r={compact ? 4 : 8}
              fill="#dc2626"
            />
            
            {/* Hand/pointer */}
            {remainingProgress > 0 && (
              <line
                x1={centerX}
                y1={centerY}
                x2={endX}
                y2={endY}
                stroke="#dc2626"
                strokeWidth={compact ? 3 : 6}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            )}
          </svg>
        ) : (
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
              stroke={backgroundColor}
              strokeWidth={strokeWidth} 
              fill="none" 
            />
            {/* Progress circle */}
            <circle 
              cx={compact ? 64 : 160} 
              cy={compact ? 64 : 160} 
              r={radius} 
              stroke={foregroundColor}
              strokeWidth={strokeWidth} 
              fill="none" 
              strokeDasharray={circumference} 
              strokeDashoffset={strokeDashoffset} 
              className="transition-all duration-1000 drop-shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)]"
              style={{ strokeLinecap: 'round' }} 
            />
          </svg>
        )}
        
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