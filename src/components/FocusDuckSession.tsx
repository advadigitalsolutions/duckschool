import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';
import { FocusJourneyDuck } from '@/components/FocusJourneyDuck';
import { Progress } from '@/components/ui/progress';
import { useActivitySession } from '@/hooks/useActivitySession';
import { requestScreenCaptureStream, captureFromStream, stopScreenCaptureStream } from '@/utils/screenCapture';
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
  const [screenCaptureStream, setScreenCaptureStream] = useState<MediaStream | null>(null);
  const [hasScreenCaptureConsent, setHasScreenCaptureConsent] = useState(false);
  
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
    
    console.log(`🦆 Next accountability check scheduled in ${delaySeconds} seconds (${Math.round(delaySeconds/60)} minutes)`);
    
    const timerId = setTimeout(() => {
      console.log('🦆 Accountability check triggered!');
      triggerAccountabilityCheck();
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
      // If we don't have consent or stream yet, request it
      if (!hasScreenCaptureConsent || !screenCaptureStream) {
        console.log('📸 Requesting screen capture consent...');
        try {
          const stream = await requestScreenCaptureStream();
          setScreenCaptureStream(stream);
          setHasScreenCaptureConsent(true);
          
          // Monitor if user stops sharing
          stream.getVideoTracks()[0].addEventListener('ended', () => {
            console.log('📸 User stopped screen sharing');
            setScreenCaptureStream(null);
            setHasScreenCaptureConsent(false);
            toast.error('Screen sharing stopped. Accountability checks paused.');
          });
        } catch (error) {
          console.error('❌ Failed to get screen capture consent:', error);
          toast.error('Screen sharing permission denied. Accountability checks will not work.');
          throw error;
        }
      }

      console.log('📸 Capturing screenshot from stream...');
      const screenshot = await captureFromStream(screenCaptureStream!);
      
      // Get penalty setting from localStorage
      const settings = JSON.parse(localStorage.getItem('focusDuckSettings') || '{}');
      const applyPenalties = settings.applyPenalties || false;
      
      console.log('🤖 Sending to AI for analysis...');
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

  // Cleanup timers and streams on unmount
  useEffect(() => {
    return () => {
      if (accountabilityTimerId) {
        clearTimeout(accountabilityTimerId);
      }
      // Clean up screen capture stream
      if (screenCaptureStream) {
        stopScreenCaptureStream(screenCaptureStream);
      }
    };
  }, [accountabilityTimerId, screenCaptureStream]);

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
      console.log('🦆 Accountability mode enabled - starting check cycle');
      scheduleNextCheck();
    } else {
      console.log('🦆 Accountability mode disabled');
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
    
    // Stop screen capture when resetting
    if (screenCaptureStream) {
      stopScreenCaptureStream(screenCaptureStream);
      setScreenCaptureStream(null);
      setHasScreenCaptureConsent(false);
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
          <div className="pt-6 relative">
            <Progress value={progress} className="h-6" />
            {/* Intense blur effect under duck */}
            <div 
              className="absolute top-0 h-6 w-32 transition-all duration-1000 ease-out pointer-events-none"
              style={{ 
                left: `${Math.min(progress, 95)}%`,
                transform: 'translateX(-50%)',
                background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 40%, transparent 80%)',
                filter: 'blur(20px)',
                mixBlendMode: 'soft-light'
              }}
            />
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
                  Clicking "Yes" will share your screen once per session for accountability checks
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
              <div className="relative">
                <Progress 
                  value={progress} 
                  className="h-8"
                  variant={duckState === 'celebrating' ? 'success' : 'default'}
                />
                {/* Intense blur effect under duck */}
                <div 
                  className="absolute top-0 h-8 w-40 transition-all duration-1000 ease-out pointer-events-none"
                  style={{ 
                    left: `${Math.min(progress, 95)}%`,
                    transform: 'translateX(-50%)',
                    background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.3) 40%, transparent 80%)',
                    filter: 'blur(25px)',
                    mixBlendMode: 'soft-light'
                  }}
                />
              </div>
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
