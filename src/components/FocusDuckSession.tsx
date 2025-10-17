import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';
import { FocusJourneyDuck } from '@/components/FocusJourneyDuck';
import { Progress } from '@/components/ui/progress';
import { useActivitySession } from '@/hooks/useActivitySession';
import { captureCurrentWindow } from '@/utils/screenCapture';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FocusDuckSessionProps {
  studentId: string | null;
  compact?: boolean;
}

export function FocusDuckSession({ studentId, compact = false }: FocusDuckSessionProps) {
  const [goal, setGoal] = useState('');
  const [duration, setDuration] = useState(45); // minutes
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration * 60); // seconds
  const [duckState, setDuckState] = useState<'idle' | 'walking' | 'celebrating'>('idle');
  const [accountabilityEnabled, setAccountabilityEnabled] = useState(false);
  const [showAccountabilityCheck, setShowAccountabilityCheck] = useState(false);
  const [accountabilityTimerId, setAccountabilityTimerId] = useState<NodeJS.Timeout | null>(null);
  
  const { sessionId, createSession, endSession } = useActivitySession(studentId || undefined);

  // Load accountability setting
  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem('focusDuckSettings') || '{}');
    setAccountabilityEnabled(settings.accountabilityEnabled || false);
  }, []);

  // Schedule random accountability check
  const scheduleNextCheck = () => {
    if (accountabilityTimerId) {
      clearTimeout(accountabilityTimerId);
    }
    
    // Random delay between 30 seconds and 5 minutes (300 seconds)
    const delaySeconds = Math.floor(Math.random() * 271) + 30;
    const delayMs = delaySeconds * 1000;
    
    console.log(`Next accountability check in ${delaySeconds} seconds`);
    
    const timerId = setTimeout(() => {
      if (isActive) {
        triggerAccountabilityCheck();
      }
    }, delayMs);
    
    setAccountabilityTimerId(timerId);
  };

  const triggerAccountabilityCheck = () => {
    setIsActive(false); // Auto-pause timer
    setDuckState('idle');
    setShowAccountabilityCheck(true);
  };

  const handleAccountabilityResponse = async (response: 'yes' | 'no') => {
    setShowAccountabilityCheck(false);
    
    if (response === 'no') {
      // User acknowledges they're taking a break
      // Timer stays paused (already paused)
      toast.info('Taking a break? Resume when ready! 🦆');
      return;
    }
    
    if (response === 'yes') {
      // Resume timer first
      setIsActive(true);
      setDuckState('walking');
      
      // Capture and analyze
      try {
        await captureAndAnalyze();
      } catch (error) {
        console.error('Screenshot capture failed:', error);
        toast.error('Screenshot check failed. Continuing session...');
      }
      
      // Schedule next random check
      scheduleNextCheck();
    }
  };

  const captureAndAnalyze = async () => {
    try {
      const screenshot = await captureCurrentWindow();
      
      // Get penalty setting from localStorage
      const settings = JSON.parse(localStorage.getItem('focusDuckSettings') || '{}');
      const applyPenalties = settings.applyPenalties || false;
      
      const { data, error } = await supabase.functions.invoke('analyze-focus-screenshot', {
        body: {
          screenshot,
          goal,
          student_id: studentId,
          session_id: sessionId,
          apply_penalties: applyPenalties
        }
      });
      
      if (error) throw error;
      
      // Show feedback
      if (data.on_track) {
        toast.success(`${data.message} +${data.xp_awarded} XP ⭐`, { duration: 5000 });
      } else {
        toast.error(`${data.message} ${data.xp_awarded} XP ⚠️`, { duration: 5000 });
      }
      
    } catch (error: any) {
      console.error('Analysis failed:', error);
      throw error;
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (accountabilityTimerId) {
        clearTimeout(accountabilityTimerId);
      }
    };
  }, [accountabilityTimerId]);

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
    setDuckState('walking');
    
    // Start accountability check cycle if enabled
    if (accountabilityEnabled) {
      scheduleNextCheck();
    }
  };

  const handlePause = () => {
    setIsActive(false);
    setDuckState('idle');
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(duration * 60);
    setDuckState('idle');
    setShowAccountabilityCheck(false);
    
    // Clear accountability timer
    if (accountabilityTimerId) {
      clearTimeout(accountabilityTimerId);
      setAccountabilityTimerId(null);
    }
    
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
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8">
        {/* Duck walking along progress */}
        <div className="relative w-full max-w-md">
          <div className="pt-6">
            <Progress value={progress} className="h-3" />
          </div>
          <div 
            className="absolute transition-all duration-1000 ease-out"
            style={{ 
              left: `${Math.min(progress, 95)}%`,
              transform: 'translateX(-50%)',
              bottom: '0px'
            }}
          >
            <FocusJourneyDuck
              animationState={duckState === 'celebrating' ? 'celebrating' : isActive ? 'walking' : 'idle'}
              onAnimationComplete={() => {}}
              onStateChange={() => {}}
            />
          </div>
        </div>

        {/* Timer Display */}
        <div className="text-center">
          <div className="text-5xl font-mono font-bold tabular-nums">
            {formatTime(timeLeft)}
          </div>
          {goal && (
            <div className="text-sm text-muted-foreground mt-2">
              {goal}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isActive || duckState === 'celebrating') {
    return (
      <>
        {/* Accountability Check Modal */}
        {showAccountabilityCheck && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="p-8 max-w-md mx-auto shadow-2xl border-2 border-primary animate-in fade-in zoom-in duration-300">
              <div className="text-center space-y-6">
                <div className="text-6xl">🦆</div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Accountability Check!</h3>
                  <p className="text-lg text-muted-foreground">
                    Working on your goal?
                  </p>
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="font-semibold text-primary">{goal}</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <Button
                    onClick={() => handleAccountabilityResponse('no')}
                    variant="outline"
                    size="lg"
                    className="flex-1 text-lg h-14 flex-col gap-1"
                  >
                    <span>No</span>
                    <span className="text-xs opacity-70">Taking a break</span>
                  </Button>
                  <Button
                    onClick={() => handleAccountabilityResponse('yes')}
                    size="lg"
                    className="flex-1 text-lg h-14 flex-col gap-1"
                  >
                    <span>Yes</span>
                    <span className="text-xs opacity-70">Check my screen</span>
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Clicking "Yes" will capture your current window for AI analysis
                </p>
              </div>
            </Card>
          </div>
        )}

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
          <div className="relative">
            <div className="pt-6 space-y-3">
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
            <div 
              className="absolute transition-all duration-1000 ease-out z-10"
              style={{ 
                left: `${Math.min(progress, 95)}%`,
                transform: 'translateX(-50%)',
                top: '0px'
              }}
            >
              <FocusJourneyDuck
                animationState={duckState === 'celebrating' ? 'celebrating' : isActive ? 'walking' : 'idle'}
                onAnimationComplete={() => {}}
                onStateChange={() => {}}
              />
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

        </div>
      </>
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
