import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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
          // No sound
          break;
      }
    } catch (e) {
      console.error('Failed to play alarm sound:', e);
    }
  };

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
    
    // Second beep
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
    const frequencies = [523.25, 659.25, 783.99]; // C, E, G chord
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
    // Quack sound effect using multiple oscillators
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
