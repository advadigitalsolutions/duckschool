import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PomodoroSettings {
  workMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  sessionsUntilLongBreak: number;
  visualTimer: boolean;
  showTimeText: boolean;
  timerColor: string;
  numberColor: string;
  showMinutesInside: boolean;
  timerStyle: 'doughnut' | 'traditional';
  soundEffect: 'beep' | 'chime' | 'bell' | 'gong' | 'airhorn' | 'duck' | 'none';
}

interface PomodoroContextType {
  timeLeft: number;
  isRunning: boolean;
  isBreak: boolean;
  sessionsCompleted: number;
  totalDuration: number;
  settings: PomodoroSettings;
  toggleTimer: () => void;
  resetTimer: () => void;
  updateSettings: (settings: PomodoroSettings) => void;
  skipToBreak: () => void;
  skipToWork: () => void;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

const DEFAULT_SETTINGS: PomodoroSettings = {
  workMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  sessionsUntilLongBreak: 4,
  visualTimer: true,
  showTimeText: true,
  timerColor: 'hsl(var(--primary))',
  numberColor: 'hsl(var(--foreground))',
  showMinutesInside: true,
  timerStyle: 'doughnut',
  soundEffect: 'beep',
};

interface PomodoroProviderProps {
  children: React.ReactNode;
  studentId?: string;
}

export function PomodoroProvider({ children, studentId }: PomodoroProviderProps) {
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalDuration, setTotalDuration] = useState(DEFAULT_SETTINGS.workMinutes * 60);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [broadcastChannel, setBroadcastChannel] = useState<BroadcastChannel | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize: Load from Supabase if studentId provided, otherwise from localStorage
  useEffect(() => {
    const initialize = async () => {
      if (studentId) {
        await loadFromSupabase();
      } else {
        loadFromLocalStorage();
      }
      setIsInitializing(false);
    };

    // Set up BroadcastChannel for cross-window sync
    const channel = new BroadcastChannel('pomodoro_sync');
    setBroadcastChannel(channel);

    channel.onmessage = (event) => {
      const { type, data } = event.data;
      if (type === 'state_update' && !studentId) { // Only sync locally if not using Supabase
        setTimeLeft(data.timeLeft);
        setIsRunning(data.isRunning);
        setIsBreak(data.isBreak);
        setSessionsCompleted(data.sessionsCompleted);
        setTotalDuration(data.totalDuration);
        setSettings(data.settings);
      }
    };

    initialize();

    return () => {
      channel.close();
    };
  }, [studentId]);

