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
  highContrastEnabled: boolean;
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
  setHighContrast: (enabled: boolean) => Promise<void>;
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
    highContrastEnabled: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
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
      .select('dyslexia_font_enabled, line_spacing, letter_spacing, color_overlay, focus_mode_enabled, focus_mode_overlay_opacity, focus_mode_glow_color, focus_mode_glow_intensity, reading_ruler_enabled, text_to_speech_enabled, high_contrast_enabled')
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
        highContrastEnabled: student.high_contrast_enabled || false,
      });
      return;
    }

    // If not a student, try profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('dyslexia_font_enabled, line_spacing, letter_spacing, color_overlay, focus_mode_enabled, focus_mode_overlay_opacity, focus_mode_glow_color, focus_mode_glow_intensity, reading_ruler_enabled, text_to_speech_enabled, high_contrast_enabled')
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
        highContrastEnabled: profile.high_contrast_enabled || false,
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
    root.style.setProperty('--focus-glow-intensity', `${settings.focusModeGlowIntensity / 100}`);
    
    // Remove all glow classes and add the selected one
    body.classList.remove('focus-glow-yellow', 'focus-glow-blue', 'focus-glow-green', 'focus-glow-purple', 'focus-glow-red', 'focus-glow-rainbow', 'focus-glow-trans', 'focus-glow-none');
    if (settings.focusModeGlowColor !== 'yellow') {
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

  const setHighContrast = async (enabled: boolean) => {
    setSettings(prev => ({ ...prev, highContrastEnabled: enabled }));
    await updateSetting('high_contrast_enabled', enabled);
  };

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
        setHighContrast,
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
