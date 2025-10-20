import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AccessibilitySettings {
  dyslexiaFontEnabled: boolean;
  lineSpacing: 'normal' | '1.5x' | '2x';
  letterSpacing: 'normal' | 'wide' | 'wider';
  colorOverlay: 'none' | 'cream' | 'mint' | 'lavender' | 'peach' | 'aqua';
  focusModeEnabled: boolean;
  focusModeOverlayOpacity: number;
  focusModeGlowColor: string;
  focusModeGlowIntensity: number;
  readingRulerEnabled: boolean;
  textToSpeechEnabled: boolean;
  textToSpeechVoice: string;
  highContrastEnabled: boolean;
  showTimeEstimates: boolean;
}

interface AccessibilityContextType extends AccessibilitySettings {
  setDyslexiaFont: (enabled: boolean) => Promise<void>;
  setLineSpacing: (spacing: 'normal' | '1.5x' | '2x') => Promise<void>;
  setLetterSpacing: (spacing: 'normal' | 'wide' | 'wider') => Promise<void>;
  setColorOverlay: (overlay: 'none' | 'cream' | 'mint' | 'lavender' | 'peach' | 'aqua') => Promise<void>;
  setFocusMode: (enabled: boolean) => Promise<void>;
  setFocusModeOverlayOpacity: (opacity: number) => Promise<void>;
  setFocusModeGlowColor: (color: string) => Promise<void>;
  setFocusModeGlowIntensity: (intensity: number) => Promise<void>;
  setReadingRuler: (enabled: boolean) => Promise<void>;
  setTextToSpeech: (enabled: boolean) => Promise<void>;
  setTextToSpeechVoice: (voice: string) => Promise<void>;
  setHighContrast: (enabled: boolean) => Promise<void>;
  setShowTimeEstimates: (enabled: boolean) => Promise<void>;
  hotkeys: Record<string, string>;
  loadHotkeys: () => Promise<void>;
  availableVoices: SpeechSynthesisVoice[];
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    dyslexiaFontEnabled: false,
    lineSpacing: 'normal',
    letterSpacing: 'normal',
    colorOverlay: 'none',
    focusModeEnabled: false,
    focusModeOverlayOpacity: 70,
    focusModeGlowColor: 'yellow',
    focusModeGlowIntensity: 100,
    readingRulerEnabled: false,
    textToSpeechEnabled: false,
    textToSpeechVoice: '',
    highContrastEnabled: false,
    showTimeEstimates: true,
  });
  const [hotkeys, setHotkeys] = useState<Record<string, string>>({});
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const { toast } = useToast();

  // Load available system voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      setAvailableVoices(voices);
      
      // Set default voice to first English voice if none selected
      if (!settings.textToSpeechVoice && voices.length > 0) {
        const defaultVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
        if (defaultVoice) {
          setSettings(prev => ({ ...prev, textToSpeechVoice: defaultVoice.name }));
        }
      }
    };

    if (window.speechSynthesis) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  useEffect(() => {
    // Load settings on mount
    loadSettings();
    loadHotkeys();

    // Listen for auth changes to reload settings
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Reset to defaults when user signs out
        setSettings({
          dyslexiaFontEnabled: false,
          lineSpacing: 'normal',
          letterSpacing: 'normal',
          colorOverlay: 'none',
          focusModeEnabled: false,
          focusModeOverlayOpacity: 70,
          focusModeGlowColor: 'yellow',
          focusModeGlowIntensity: 100,
          readingRulerEnabled: false,
          textToSpeechEnabled: false,
          textToSpeechVoice: '',
          highContrastEnabled: false,
          showTimeEstimates: true,
        });
        setHotkeys({});
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Reload settings when user signs in or token refreshes
        loadSettings();
        loadHotkeys();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    applyGlobalStyles();
  }, [settings]);

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Try student table first
    const { data: student } = await supabase
      .from('students')
      .select('dyslexia_font_enabled, line_spacing, letter_spacing, color_overlay, focus_mode_enabled, focus_mode_overlay_opacity, focus_mode_glow_color, focus_mode_glow_intensity, reading_ruler_enabled, text_to_speech_enabled, text_to_speech_voice, high_contrast_enabled, show_time_estimates')
      .eq('user_id', user.id)
      .maybeSingle();

    if (student) {
      setSettings({
        dyslexiaFontEnabled: student.dyslexia_font_enabled || false,
        lineSpacing: student.line_spacing as any || 'normal',
        letterSpacing: student.letter_spacing as any || 'normal',
        colorOverlay: student.color_overlay as any || 'none',
        focusModeEnabled: student.focus_mode_enabled || false,
        focusModeOverlayOpacity: student.focus_mode_overlay_opacity || 70,
        focusModeGlowColor: student.focus_mode_glow_color || 'yellow',
        focusModeGlowIntensity: student.focus_mode_glow_intensity || 100,
        readingRulerEnabled: student.reading_ruler_enabled || false,
        textToSpeechEnabled: student.text_to_speech_enabled || false,
        textToSpeechVoice: student.text_to_speech_voice as string || '',
        highContrastEnabled: student.high_contrast_enabled || false,
        showTimeEstimates: student.show_time_estimates ?? true,
      });
      return;
    }

    // If not a student, try profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('dyslexia_font_enabled, line_spacing, letter_spacing, color_overlay, focus_mode_enabled, focus_mode_overlay_opacity, focus_mode_glow_color, focus_mode_glow_intensity, reading_ruler_enabled, text_to_speech_enabled, text_to_speech_voice, high_contrast_enabled, show_time_estimates')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      setSettings({
        dyslexiaFontEnabled: profile.dyslexia_font_enabled || false,
        lineSpacing: profile.line_spacing as any || 'normal',
        letterSpacing: profile.letter_spacing as any || 'normal',
        colorOverlay: profile.color_overlay as any || 'none',
        focusModeEnabled: profile.focus_mode_enabled || false,
        focusModeOverlayOpacity: profile.focus_mode_overlay_opacity || 70,
        focusModeGlowColor: profile.focus_mode_glow_color || 'yellow',
        focusModeGlowIntensity: profile.focus_mode_glow_intensity || 100,
        readingRulerEnabled: profile.reading_ruler_enabled || false,
        textToSpeechEnabled: profile.text_to_speech_enabled || false,
        textToSpeechVoice: profile.text_to_speech_voice as string || '',
        highContrastEnabled: profile.high_contrast_enabled || false,
        showTimeEstimates: profile.show_time_estimates ?? true,
      });
    }
  };

  const applyGlobalStyles = () => {
    const body = document.body;
    const root = document.documentElement;
    
    // Font
    body.classList.toggle('dyslexia-font', settings.dyslexiaFontEnabled);
    
    // Line spacing
    body.classList.remove('line-spacing-relaxed', 'line-spacing-spacious');
    if (settings.lineSpacing === '1.5x') body.classList.add('line-spacing-relaxed');
    if (settings.lineSpacing === '2x') body.classList.add('line-spacing-spacious');
    
    // Letter spacing
    body.classList.remove('letter-spacing-wide', 'letter-spacing-wider');
    if (settings.letterSpacing === 'wide') body.classList.add('letter-spacing-wide');
    if (settings.letterSpacing === 'wider') body.classList.add('letter-spacing-wider');
    
    // Color overlay - apply to root for CSS variable override
    root.classList.remove('color-overlay-cream', 'color-overlay-mint', 'color-overlay-lavender', 'color-overlay-peach', 'color-overlay-aqua');
    if (settings.colorOverlay !== 'none') {
      root.classList.add(`color-overlay-${settings.colorOverlay}`);
    }
    
    // High contrast
    root.classList.toggle('high-contrast', settings.highContrastEnabled);
    
    // Focus mode - set CSS variables and classes for customization
    body.classList.toggle('focus-mode', settings.focusModeEnabled);
    root.style.setProperty('--focus-overlay-opacity', `${settings.focusModeOverlayOpacity / 100}`);
    
    // Only apply glow intensity if focus mode is enabled
    if (settings.focusModeEnabled) {
      root.style.setProperty('--focus-glow-intensity', `${settings.focusModeGlowIntensity / 100}`);
    } else {
      root.style.setProperty('--focus-glow-intensity', '0');
    }
    
    // Remove all glow color classes
    body.classList.remove('focus-glow-yellow', 'focus-glow-blue', 'focus-glow-green', 'focus-glow-purple', 'focus-glow-red', 'focus-glow-rainbow', 'focus-glow-trans', 'focus-glow-none');
    if (settings.focusModeEnabled && settings.focusModeGlowColor !== 'yellow') {
      body.classList.add(`focus-glow-${settings.focusModeGlowColor}`);
    }
  };

  const updateSetting = async (field: string, value: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Try to update student table first
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (student) {
      const { error } = await supabase
        .from('students')
        .update({ [field]: value })
        .eq('id', student.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save accessibility setting",
          variant: "destructive",
        });
      }
      return;
    }

    // If not a student, update profiles table
    const { error } = await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('id', user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save accessibility setting",
        variant: "destructive",
      });
    }
  };

  const setDyslexiaFont = async (enabled: boolean) => {
    setSettings(prev => ({ ...prev, dyslexiaFontEnabled: enabled }));
    await updateSetting('dyslexia_font_enabled', enabled);
  };

  const setLineSpacing = async (spacing: 'normal' | '1.5x' | '2x') => {
    setSettings(prev => ({ ...prev, lineSpacing: spacing }));
    await updateSetting('line_spacing', spacing);
  };

  const setLetterSpacing = async (spacing: 'normal' | 'wide' | 'wider') => {
    setSettings(prev => ({ ...prev, letterSpacing: spacing }));
    await updateSetting('letter_spacing', spacing);
  };

  const setColorOverlay = async (overlay: 'none' | 'cream' | 'mint' | 'lavender' | 'peach' | 'aqua') => {
    setSettings(prev => ({ ...prev, colorOverlay: overlay }));
    await updateSetting('color_overlay', overlay);
  };

  const setFocusMode = async (enabled: boolean) => {
    setSettings(prev => ({ ...prev, focusModeEnabled: enabled }));
    await updateSetting('focus_mode_enabled', enabled);
  };

  const setFocusModeOverlayOpacity = async (opacity: number) => {
    setSettings(prev => ({ ...prev, focusModeOverlayOpacity: opacity }));
    await updateSetting('focus_mode_overlay_opacity', opacity);
  };

  const setFocusModeGlowColor = async (color: string) => {
    setSettings(prev => ({ ...prev, focusModeGlowColor: color }));
    await updateSetting('focus_mode_glow_color', color);
  };

  const setFocusModeGlowIntensity = async (intensity: number) => {
    setSettings(prev => ({ ...prev, focusModeGlowIntensity: intensity }));
    await updateSetting('focus_mode_glow_intensity', intensity);
  };

  const setReadingRuler = async (enabled: boolean) => {
    setSettings(prev => ({ ...prev, readingRulerEnabled: enabled }));
    await updateSetting('reading_ruler_enabled', enabled);
  };

  const setTextToSpeech = async (enabled: boolean) => {
    setSettings(prev => ({ ...prev, textToSpeechEnabled: enabled }));
    await updateSetting('text_to_speech_enabled', enabled);
  };

  const setTextToSpeechVoice = async (voice: string) => {
    setSettings(prev => ({ ...prev, textToSpeechVoice: voice }));
    await updateSetting('text_to_speech_voice', voice);
  };

  const setHighContrast = async (enabled: boolean) => {
    setSettings(prev => ({ ...prev, highContrastEnabled: enabled }));
    await updateSetting('high_contrast_enabled', enabled);
  };

  const setShowTimeEstimates = async (enabled: boolean) => {
    setSettings(prev => ({ ...prev, showTimeEstimates: enabled }));
    await updateSetting('show_time_estimates', enabled);
  };

  const loadHotkeys = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: student } = await supabase
      .from('students')
      .select('hotkey_settings')
      .eq('user_id', user.id)
      .maybeSingle();

    if (student?.hotkey_settings) {
      setHotkeys(student.hotkey_settings as Record<string, string>);
    }
  };

  const matchesHotkey = (e: KeyboardEvent | MouseEvent, hotkey: string): boolean => {
    const parts = hotkey.split('+');
    const hasCtrl = parts.includes('ctrl');
    const hasShift = parts.includes('shift');
    const hasAlt = parts.includes('alt');
    const key = parts[parts.length - 1];

    const modifiersMatch = (
      (!hasCtrl || e.ctrlKey || (e as KeyboardEvent).metaKey) &&
      (!hasShift || e.shiftKey) &&
      (!hasAlt || e.altKey)
    );

    if (key.startsWith('mouse')) {
      const mouseEvent = e as MouseEvent;
      const buttonNumber = parseInt(key.replace('mouse', ''));
      const buttonMap: Record<number, number> = { 1: 0, 2: 2, 3: 1, 4: 3, 5: 4 };
      return modifiersMatch && mouseEvent.button === buttonMap[buttonNumber];
    }

    return modifiersMatch && (e as KeyboardEvent).key.toLowerCase() === key;
  };

  const toggleControl = (controlId: string) => {
    switch (controlId) {
      case 'bionic':
        // This will be handled by BionicReadingContext
        const bionicEvent = new CustomEvent('toggleBionic');
        window.dispatchEvent(bionicEvent);
        break;
      case 'dyslexia':
        setDyslexiaFont(!settings.dyslexiaFontEnabled);
        break;
      case 'ruler':
        setReadingRuler(!settings.readingRulerEnabled);
        break;
      case 'tts':
        setTextToSpeech(!settings.textToSpeechEnabled);
        break;
      case 'focus':
        setFocusMode(!settings.focusModeEnabled);
        break;
      case 'contrast':
        setHighContrast(!settings.highContrastEnabled);
        break;
    }
  };

  // Global hotkey listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      Object.entries(hotkeys).forEach(([controlId, hotkey]) => {
        if (!hotkey.includes('mouse') && matchesHotkey(e, hotkey)) {
          e.preventDefault();
          toggleControl(controlId);
        }
      });
    };

    const handleMouseClick = (e: MouseEvent) => {
      Object.entries(hotkeys).forEach(([controlId, hotkey]) => {
        if (hotkey.includes('mouse') && matchesHotkey(e, hotkey)) {
          e.preventDefault();
          toggleControl(controlId);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseClick);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseClick);
    };
  }, [hotkeys, settings]);

  // Prevent context menu for right-click hotkeys
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const hasRightClickHotkey = Object.values(hotkeys).some(hotkey => 
        hotkey.includes('mouse2')
      );
      
      if (hasRightClickHotkey) {
        e.preventDefault();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    return () => window.removeEventListener('contextmenu', handleContextMenu);
  }, [hotkeys]);

  return (
    <AccessibilityContext.Provider
      value={{
        ...settings,
        setDyslexiaFont,
        setLineSpacing,
        setLetterSpacing,
        setColorOverlay,
        setFocusMode,
        setFocusModeOverlayOpacity,
        setFocusModeGlowColor,
        setFocusModeGlowIntensity,
        setReadingRuler,
        setTextToSpeech,
        setTextToSpeechVoice,
        setHighContrast,
        setShowTimeEstimates,
        hotkeys,
        loadHotkeys,
        availableVoices,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