  const loadFromSupabase = async () => {
    if (!studentId) return;

    try {
      const { data: session, error } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('Error loading session:', error);
        return;
      }

      if (session) {
        setSessionId(session.id);
        setTimeLeft(session.time_left);
        setIsRunning(session.is_running);
        setIsBreak(session.is_break);
        setSessionsCompleted(session.sessions_completed);
        const sessionSettings = session.settings as any;
        setSettings({ ...DEFAULT_SETTINGS, ...sessionSettings });
        setTotalDuration(session.is_break 
          ? (session.sessions_completed % sessionSettings.sessionsUntilLongBreak === 0
              ? sessionSettings.longBreakMinutes
              : sessionSettings.breakMinutes) * 60
          : sessionSettings.workMinutes * 60
        );
      } else {
        // Create new session
        const { data: newSession, error: createError } = await supabase
          .from('pomodoro_sessions')
          .insert([{
            student_id: studentId,
            time_left: DEFAULT_SETTINGS.workMinutes * 60,
            is_running: false,
            is_break: false,
            sessions_completed: 0,
            settings: DEFAULT_SETTINGS as any,
          }])
          .select()
          .single();

        if (createError) {
          console.error('Error creating session:', createError);
        } else if (newSession) {
          setSessionId(newSession.id);
        }
      }
    } catch (error) {
      console.error('Error in loadFromSupabase:', error);
    }
  };

  const loadFromLocalStorage = () => {
    const savedState = localStorage.getItem('pomodoroState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setTimeLeft(state.timeLeft || DEFAULT_SETTINGS.workMinutes * 60);
        setIsBreak(state.isBreak || false);
        setSessionsCompleted(state.sessionsCompleted || 0);
        setTotalDuration(state.totalDuration || DEFAULT_SETTINGS.workMinutes * 60);
        if (state.settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...state.settings });
        }
      } catch (error) {
        console.error('Error loading pomodoro state:', error);
      }
    }
  };

  // Set up Realtime subscription for Supabase sync
  useEffect(() => {
    if (!studentId) return;

    const channel = supabase
      .channel(`pomodoro_session_${studentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pomodoro_sessions',
          filter: `student_id=eq.${studentId}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const session = payload.new as any;
            setTimeLeft(session.time_left);
            setIsRunning(session.is_running);
            setIsBreak(session.is_break);
            setSessionsCompleted(session.sessions_completed);
            const sessionSettings = session.settings as any;
            setSettings({ ...DEFAULT_SETTINGS, ...sessionSettings });
            setTotalDuration(session.is_break 
              ? (session.sessions_completed % sessionSettings.sessionsUntilLongBreak === 0
                  ? sessionSettings.longBreakMinutes
                  : sessionSettings.breakMinutes) * 60
              : sessionSettings.workMinutes * 60
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  // Save state to Supabase or localStorage and broadcast to other windows
  useEffect(() => {
    if (isInitializing) return;

    const saveState = async () => {
      if (studentId && sessionId) {
        // Save to Supabase
        await supabase
          .from('pomodoro_sessions')
          .update({
            time_left: timeLeft,
            is_running: isRunning,
            is_break: isBreak,
            sessions_completed: sessionsCompleted,
            settings: settings as any,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId);
      } else {
        // Save to localStorage
        const state = {
          timeLeft,
          isBreak,
          sessionsCompleted,
          totalDuration,
          settings,
        };
        localStorage.setItem('pomodoroState', JSON.stringify(state));

        // Broadcast to other windows
        if (broadcastChannel) {
          broadcastChannel.postMessage({
            type: 'state_update',
            data: {
              timeLeft,
              isRunning,
              isBreak,
              sessionsCompleted,
              totalDuration,
              settings,
            }
          });
        }
      }
    };

    saveState();
  }, [timeLeft, isRunning, isBreak, sessionsCompleted, totalDuration, settings, studentId, sessionId, isInitializing, broadcastChannel]);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const playBeepSound = (audioContext: AudioContext) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    
    oscillator.start();
    setTimeout(() => oscillator.stop(), 200);
    
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      osc2.connect(gainNode);
      osc2.frequency.value = 1000;
      osc2.type = 'sine';
      osc2.start();
      setTimeout(() => osc2.stop(), 200);
    }, 300);
  };

  const playChimeSound = (audioContext: AudioContext) => {
    const frequencies = [523.25, 659.25, 783.99];
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 1);
      }, i * 150);
    });
  };

  const playBellSound = (audioContext: AudioContext) => {
    const frequencies = [800, 1000, 1200, 1500];
    frequencies.forEach((freq) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 2);
    });
  };

  const playGongSound = (audioContext: AudioContext) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 3);
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 3);
  };

  const playAirhornSound = (audioContext: AudioContext) => {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 220 + Math.random() * 50;
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
      }, i * 400);
    }
  };

  const playDuckSound = (audioContext: AudioContext) => {
    for (let i = 0; i < 2; i++) {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.15);
      }, i * 200);
    }
  };

  const playAlarmSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      switch (settings.soundEffect) {
        case 'beep':
          playBeepSound(audioContext);
          break;
        case 'chime':
          playChimeSound(audioContext);
          break;
        case 'bell':
          playBellSound(audioContext);
          break;
        case 'gong':
          playGongSound(audioContext);
          break;
        case 'airhorn':
          playAirhornSound(audioContext);
          break;
        case 'duck':
          playDuckSound(audioContext);
          break;
        case 'none':
          break;
      }
    } catch (e) {
      console.error('Failed to play alarm sound:', e);
    }
  };

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    playAlarmSound();
    
    // Flash the screen for Pomodoro completion
    const flashInterval = setInterval(() => {
      document.querySelector('header')?.classList.toggle('flash-rainbow');
    }, 300);
    setTimeout(() => {
      clearInterval(flashInterval);
      document.querySelector('header')?.classList.remove('flash-rainbow');
    }, 5000);
    
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
  }, [isBreak, sessionsCompleted, settings]);

  const toggleTimer = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    const duration = isBreak 
      ? (sessionsCompleted % settings.sessionsUntilLongBreak === 0 ? settings.longBreakMinutes : settings.breakMinutes) * 60
      : settings.workMinutes * 60;
    setTimeLeft(duration);
    setTotalDuration(duration);
  }, [isBreak, sessionsCompleted, settings]);

  const skipToBreak = useCallback(() => {
    setIsRunning(false);
    const newSessionCount = sessionsCompleted + 1;
    setSessionsCompleted(newSessionCount);
    
    const isLongBreak = newSessionCount % settings.sessionsUntilLongBreak === 0;
    const breakDuration = isLongBreak ? settings.longBreakMinutes : settings.breakMinutes;
    
    setTimeLeft(breakDuration * 60);
    setTotalDuration(breakDuration * 60);
    setIsBreak(true);
  }, [sessionsCompleted, settings]);

  const skipToWork = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(settings.workMinutes * 60);
    setTotalDuration(settings.workMinutes * 60);
    setIsBreak(false);
  }, [settings]);

  const updateSettings = useCallback((newSettings: PomodoroSettings) => {
    setSettings(newSettings);
    if (!isRunning) {
      const duration = isBreak 
        ? (sessionsCompleted % newSettings.sessionsUntilLongBreak === 0 ? newSettings.longBreakMinutes : newSettings.breakMinutes) * 60
        : newSettings.workMinutes * 60;
      setTimeLeft(duration);
      setTotalDuration(duration);
    }
  }, [isRunning, isBreak, sessionsCompleted]);

  const value = {
    timeLeft,
    isRunning,
    isBreak,
    sessionsCompleted,
    totalDuration,
    settings,
    toggleTimer,
    resetTimer,
    updateSettings,
    skipToBreak,
    skipToWork,
  };

  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
}
