import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface PomodoroSettings {
  workMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  sessionsUntilLongBreak: number;
  visualTimer: boolean;
  timerColor: string;
  numberColor: string;
  showMinutesInside: boolean;
  timerStyle: 'doughnut' | 'traditional';
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
  timerColor: 'hsl(var(--primary))',
  numberColor: 'hsl(var(--foreground))',
  showMinutesInside: true,
  timerStyle: 'doughnut',
};

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  // Load state from localStorage
  const loadState = () => {
    try {
      const saved = localStorage.getItem('pomodoroState');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          timeLeft: parsed.timeLeft || DEFAULT_SETTINGS.workMinutes * 60,
          isBreak: parsed.isBreak || false,
          sessionsCompleted: parsed.sessionsCompleted || 0,
          totalDuration: parsed.totalDuration || DEFAULT_SETTINGS.workMinutes * 60,
          settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
        };
      }
    } catch (e) {
      console.error('Failed to load pomodoro state:', e);
    }
    return {
      timeLeft: DEFAULT_SETTINGS.workMinutes * 60,
      isBreak: false,
      sessionsCompleted: 0,
      totalDuration: DEFAULT_SETTINGS.workMinutes * 60,
      settings: DEFAULT_SETTINGS,
    };
  };

  const initialState = loadState();
  const [timeLeft, setTimeLeft] = useState(initialState.timeLeft);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(initialState.isBreak);
  const [sessionsCompleted, setSessionsCompleted] = useState(initialState.sessionsCompleted);
  const [totalDuration, setTotalDuration] = useState(initialState.totalDuration);
  const [settings, setSettings] = useState<PomodoroSettings>(initialState.settings);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const state = {
      timeLeft,
      isBreak,
      sessionsCompleted,
      totalDuration,
      settings,
    };
    localStorage.setItem('pomodoroState', JSON.stringify(state));
  }, [timeLeft, isBreak, sessionsCompleted, totalDuration, settings]);

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

  const playAlarmSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      
      oscillator.start();
      setTimeout(() => oscillator.stop(), 200);
      
      // Second beep
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        osc2.connect(gainNode);
        osc2.frequency.value = 1000;
        osc2.type = 'sine';
        osc2.start();
        setTimeout(() => osc2.stop(), 200);
      }, 300);
    } catch (e) {
      console.error('Failed to play alarm sound:', e);
    }
  };

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    playAlarmSound();
    
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
    // If timer is not running, update duration to match new settings
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
