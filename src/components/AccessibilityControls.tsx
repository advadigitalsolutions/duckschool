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
    hotkeys: contextHotkeys,
    loadHotkeys: loadContextHotkeys,
  } = useAccessibility();

  const [editingHotkey, setEditingHotkey] = useState<string | null>(null);
  const [recordingKey, setRecordingKey] = useState(false);
  const [newHotkey, setNewHotkey] = useState('');

  // Use hotkeys from context
  const hotkeys = contextHotkeys;

  const loadHotkeys = async () => {
    await loadContextHotkeys();
  };

  // Handle keyboard recording for hotkeys  
  useEffect(() => {
    if (!recordingKey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const parts = [];
      if (e.ctrlKey || e.metaKey) parts.push('ctrl');
      if (e.shiftKey) parts.push('shift');
      if (e.altKey) parts.push('alt');
      if (e.key && !['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
        parts.push(e.key.toLowerCase());
      }
      setNewHotkey(parts.join('+'));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recordingKey]);

  // Handle mouse button recording
  useEffect(() => {
    if (!recordingKey) return;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      const parts = [];
      
      // Capture modifier keys
      if (e.ctrlKey || e.metaKey) parts.push('ctrl');
      if (e.shiftKey) parts.push('shift');
      if (e.altKey) parts.push('alt');
      
      // Capture mouse button
      switch (e.button) {
        case 0:
          parts.push('mouse1'); // Left click
          break;
        case 1:
          parts.push('mouse3'); // Middle click
          break;
        case 2:
          parts.push('mouse2'); // Right click
          break;
        case 3:
          parts.push('mouse4'); // Back button
          break;
        case 4:
          parts.push('mouse5'); // Forward button
          break;
      }
      
      if (parts.length > 0) {
        setNewHotkey(parts.join('+'));
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, [recordingKey]);

  // No longer need these functions here - they're removed since we use context
  // matchesHotkey and toggleControl are not needed in this component anymore

  const saveHotkey = async (controlId: string, hotkey: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newHotkeys = { ...hotkeys, [controlId]: hotkey };

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

      // Reload hotkeys from context to update global listeners
      await loadContextHotkeys();
      
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

    // Reload hotkeys from context to update global listeners
    await loadContextHotkeys();
    
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
              Press a key combination or click a mouse button to use for{' '}
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
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onKeyDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => {
                  setRecordingKey(false);
                  saveHotkey(editingHotkey!, newHotkey);
                }}
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
