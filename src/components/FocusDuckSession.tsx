import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';
import { FocusJourneyDuck } from '@/components/FocusJourneyDuck';
import { Progress } from '@/components/ui/progress';
import { useActivitySession } from '@/hooks/useActivitySession';
import { useWindowVisibility } from '@/hooks/useWindowVisibility';
import { useIdleDetection } from '@/hooks/useIdleDetection';
import { cn } from '@/lib/utils';

interface FocusDuckSessionProps {
  studentId: string | null;
  compact?: boolean;
}

export function FocusDuckSession({ studentId, compact = false }: FocusDuckSessionProps) {
  const [goal, setGoal] = useState('');
  const [duration, setDuration] = useState(45); // minutes
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration * 60); // seconds
  const [duckState, setDuckState] = useState<'idle' | 'climbing' | 'celebrating' | 'fallen'>('idle');
  
  const { sessionId, createSession, endSession } = useActivitySession(studentId || undefined);
  const { isVisible } = useWindowVisibility();
  
  const { isIdle, isWarning } = useIdleDetection({
    warningThreshold: 45, // 45 seconds warning
    idleThreshold: 60, // 1 minute until idle
    onIdle: () => {
      if (isActive && duckState === 'climbing') {
        setDuckState('fallen');
      }
    },
    onActive: () => {
      if (duckState === 'fallen') {
        setDuckState('climbing');
      }
    }
  });

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsActive(false);
          setDuckState('celebrating');
          if (sessionId) {
            endSession('block_complete');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, sessionId, endSession]);

  const handleStart = () => {
    if (!goal.trim()) return;
    
    if (!sessionId) {
      createSession();
    }
    
    setIsActive(true);
    setDuckState('climbing');
  };

  const handlePause = () => {
    setIsActive(false);
    setDuckState('idle');
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(duration * 60);
    setDuckState('idle');
    if (sessionId) {
      endSession('manual');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-4">
        <FocusJourneyDuck
          animationState={duckState}
          onAnimationComplete={() => {}}
          onStateChange={(state) => setDuckState(state as any)}
        />
        <div className="w-full max-w-xs">
          <Progress value={progress} className="h-2" />
        </div>
        <div className="text-sm font-mono">{formatTime(timeLeft)}</div>
      </div>
    );
  }

  if (isActive || duckState === 'celebrating') {
    return (
      <div className="flex flex-col items-center gap-8">
        {/* Goal Display */}
        <Card className="p-4 bg-primary/5 border-primary/20 w-full max-w-2xl">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Current Goal</div>
            <div className="text-lg font-semibold">{goal}</div>
          </div>
        </Card>

        {/* Duck and Progress */}
        <div className="relative w-full max-w-2xl">
          <FocusJourneyDuck
            animationState={duckState}
            onAnimationComplete={() => {}}
            onStateChange={(state) => setDuckState(state as any)}
          />
          
          <div className="mt-8 space-y-3">
            <Progress 
              value={progress} 
              className="h-4"
              variant={duckState === 'celebrating' ? 'success' : 'default'}
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-mono font-semibold">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>

        {/* Time and Controls */}
        <div className="flex flex-col items-center gap-6">
          <div className="text-center">
            <div className="text-6xl font-mono font-bold tabular-nums">
              {formatTime(timeLeft)}
            </div>
            <div className="text-muted-foreground mt-2">
              {Math.ceil(timeLeft / 60)} minutes remaining
            </div>
          </div>

          {duckState === 'celebrating' ? (
            <Button
              onClick={handleReset}
              size="lg"
              className="gap-2 min-w-[200px]"
            >
              <CheckCircle2 className="h-5 w-5" />
              Start New Session
            </Button>
          ) : (
            <div className="flex gap-4">
              <Button
                onClick={isActive ? handlePause : handleStart}
                size="lg"
                className="gap-2 min-w-[160px]"
              >
                {isActive ? (
                  <>
                    <Pause className="h-5 w-5" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    Resume
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleReset}
                variant="outline"
                size="lg"
                className="gap-2 min-w-[160px]"
              >
                <RotateCcw className="h-5 w-5" />
                Reset
              </Button>
            </div>
          )}
        </div>

        {/* Status Indicators */}
        {isActive && (
          <div className="flex gap-4 text-sm">
            <div className={cn(
              "px-4 py-2 rounded-full",
              isIdle ? "bg-destructive/10 text-destructive" :
              isWarning ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" :
              "bg-green-500/10 text-green-600 dark:text-green-400"
            )}>
              {isIdle ? '⚠️ Away' : isWarning ? '⏰ Stay Focused' : '✅ Active'}
            </div>
            {!isVisible && (
              <div className="px-4 py-2 rounded-full bg-muted text-muted-foreground">
                👁️ Tab Hidden
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Setup view
  return (
    <Card className="p-8 bg-gradient-to-br from-accent/5 to-primary/5 border-2 max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Set Your Focus Goal</h2>
          <p className="text-muted-foreground">
            What would you like to accomplish in this session?
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal">Your Goal</Label>
            <Input
              id="goal"
              placeholder="e.g., Complete math homework, Read chapter 5..."
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Session Duration (minutes)</Label>
            <div className="flex items-center gap-4">
              <Input
                id="duration"
                type="number"
                min="5"
                max="120"
                value={duration}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setDuration(val);
                  setTimeLeft(val * 60);
                }}
                className="text-base w-24"
              />
              <span className="text-sm text-muted-foreground">
                This session only (won't change your default)
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={handleStart}
          disabled={!goal.trim()}
          size="lg"
          className="w-full gap-2 text-lg h-14"
        >
          <Play className="h-6 w-6" />
          Start Focus Session
        </Button>
      </div>
    </Card>
  );
}
