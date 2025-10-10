import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Type, 
  Ruler, 
  Volume2, 
  Eye, 
  Sparkles,
  Keyboard,
  X
} from 'lucide-react';
import { useBionicReading } from '@/contexts/BionicReadingContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AccessibilityControl {
  id: string;
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
  toggle: () => void;
}

export function AccessibilityControls() {
  const { enabled: bionicEnabled, setEnabled: setBionicEnabled } = useBionicReading();
  const {
    dyslexiaFontEnabled,
    readingRulerEnabled,
    textToSpeechEnabled,
    focusModeEnabled,
    highContrastEnabled,
    setDyslexiaFont,
    setReadingRuler,
    setTextToSpeech,
    setFocusMode,
    setHighContrast,
  } = useAccessibility();

  const [hotkeys, setHotkeys] = useState<Record<string, string>>({});
  const [editingHotkey, setEditingHotkey] = useState<string | null>(null);
  const [recordingKey, setRecordingKey] = useState(false);
  const [newHotkey, setNewHotkey] = useState('');

  useEffect(() => {
    loadHotkeys();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (recordingKey) {
        e.preventDefault();
        const parts = [];
        if (e.ctrlKey || e.metaKey) parts.push('ctrl');
        if (e.shiftKey) parts.push('shift');
        if (e.altKey) parts.push('alt');
        if (e.key && !['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
          parts.push(e.key.toLowerCase());
        }
        setNewHotkey(parts.join('+'));
        return;
      }

      // Check if any hotkey matches
      Object.entries(hotkeys).forEach(([controlId, hotkey]) => {
        if (matchesHotkey(e, hotkey)) {
          e.preventDefault();
          toggleControl(controlId);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recordingKey, hotkeys, bionicEnabled, dyslexiaFontEnabled, readingRulerEnabled, textToSpeechEnabled, focusModeEnabled, highContrastEnabled]);

  const matchesHotkey = (e: KeyboardEvent, hotkey: string): boolean => {
    const parts = hotkey.split('+');
    const hasCtrl = parts.includes('ctrl');
    const hasShift = parts.includes('shift');
    const hasAlt = parts.includes('alt');
    const key = parts[parts.length - 1];

    return (
      (!hasCtrl || e.ctrlKey || e.metaKey) &&
      (!hasShift || e.shiftKey) &&
      (!hasAlt || e.altKey) &&
      e.key.toLowerCase() === key
    );
  };

  const toggleControl = (controlId: string) => {
    switch (controlId) {
      case 'bionic':
        setBionicEnabled(!bionicEnabled);
        break;
      case 'dyslexia':
        setDyslexiaFont(!dyslexiaFontEnabled);
        break;
      case 'ruler':
        setReadingRuler(!readingRulerEnabled);
        break;
      case 'tts':
        setTextToSpeech(!textToSpeechEnabled);
        break;
      case 'focus':
        setFocusMode(!focusModeEnabled);
        break;
      case 'contrast':
        setHighContrast(!highContrastEnabled);
        break;
    }
  };

  const loadHotkeys = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: student } = await supabase
        .from('students')
        .select('hotkey_settings')
        .eq('user_id', user.id)
        .maybeSingle();

      if (student?.hotkey_settings) {
        setHotkeys(student.hotkey_settings as Record<string, string>);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('hotkey_settings')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.hotkey_settings) {
        setHotkeys(profile.hotkey_settings as Record<string, string>);
      }
    } catch (error) {
      console.error('Error loading hotkeys:', error);
    }
  };

  const saveHotkey = async (controlId: string, hotkey: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newHotkeys = { ...hotkeys, [controlId]: hotkey };
      setHotkeys(newHotkeys);

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (student) {
        await supabase
          .from('students')
          .update({ hotkey_settings: newHotkeys })
          .eq('id', student.id);
      } else {
        await supabase
          .from('profiles')
          .update({ hotkey_settings: newHotkeys })
          .eq('id', user.id);
      }

      toast.success('Hotkey saved!');
      setEditingHotkey(null);
      setNewHotkey('');
      setRecordingKey(false);
    } catch (error) {
      console.error('Error saving hotkey:', error);
      toast.error('Failed to save hotkey');
    }
  };

  const removeHotkey = async (controlId: string) => {
    const newHotkeys = { ...hotkeys };
    delete newHotkeys[controlId];
    setHotkeys(newHotkeys);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (student) {
      await supabase
        .from('students')
        .update({ hotkey_settings: newHotkeys })
        .eq('id', student.id);
    } else {
      await supabase
        .from('profiles')
        .update({ hotkey_settings: newHotkeys })
        .eq('id', user.id);
    }

    toast.success('Hotkey removed');
  };

  const controls: AccessibilityControl[] = [
    {
      id: 'bionic',
      name: 'Bionic Reading',
      icon: <BookOpen className="h-5 w-5" />,
      enabled: bionicEnabled,
      toggle: () => setBionicEnabled(!bionicEnabled),
    },
    {
      id: 'dyslexia',
      name: 'Dyslexia Font',
      icon: <Type className="h-5 w-5" />,
      enabled: dyslexiaFontEnabled,
      toggle: () => setDyslexiaFont(!dyslexiaFontEnabled),
    },
    {
      id: 'ruler',
      name: 'Reading Ruler',
      icon: <Ruler className="h-5 w-5" />,
      enabled: readingRulerEnabled,
      toggle: () => setReadingRuler(!readingRulerEnabled),
    },
    {
      id: 'tts',
      name: 'Text-to-Speech',
      icon: <Volume2 className="h-5 w-5" />,
      enabled: textToSpeechEnabled,
      toggle: () => setTextToSpeech(!textToSpeechEnabled),
    },
    {
      id: 'focus',
      name: 'Focus Mode',
      icon: <Sparkles className="h-5 w-5" />,
      enabled: focusModeEnabled,
      toggle: () => setFocusMode(!focusModeEnabled),
    },
    {
      id: 'contrast',
      name: 'High Contrast',
      icon: <Eye className="h-5 w-5" />,
      enabled: highContrastEnabled,
      toggle: () => setHighContrast(!highContrastEnabled),
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {controls.map((control) => (
          <Card 
            key={control.id}
            className={`transition-all cursor-pointer hover:shadow-md ${
              control.enabled ? 'ring-2 ring-primary bg-primary/5' : ''
            }`}
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div 
                  className={`p-2 rounded-lg ${
                    control.enabled ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                >
                  {control.icon}
                </div>
                <Switch
                  checked={control.enabled}
                  onCheckedChange={control.toggle}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium leading-none">
                  {control.name}
                </Label>
                <div className="flex items-center gap-1">
                  {hotkeys[control.id] ? (
                    <>
                      <kbd className="px-2 py-0.5 text-xs bg-muted rounded border">
                        {hotkeys[control.id]}
                      </kbd>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeHotkey(control.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingHotkey(control.id);
                      }}
                    >
                      <Keyboard className="h-3 w-3 mr-1" />
                      Set hotkey
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={editingHotkey !== null} onOpenChange={() => {
        setEditingHotkey(null);
        setRecordingKey(false);
        setNewHotkey('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Hotkey</DialogTitle>
            <DialogDescription>
              Press the key combination you want to use for{' '}
              {controls.find(c => c.id === editingHotkey)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={newHotkey}
                placeholder="Press keys..."
                readOnly
                className="flex-1"
              />
              <Button
                onClick={() => setRecordingKey(!recordingKey)}
                variant={recordingKey ? 'destructive' : 'default'}
              >
                {recordingKey ? 'Stop' : 'Record'}
              </Button>
            </div>
            {newHotkey && (
              <Button
                onClick={() => saveHotkey(editingHotkey!, newHotkey)}
                className="w-full"
              >
                Save Hotkey
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
